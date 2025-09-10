import { MemoryCodeService } from "@/app/services/memory-code-db.service";

export async function GET(req: Request, { params }: { params: Promise<{ trophyId: string }> }) {
    const { trophyId } = await params;
    console.log('verifying ownership for: ', trophyId);

    try {
        const memoryMount = await MemoryCodeService.verifyMemoryCodeById(trophyId);
        console.log('memoryMount: ', memoryMount);
        if (!memoryMount) {
            return new Response(JSON.stringify({
                verified: false,
                headers: { "Content-Type": "application/json" },
            }));
        }


        if (memoryMount.isUsed && memoryMount.userId) {
            return new Response(JSON.stringify({ success: true, verified: true, message: 'Memory mount is claimed' }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        } else {
            return new Response(JSON.stringify({ success: true, verified: false, message: 'Memory mount is unclaimed' }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }
    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
