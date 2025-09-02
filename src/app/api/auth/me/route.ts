import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/app/services/jwt.service';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
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

    // Verify and decode the JWT token
    let decoded;
    try {
      decoded = JWTService.verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Mock user data - in production, fetch from database using decoded.userId
    const mockUser = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.userId === '1' ? 'Demo User' : 'Example User'
    };

    return NextResponse.json({
      success: true,
      user: mockUser
    });

  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
