import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/app/services/jwt.service';
import { UserService } from '@/app/services/user.service';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
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

        let decoded;
        try {
            decoded = JWTService.verifyToken(token);
            console.log('decoded: ', decoded);
            userId = decoded.userId;
        } catch (error) {
            console.log('error: ', error);
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        const user = await UserService.getUserById(userId);
        console.log('user: ', user);

        return NextResponse.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Me endpoint error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
