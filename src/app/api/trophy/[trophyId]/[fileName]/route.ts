import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

interface Params {
    params: Promise<{ trophyId: string; fileName: string }>;
}

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
    const { trophyId } = await params;
    const { fileName } = await params;

    const body = (await request.json()) as HandleUploadBody;
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
        return NextResponse.json(
            { error: 'BLOB_READ_WRITE_TOKEN is not set' },
            { status: 500 },
        );
    }
    try {
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
                    }),
                };
            },
            onUploadCompleted: async ({ blob: _blob, tokenPayload }) => {
                // Get notified of client upload completion
                // ⚠️ This will not work on `localhost` websites,
                // Use ngrok or similar to get the full upload flow
                
                try {
                    // Run any logic after the file upload completed
                    if (tokenPayload) {
                        const payload = JSON.parse(tokenPayload);
                        console.log('Upload completed for trophy:', payload.trophyId, 'file:', payload.fileName);
                    }
                } catch (error) {
                    console.error('Error processing upload completion:', error);
                    throw new Error('Could not process upload completion');
                }
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        console.error('Upload handler error:', error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }, // The webhook will retry 5 times waiting for a 200
        );
    }
}