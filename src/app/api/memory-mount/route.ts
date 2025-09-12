import { NextRequest, NextResponse } from 'next/server';
import { MemoryCodeService } from '@/app/services/memory-code-db.service';
import { JWTService } from '@/app/services/jwt.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const action = searchParams.get('action');
    const token = searchParams.get('token');

    const { userId: tokenUserId } = token ? JWTService.verifyToken(token) : { userId: null };

    if (tokenUserId) {
      const memoryMounts = await MemoryCodeService.getMemoryCodesByUserId(tokenUserId);
      if (memoryMounts.length > 0) {
        return NextResponse.json(
          {
            memoryCodes: memoryMounts.map(mount => ({
              id: mount.id,
              code: mount.code,
              isUsed: mount.isUsed,
              name: mount.name,
              usedAt: mount.usedAt,
              assignedToProduct: mount.assignedToProduct,
              createdAt: mount.createdAt
            }))
          },
          { status: 200 }
        );
      } else {
        return NextResponse.json(
          {
            message: 'No memory codes found for user',
            memoryCodes: []
          },
          { status: 404 }
        );
      }
    }

    // Get specific memory code by code
    if (code) {
      const memoryCode = await MemoryCodeService.getMemoryCodeByCode(code);

      if (!memoryCode) {
        return NextResponse.json(
          { error: 'Memory code not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          memoryCode: {
            id: memoryCode.id,
            code: memoryCode.code,
            isUsed: memoryCode.isUsed,
            userId: memoryCode.userId,
            usedAt: memoryCode.usedAt,
            assignedToProduct: memoryCode.assignedToProduct,
            createdAt: memoryCode.createdAt
          }
        },
        { status: 200 }
      );
    }

    // Get memory codes by user ID
    if (tokenUserId) {
      const memoryCodes = await MemoryCodeService.getMemoryCodesByUserId(tokenUserId);

      return NextResponse.json(
        {
          memoryCodes: memoryCodes.map(code => ({
            id: code.id,
            code: code.code,
            isUsed: code.isUsed,
            usedAt: code.usedAt,
            assignedToProduct: code.assignedToProduct,
            createdAt: code.createdAt
          }))
        },
        { status: 200 }
      );
    }

    // Get statistics
    if (action === 'stats') {
      const stats = await MemoryCodeService.getMemoryCodeStats();

      return NextResponse.json(
        { stats },
        { status: 200 }
      );
    }

    // Default: return general info
    return NextResponse.json(
      {
        message: 'Memory Mount API',
        endpoints: {
          'GET /api/memory-mount?code=CODE': 'Get specific memory code',
          'GET /api/memory-mount?userId=USER_ID': 'Get user memory codes',
          'GET /api/memory-mount?action=stats': 'Get memory code statistics',
          'POST /api/memory-mount/claim': 'Claim a memory mount',
          'GET /api/memory-mount/unassigned': 'Get unassigned memory code',
          'PATCH /api/memory-mount/assign': 'Mark memory code as assigned'
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Memory mount API error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Memory code is required' },
        { status: 400 }
      );
    }

    // Validate the memory code
    const validation = await MemoryCodeService.validateMemoryCode(code);

    return NextResponse.json(
      {
        isValid: validation.isValid,
        isUsed: validation.isUsed,
        message: validation.message,
        memoryCode: validation.memoryCode ? {
          id: validation.memoryCode.id,
          code: validation.memoryCode.code,
          isUsed: validation.memoryCode.isUsed,
          userId: validation.memoryCode.userId,
          assignedToProduct: validation.memoryCode.assignedToProduct,
          createdAt: validation.memoryCode.createdAt
        } : undefined
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Validate memory code error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
