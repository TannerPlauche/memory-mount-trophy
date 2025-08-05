import { createFile } from "@/app/services/file.service";
import { redirect } from "next/navigation";
import { writeFile, unlink, } from "fs/promises";
import path from "path";
import { createReadStream } from "fs";

interface TrophyIdParams {
    params: Promise<{ trophyId: string }>;
}

export async function POST(req: Request, { params }: TrophyIdParams) {
    const { trophyId } = await params;

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file || !(file instanceof File)) {
            throw new Error("No file uploaded");
        }

        const safeFileName = file.name.replace(/[\\/\s-]/g, "_");
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
