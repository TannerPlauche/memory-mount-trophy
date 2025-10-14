import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const WS_REGION = process.env.WS_REGION || 'us-central-1';
const S3_BUCKET = process.env.WS_S3_BUCKET || 'memory-mount';
const S3_FOLDER = process.env.WS_S3_FOLDER || 'uploads/';
const WS_ENDPOINT = process.env.WS_SW_ENDPOINT_URL || 's3.us-central-1.wasabisys.com';

const s3Client = new S3Client({
    region: WS_REGION,
    credentials: {
        accessKeyId: process.env.WS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.WS_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: false, // Use virtual-hosted-style URLs
    endpoint: `https://${WS_ENDPOINT}`, // Wasabi endpoint
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ trophyId: string }> }
) {
    try {
        const { trophyId } = await params;

        if (!trophyId) {
            return NextResponse.json(
                { error: 'Memory Mount Id is required' },
                { status: 400 }
            );
        }

        const prefix = `${S3_FOLDER}${trophyId}/`;

        const command = new ListObjectsV2Command({
            Bucket: S3_BUCKET,
            Prefix: prefix,
        });

        const response = await s3Client.send(command);

        if (!response.Contents || response.Contents.length === 0) {
            return NextResponse.json([]);
        }


        const files = await Promise.all(
            response.Contents
                .filter(obj => obj.Key && obj.Key !== prefix) // Filter out the folder itself
                .map(async obj => {
                    const presignedUrl = await getSignedUrl(
                        s3Client,
                        new GetObjectCommand({
                            Bucket: S3_BUCKET,
                            Key: obj.Key!,
                        }),
                        { expiresIn: 3600 } // URL valid for 1 hour
                    );
                    console.log('presignedUrl: ', presignedUrl);
                    return {
                        id: obj.Key,
                        name: obj.Key?.split('/').pop() || '',
                        url: `https://${S3_BUCKET}.${WS_ENDPOINT}/${obj.Key}`,
                        downloadUrl: presignedUrl,
                        pathname: obj.Key,
                        size: obj.Size || 0,
                        uploadedAt: obj.LastModified?.toISOString() || new Date().toISOString(),
                        lastModified: obj.LastModified?.toISOString() || new Date().toISOString(),
                    };
                })
        );
        // });

        return NextResponse.json(files);
    } catch (error) {
        console.error('S3 list error:', error);
        return NextResponse.json(
            { error: 'Failed to list files' },
            { status: 500 }
        );
    }
}
