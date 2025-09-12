import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

const S3_BUCKET = process.env.AWS_S3_BUCKET || 'memory-mount';
const S3_FOLDER = process.env.AWS_S3_FOLDER || 'uploads/';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ trophyId: string }> }
) {
    try {
        const { trophyId } = await params;
        
        if (!trophyId) {
            return NextResponse.json(
                { error: 'Trophy ID is required' },
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

        const files = response.Contents
            .filter(obj => obj.Key && obj.Key !== prefix) // Filter out the folder itself
            .map(obj => ({
                id: obj.Key,
                name: obj.Key?.split('/').pop() || '',
                url: `https://${S3_BUCKET}.s3.us-east-2.amazonaws.com/${obj.Key}`,
                downloadUrl: `https://${S3_BUCKET}.s3.us-east-2.amazonaws.com/${obj.Key}`,
                pathname: obj.Key,
                size: obj.Size || 0,
                uploadedAt: obj.LastModified?.toISOString() || new Date().toISOString(),
                lastModified: obj.LastModified?.toISOString() || new Date().toISOString(),
            }));

        return NextResponse.json(files);
    } catch (error) {
        console.error('S3 list error:', error);
        return NextResponse.json(
            { error: 'Failed to list files' },
            { status: 500 }
        );
    }
}
