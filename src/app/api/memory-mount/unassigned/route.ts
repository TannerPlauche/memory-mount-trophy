import { NextResponse } from 'next/server';
import { MemoryCodeService } from '@/app/services/memory-code-db.service';

export async function GET() {
  try {
    // Get a single unassigned memory code
    const memoryCode = await MemoryCodeService.getUnassignedMemoryCode();

    if (!memoryCode) {
      return NextResponse.json(
        { message: 'No unassigned memory codes available' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Unassigned memory code found',
        memoryCode: {
          id: memoryCode.id,
          code: memoryCode.code,
          isUsed: memoryCode.isUsed,
          assignedToProduct: memoryCode.assignedToProduct,
          createdAt: memoryCode.createdAt
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get unassigned memory code error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
