import { NextResponse } from 'next/server';

export async function GET() {
    const config = {
        region: process.env.AWS_REGION || 'NOT_SET',
        bucket: process.env.AWS_S3_BUCKET || 'NOT_SET',
        folder: process.env.AWS_S3_FOLDER || 'NOT_SET',
        accessKeyConfigured: !!process.env.AWS_ACCESS_KEY_ID,
        secretKeyConfigured: !!process.env.AWS_SECRET_ACCESS_KEY,
        expectedEndpoint: `https://s3.${process.env.AWS_REGION || 'us-east-2'}.amazonaws.com`,
        expectedBucketUrl: `https://${process.env.AWS_S3_BUCKET || 'memory-mount'}.s3.${process.env.AWS_REGION || 'us-east-2'}.amazonaws.com`
    };

    return NextResponse.json({
        message: 'S3 Configuration Debug Info',
        config,
        note: 'This endpoint should be removed before production deployment'
    });
}
