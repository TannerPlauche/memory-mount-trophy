import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';

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
    forcePathStyle: false, // Wasabi supports virtual-hosted-style URLs
    endpoint: `https://${WS_ENDPOINT}`,
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { fileName, fileType, trophyId } = body;

        if (!fileName || !fileType || !trophyId) {
            return NextResponse.json(
                { error: 'Missing required fields: fileName, fileType, trophyId' },
                { status: 400 }
            );
        }

        const key = `${S3_FOLDER}${trophyId}/${fileName}`;

        // Use createPresignedPost instead of getSignedUrl for better browser compatibility
        const { url, fields } = await createPresignedPost(s3Client, {
            Bucket: S3_BUCKET,
            Key: key,
            Conditions: [
                ['content-length-range', 0, 100 * 1024 * 1024], // 100MB max
                ['eq', '$Content-Type', fileType]
            ],
            Fields: {
                'Content-Type': fileType,
            },
            Expires: 600, // 10 minutes
        });

        const fileUrl = `https://${S3_BUCKET}.${WS_ENDPOINT}/${key}`;

        return NextResponse.json({
            success: true,
            presignedPost: {
                url,
                fields
            },
            fileUrl,
            key
        });
    } catch (error) {
        console.error('Presigned URL generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate presigned URL' },
            { status: 500 }
        );
    }
}
