import { del, list, put } from '@vercel/blob';
import { ReadStream } from 'fs';
import { iTrophyFile } from '../shared/types/types';
import { imageFileTypes, videoFileTypes } from '../shared/constants/constants';

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

export const getFileType = (file: iTrophyFile | File): string => {
    if (!file) {
        return '';
    }

    // For File objects from the file system
    if ('name' in file && file.name) {
        return file.name.split('.').pop()?.toLowerCase() || '';
    }

    // For iTrophyFile objects from storage
    if ('pathname' in file && file.pathname) {
        return file.pathname.split('.').pop()?.toLowerCase() || '';
    }

    return '';
}

export const sortFiles = (files: File[]): { videoFiles: iTrophyFile[], imageFiles: iTrophyFile[], otherFiles: iTrophyFile[] } => {
    const videoFiles = files.filter(file => videoFileTypes.includes(getFileType(file))) as iTrophyFile[];
    const imageFiles = files.filter(file => imageFileTypes.includes(getFileType(file))) as iTrophyFile[];
    const otherFiles = files.filter(file => !imageFileTypes.includes(getFileType(file)) && !videoFileTypes.includes(getFileType(file))) as iTrophyFile[];

    return {
        videoFiles,
        imageFiles,
        otherFiles
    };

};

export const validateFiles = (files: File[]): { valid: boolean; message?: string } => {
    const { videoFiles, imageFiles, otherFiles } = sortFiles(files);

    if (videoFiles?.length > 1) {
        return {
            valid: false,
            message: 'Only one video file is allowed.',
        };
    }

    if (otherFiles?.length > 0) {
        return {
            valid: false,
            message: `Only image and video (${imageFileTypes.join(', ')}, ${videoFileTypes.join(', ')}) files are allowed.`,
        };
    }

    if (!videoFiles?.length && !imageFiles?.length) {
        return {
            valid: false,
            message: 'At least one video or image file is required.',
        };
    }

    return { valid: true, message: 'File validation successful.' };
}