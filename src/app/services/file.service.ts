const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
import multer from "multer";
import Stream from "stream";

const access_key_id = 'e44dad405fdab5501d6818217349aaec';
const access_key_secret = '412347e500c32ae40c61823b08104383a527fbf44ab9d65d8cb2ddb598a89851';
const accountId = 'f2bfff1b2a4e97eedaef00e98f115fd6';
const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    // endpoint: `https://<account_id>.r2.cloudflarestorage.com`,
    signatureVersion: "v4",
    credentials: {
        accessKeyId: access_key_id,
        secretAccessKey: access_key_secret,
    },
});


const upload = multer({ storage: multer.memoryStorage() });

const BUCKET_NAME = 'memory-mount';

// Helper to convert S3 streams to strings
const streamToString = async (stream: any) => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf-8");
};

export async function createFile(trophyId: string, fileName: string, file: any) {
    // const { folder, fileName, content } = req.body;
    const folder = 'memory-mount';
    const params = {
        Bucket: BUCKET_NAME,
        Key: `${trophyId}/${fileName}`,
        Body: file,
        ContentType: file.mimetype || "application/octet-stream",
    };


    try {
        const command = new PutObjectCommand(params);
        await s3.send(command);
        return { message: "File created successfully" };
    } catch (error) {
        return { error: error.message };
    }
}

export const listFiles = async (folder: string) => {
    const params = {
        Bucket: 'memory-mount',
        Prefix: folder + '/',
    };

    try {
        const command = new ListObjectsV2Command(params);
        const response = await s3.send(command);
        return response.Contents || [];
    } catch (error) {
        console.error("Error listing files:", error);
        return [];
    }
}