import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';

const AWS_REGION = process.env.AWS_REGION || 'us-east-2';
const S3_BUCKET = process.env.AWS_S3_BUCKET || 'memory-mount';
const S3_FOLDER = process.env.AWS_S3_FOLDER || 'uploads/';

const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: false,
    endpoint: `https://s3.${AWS_REGION}.amazonaws.com`,
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

        const fileUrl = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;

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
