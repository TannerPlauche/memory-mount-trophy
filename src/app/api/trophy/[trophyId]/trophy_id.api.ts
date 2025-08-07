import { createFile, listFiles } from "@/app/services/file.service";
import { redirect } from "next/navigation";
import { writeFile, unlink, } from "fs/promises";
import path from "path";
import { createReadStream } from "fs";

interface TrophyIdParams {
    params: Promise<{ trophyId: string }>;
}

export async function GET(req: Request, { params }: { params: Promise<{ trophyId: string }> }) {
    const { trophyId } = await params;
    console.log('getting files for: ', trophyId);
    if (!trophyId || typeof trophyId !== 'string') {
        console.error("Invalid trophyId:", trophyId);
        return new Response(JSON.stringify({ error: "Trophy ID is required" }), {
            status: 400,
        });
    }
    try {
        const files = await listFiles(trophyId);

        if (!files || files.length === 0) {
            console.warn("No files found for trophyId:", trophyId);
            return new Response(JSON.stringify({ error: "No files found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify(files), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

export async function POST(req: Request, { params }: TrophyIdParams) {
    const { trophyId } = await params;
    console.log('creating file for trophyId: ', trophyId);

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const fileName = formData.get("name") as string;
        if (!file) {
            throw new Error("No file uploaded");
        }

        const safeFileName = fileName.replace(/[\\/\s-]/g, "_");
        const localFilePath = path.join(process.cwd(), "public/assets", safeFileName);

        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(localFilePath, buffer);

        const readStream = createReadStream(localFilePath);
        const result = await createFile(trophyId, `${safeFileName}.mp4`, readStream);

        unlink(localFilePath).catch((err) =>
            console.error("Failed to delete local file:", err)
        );

        if (result.error) {
            console.error("Upload error:", result.error);
        }

        // Redirect regardless of error or success
        return redirect(`/trophy/${trophyId}`);
    } catch (err) {
        console.error("POST error:", err);
        return redirect(`/trophy/${(await params).trophyId}`);
    }
}
