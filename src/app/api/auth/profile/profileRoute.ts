import { JWTService } from "@/app/services/jwt.service";
import { UserService } from "@/app/services/user.service";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
    const { name, email } = await req.json();
    const authHeader = req.headers.get('authorization');
    let userId = null;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
            { error: 'Authorization token required' },
            { status: 401 }
        );
    }

    const token = JWTService.extractTokenFromHeader(authHeader);

    if (!token) {
        return NextResponse.json(
            { error: 'Invalid authorization header' },
            { status: 401 }
        );
    }

    // Verify the JWT token
    try {
       const {userId: tokenUserId} = JWTService.verifyToken(token);
       userId = tokenUserId;
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid or expired token' },
            { status: 401 }
        );
    }

    UserService.updateUser(userId, { name, email });

    return new Response(JSON.stringify({ user: { id: userId, name, email } }), { status: 200 });
}