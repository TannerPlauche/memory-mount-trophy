// S3 CORS Configuration Script
// This script configures CORS settings for the S3 bucket to allow browser uploads
// Run with: node scripts/configure-s3-cors.js

const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const WS_REGION = process.env.WS_REGION || 'us-central-1';
const S3_BUCKET = process.env.WS_S3_BUCKET || 'memory-mount';
const WS_ENDPOINT = process.env.WS_SW_ENDPOINT_URL || 's3.us-central-1.wasabisys.com';

const s3Client = new S3Client({
    region: WS_REGION,
    credentials: {
        accessKeyId: process.env.WS_ACCESS_KEY_ID,
        secretAccessKey: process.env.WS_SECRET_ACCESS_KEY,
    },
    endpoint: `https://${WS_ENDPOINT}`,
});

const corsConfiguration = {
    CORSRules: [
        {
            AllowedHeaders: [
                'Authorization',
                'Content-Type',
                'Content-Length',
                'Content-MD5',
                'x-amz-checksum-crc32',
                'x-amz-sdk-checksum-algorithm',
                'x-amz-content-sha256',
                'x-amz-date',
                'x-amz-user-agent'
            ],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: [
                'http://localhost:3000',
                'http://localhost:3001',
                'https://*.vercel.app',
                'https://memory-mount.vercel.app',
                'https://www.memorymount.com',
                'https://memorymount.com',
                'https://www.memorymount.app',
                'https://memorymount.app'
            ],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000,
        },
    ],
};

async function configureCORS() {
    try {
        console.log(`Configuring CORS for bucket: ${S3_BUCKET} in region: ${WS_REGION}`);
        
        // First, check current CORS configuration
        try {
            const getCurrentCors = new GetBucketCorsCommand({ Bucket: S3_BUCKET });
            const currentCors = await s3Client.send(getCurrentCors);
            console.log('Current CORS configuration:', JSON.stringify(currentCors.CORSRules, null, 2));
        } catch (error) {
            if (error.name === 'NoSuchCORSConfiguration') {
                console.log('No CORS configuration currently exists.');
            } else {
                console.log('Error getting current CORS:', error.message);
            }
        }

        // Set new CORS configuration
        const putCorsCommand = new PutBucketCorsCommand({
            Bucket: S3_BUCKET,
            CORSConfiguration: corsConfiguration,
        });

        await s3Client.send(putCorsCommand);
        console.log('✅ CORS configuration successfully updated!');
        
        // Verify the new configuration
        const getCorsCommand = new GetBucketCorsCommand({ Bucket: S3_BUCKET });
        const result = await s3Client.send(getCorsCommand);
        console.log('New CORS configuration:', JSON.stringify(result.CORSRules, null, 2));
        
    } catch (error) {
        console.error('❌ Error configuring CORS:', error);
        
        if (error.name === 'AccessDenied') {
            console.log('\n💡 Solutions:');
            console.log('1. Ensure your AWS credentials have s3:PutBucketCors permission');
            console.log('2. Check that the bucket name is correct:', S3_BUCKET);
            console.log('3. Verify the region is correct:', WS_REGION);
        }
    }
}

if (require.main === module) {
    configureCORS();
}

module.exports = { configureCORS, corsConfiguration };
