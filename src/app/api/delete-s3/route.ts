import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const AWS_REGION = process.env.AWS_REGION || 'us-east-2';
const S3_BUCKET = process.env.AWS_S3_BUCKET || 'memory-mount';

const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: false, // Use virtual-hosted-style URLs
    endpoint: `https://s3.${AWS_REGION}.amazonaws.com`, // Explicit endpoint
});

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fileKey = searchParams.get('key');

        if (!fileKey) {
            return NextResponse.json(
                { error: 'File key is required' },
                { status: 400 }
            );
        }

        const command = new DeleteObjectCommand({
            Bucket: S3_BUCKET,
            Key: fileKey,
        });

        await s3Client.send(command);

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('S3 delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete file' },
            { status: 500 }
        );
    }
}
