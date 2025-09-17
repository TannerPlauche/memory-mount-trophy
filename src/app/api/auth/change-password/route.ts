import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/app/services/user.service';
import { JWTService } from '@/app/services/jwt.service';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

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

    // Change password
    await UserService.changePassword(decodedToken.userId, currentPassword, newPassword);

    return NextResponse.json(
      { message: 'Password changed successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Password change error:', error);
    
    if (error instanceof Error) {
      // Handle specific error messages
      if (error.message === 'User not found') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      if (error.message === 'Current password is incorrect') {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
      
      if (error.message === 'New password must be at least 6 characters long') {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters long' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
