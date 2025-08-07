import { del, list, put } from '@vercel/blob';
import { ReadStream } from 'fs';

export async function createFile(trophyId: string, fileName: string, file: ReadStream) {
    const files = await listFiles(trophyId);
    console.log('files: ', files.length);
    if (files.length > 0) {
        await emptyBucket(files);
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    console.log('token: ', token);

    const blob = await put(`/${trophyId}/${fileName}`, file, {
        access: 'public',
        token,
        allowOverwrite: true,
        onUploadProgress: (progressEvent) => {
            console.log(`Loaded ${progressEvent.loaded} bytes`);
            console.log(`Total ${progressEvent.total} bytes`);
            console.log(`Percentage ${progressEvent.percentage}%`);
        },
    });
    return blob;
}

export const listFiles = async (folder: string) => {
    try {
        const token = process.env.BLOB_READ_WRITE_TOKEN;
        const response = await list({
            token,
            prefix: `${folder}`,
        });
        return response?.blobs || [];
    } catch (error) {
        console.error("Error listing files:", error);
        return [];
    }
}

export const emptyBucket = async (files: unknown[]) => {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    console.log('Deleting files with token: ', token);
    return Promise.all(files.map(async (file) => {
        await del((file as { url: string }).url, {
            token,
        });
    }));
}