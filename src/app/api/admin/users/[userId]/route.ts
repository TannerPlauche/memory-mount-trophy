import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/app/services/user.service';
import { JWTService } from '@/app/services/jwt.service';

// PUT - Update user (admin only)
export async function PUT(
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

    // Get request body
    const body = await request.json();
    const { email, name, role } = body;

    // Validate required fields
    if (!email || !name || !role) {
      return NextResponse.json(
        { error: 'Email, name, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be either "user" or "admin"' },
        { status: 400 }
      );
    }

    // Update user
    const result = await UserService.updateUser(userId, {
      email,
      name,
      role
    });

    if (!result) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'User updated successfully', user: result },
      { status: 200 }
    );

  } catch (error) {
    console.error('Update user error:', error);

    // Handle duplicate email error
    if (error instanceof Error && error.message.includes('duplicate key error')) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user (admin only)
export async function DELETE(
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

    // Prevent admin from deleting themselves
    if (userId === decodedToken.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user
    const result = await UserService.deleteUser(userId);

    if (!result) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
