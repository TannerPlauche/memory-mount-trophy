import { JWTService } from "@/app/services/jwt.service";
import { MemoryCodeService } from "@/app/services/memory-code-db.service";

export async function GET(req: Request, { params }: { params: Promise<{ trophyId: string }> }) {
    const { trophyId } = await params;
    const authHeader = req.headers.get('authorization');
    let canEdit = false
    const token = JWTService.extractTokenFromHeader(authHeader);
    let userId = null;
    if (token) {
        try {
            const decoded = JWTService.verifyToken(token);
            console.log('decoded: ', decoded);
            userId = decoded?.userId || null;
        } catch {
            userId = null;
        }
    }

    try {
        const memoryMount = await MemoryCodeService.verifyMemoryCodeById(trophyId);
        if (!memoryMount) {
            return new Response(JSON.stringify({
                verified: false,
                headers: { "Content-Type": "application/json" },
            }));
        }

        console.log('memoryMount.userId === userId', memoryMount.userId, userId, memoryMount.userId === userId);
        if (memoryMount.userId === userId) {
            canEdit = true;
        }

        if (memoryMount.isUsed && memoryMount.userId) {
            return new Response(JSON.stringify({ 
                success: true, 
                verified: true, 
                canEdit, 
                name: memoryMount.name || null,
                message: 'Memory mount is claimed' 
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        } else {
            return new Response(JSON.stringify({ 
                success: true, 
                verified: false, 
                canEdit, 
                name: memoryMount.name || null,
                message: 'Memory mount is unclaimed' 
            }), {
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
