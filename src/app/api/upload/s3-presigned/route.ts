import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

        const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            ContentType: fileType,
        });

        // Generate presigned URL that expires in 10 minutes
        const presignedUrl = await getSignedUrl(s3Client, command, { 
            expiresIn: 600 
        });

        const fileUrl = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;

        return NextResponse.json({
            success: true,
            presignedUrl,
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
