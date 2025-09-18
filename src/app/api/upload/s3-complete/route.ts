import { NextRequest, NextResponse } from 'next/server';
import { MemoryCodeService } from '@/app/services/memory-code-db.service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { trophyId, trophyName } = body;

        if (!trophyId) {
            return NextResponse.json(
                { error: 'Memory Mount Id is required' },
                { status: 400 }
            );
        }

        // Update memory code name if trophyName is provided
        if (trophyName && trophyName.trim()) {
            try {
                await MemoryCodeService.updateMemoryCodeName(trophyId, trophyName.trim());
                console.log(`Updated memory code ${trophyId} name to: ${trophyName}`);
            } catch (nameUpdateError) {
                console.error('Failed to update memory code name:', nameUpdateError);
                return NextResponse.json(
                    { error: 'Failed to update memory code name' },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Upload completed successfully'
        });
    } catch (error) {
        console.error('Upload completion error:', error);
        return NextResponse.json(
            { error: 'Failed to complete upload' },
            { status: 500 }
        );
    }
}
