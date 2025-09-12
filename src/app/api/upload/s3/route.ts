import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { MemoryCodeService } from '@/app/services/memory-code-db.service';

const AWS_REGION = process.env.AWS_REGION || 'us-east-2';
const S3_BUCKET = process.env.AWS_S3_BUCKET || 'memory-mount';
const S3_FOLDER = process.env.AWS_S3_FOLDER || 'uploads/';

const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: false, // Use virtual-hosted-style URLs
    endpoint: `https://s3.${AWS_REGION}.amazonaws.com`, // Explicit endpoint
});

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const trophyId = formData.get('trophyId') as string;
        const fileName = formData.get('fileName') as string;
        const trophyName = formData.get('trophyName') as string; // New field for trophy name

        if (!file || !trophyId || !fileName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const key = `${S3_FOLDER}${trophyId}/${fileName}`;

        const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        });

        await s3Client.send(command);

        // Update memory code name if trophyName is provided
        if (trophyName && trophyName.trim()) {
            try {
                await MemoryCodeService.updateMemoryCodeName(trophyId, trophyName.trim());
                console.log(`Updated memory code ${trophyId} name to: ${trophyName}`);
            } catch (nameUpdateError) {
                console.error('Failed to update memory code name:', nameUpdateError);
                // Don't fail the upload if name update fails
            }
        }

        const fileUrl = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;

        return NextResponse.json({
            success: true,
            url: fileUrl,
            key: key
        });
    } catch (error) {
        console.error('S3 upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}
