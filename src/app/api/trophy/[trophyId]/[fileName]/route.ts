import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

interface Params {
    params: Promise<{ trophyId: string; fileName: string }>;
}

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
    const { trophyId, fileName } = await params;
    console.log('fileName: ', fileName);
    console.log('trophyId: ', trophyId);

    const body = (await request.json()) as HandleUploadBody;
    console.log('body: ', body);
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
        return NextResponse.json(
            { error: 'BLOB_READ_WRITE_TOKEN is not set' },
            { status: 500 },
        );
    }
    const pathname = `/${trophyId}/${fileName}`;
    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            token,
            onBeforeGenerateToken: async (pathName, clientPayload) => {
                console.log('clientPayload: ', clientPayload);
                console.log('pathName: ', pathName);
                return {
                    pathname: `/${clientPayload}`,
                    allowedContentTypes: ['video/*'],
                    tokenPayload: JSON.stringify({
                        clientPayload: `/${trophyId}`
                    }),
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                // Get notified of client upload completion
                // ⚠️ This will not work on `localhost` websites,
                // Use ngrok or similar to get the full upload flow

                console.log('blob upload completed', blob, tokenPayload);

                try {
                    // Run any logic after the file upload completed
                    // const { userId } = JSON.parse(tokenPayload);
                    // await db.update({ avatar: blob.url, userId });
                } catch (error) {
                    throw new Error('Could not update user');
                }
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }, // The webhook will retry 5 times waiting for a 200
        );
    }
}