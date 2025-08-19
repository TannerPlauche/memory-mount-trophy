import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ trophyId: string; fileName: string }>;
}

interface TokenPayload {
    trophyId: string;
    fileName: string;
}

export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
    const { trophyId, fileName } = await params;

    try {
        const body = (await request.json()) as HandleUploadBody;
        const token = process.env.BLOB_READ_WRITE_TOKEN;

        if (!token) {
            return NextResponse.json(
                { error: 'BLOB_READ_WRITE_TOKEN is not set' },
                { status: 500 }
            );
        }

        const jsonResponse = await handleUpload({
            body,
            request,
            token,
            onBeforeGenerateToken: async (pathName, clientPayload) => {
                return {
                    pathname: `/${clientPayload}`,
                    allowedContentTypes: ['video/*', 'image/*'],
                    tokenPayload: JSON.stringify({
                        trophyId,
                        fileName
                    } as TokenPayload),
                };
            },
            onUploadCompleted: async ({ blob: _blob, tokenPayload }) => {
                // Get notified of client upload completion
                // ⚠️ This will not work on `localhost` websites,
                // Use ngrok or similar to get the full upload flow

                if (tokenPayload) {
                    try {
                        const payload: TokenPayload = JSON.parse(tokenPayload);
                        // Run any logic after the file upload completed
                        console.log('Upload completed for trophy:', payload.trophyId, 'file:', payload.fileName);
                    } catch (error) {
                        console.error('Error processing upload completion:', error);
                        throw new Error('Could not process upload completion');
                    }
                }
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        console.error('Upload handler error:', error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
    const { trophyId, fileName } = await params;
    
    try {
        const downloadUrl = request.nextUrl.searchParams.get('downloadUrl');
        const token = process.env.BLOB_READ_WRITE_TOKEN;

        if (!token) {
            return NextResponse.json(
                { error: 'BLOB_READ_WRITE_TOKEN is not set' },
                { status: 500 }
            );
        }

        if (!downloadUrl) {
            return NextResponse.json(
                { error: 'downloadUrl is required' },
                { status: 400 }
            );
        }

        const decodedDownloadUrl = decodeURIComponent(downloadUrl);
        await del(decodedDownloadUrl, { token });
        
        return NextResponse.json({ 
            success: true, 
            message: `Successfully deleted file: ${fileName} for trophy: ${trophyId}` 
        });
    } catch (error) {
        console.error('Delete handler error:', error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }
        );
    }
}