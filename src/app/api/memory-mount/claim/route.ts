import { NextRequest, NextResponse } from 'next/server';
import { MemoryCodeService } from '@/app/services/memory-code-db.service';
import { JWTService } from '@/app/services/jwt.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memoryId, code, token } = body;

    const { userId } = JWTService.verifyToken(token);

    // Validate required fields
    if (!memoryId || !code || !userId) {
      return NextResponse.json(
        { error: 'Memory ID, code, and user ID are required' },
        { status: 400 }
      );
    }

    if (token) {
      try {
        // Ensure the user can only claim for themselves (security check)
        if (!userId ) {
          return NextResponse.json(
            { error: 'Unauthorized: Cannot claim for another user' },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }
    }

    // Claim the memory mount
    const result = await MemoryCodeService.claimMemoryMount(memoryId, code, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: result.message,
        memoryCode: result.memoryCode ? {
          id: result.memoryCode.id,
          code: result.memoryCode.code,
          userId: result.memoryCode.userId,
          usedAt: result.memoryCode.usedAt,
          assignedToProduct: result.memoryCode.assignedToProduct
        } : undefined
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Claim memory mount error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
