import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/app/services/jwt.service';
import { UserService } from '@/app/services/user.service';
import { MemoryCodeService } from '@/app/services/memory-code-db.service';

// GET user memory mounts (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Extract and verify token
    const token = authHeader.substring(7);
    let decodedToken;
    try {
      decodedToken = JWTService.verifyToken(token);
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const currentUser = await UserService.getUserById(decodedToken.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check if target user exists
    const targetUser = await UserService.getUserById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's memory mounts
    const memoryMounts = await MemoryCodeService.getMemoryCodesByUserId(userId);

    return NextResponse.json(
      { memoryMounts },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get user memory mounts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
