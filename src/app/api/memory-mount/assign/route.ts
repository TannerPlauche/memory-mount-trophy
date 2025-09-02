import { NextRequest, NextResponse } from 'next/server';
import { MemoryCodeService } from '@/app/services/memory-code-db.service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('body: ', body);
        const { memoryId } = body;

        // Validate required fields
        if (!memoryId) {
            return NextResponse.json(
                { error: 'Memory code is required' },
                { status: 400 }
            );
        }

        // Mark the memory code as assigned
        const assignedCode = await MemoryCodeService.markMemoryCodeAsAssigned(memoryId);

        return NextResponse.json(
            {
                message: 'Memory code marked as assigned successfully',
                memoryCode: {
                    id: assignedCode.id,
                    code: assignedCode.code,
                    isUsed: assignedCode.isUsed,
                    assignedToProduct: assignedCode.assignedToProduct,
                    userId: assignedCode.userId,
                    createdAt: assignedCode.createdAt,
                    updatedAt: assignedCode.updatedAt
                }
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Mark memory code as assigned error:', error);

        // Handle specific error cases
        if (error instanceof Error) {
            if (error.message.includes('not found')) {
                return NextResponse.json(
                    { error: 'Memory code not found' },
                    { status: 404 }
                );
            }

            if (error.message.includes('already been used')) {
                return NextResponse.json(
                    { error: 'Memory code has already been used' },
                    { status: 409 }
                );
            }

            if (error.message.includes('already been assigned')) {
                return NextResponse.json(
                    { error: 'Memory code has already been assigned to a product' },
                    { status: 409 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
