import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/app/services/user.service';
import { JWTService } from '@/app/services/jwt.service';

// GET all users (admin only)
export async function GET(request: NextRequest) {
  try {
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

    // Get all users
    const { users } = await UserService.getAllUsers(1, 1000); // Get a large number to include all users

    return NextResponse.json(
      { users },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
