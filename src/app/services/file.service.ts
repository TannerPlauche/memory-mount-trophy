/* eslint-disable @typescript-eslint/no-explicit-any */
import { list, put } from '@vercel/blob';
import { ReadStream } from 'fs';
import { iTrophyFile } from '../shared/types/types';
import { imageFileTypes, videoFileTypes, MAX_IMAGE_FILE_SIZE, MAX_VIDEO_FILE_SIZE } from '../shared/constants/constants';
import axios from 'axios';

export async function createFile(trophyId: string, fileName: string, file: ReadStream) {
    if (!trophyId || !fileName || !file) {
        throw new Error('Missing required parameters: trophyId, fileName, or file');
    }

    const files = await listFiles(trophyId);
    console.log('Existing files count:', files.length);

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
        throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not set');
    }

    const blob = await put(`/${trophyId}/${fileName}`, file, {
        access: 'public',
        token,
        allowOverwrite: true,
        onUploadProgress: (progressEvent) => {
            console.log(`Upload progress: ${progressEvent.percentage}% (${progressEvent.loaded}/${progressEvent.total} bytes)`);
        },
    });

    return blob;
}

export const getFiles = async (trophyId: string): Promise<iTrophyFile[]> => {
    try {
        if (!trophyId) {
            throw new Error('Memory Mount Id is required');
        }

        // Use S3-based API instead of Vercel Blob
        const response = await axios.get(`/api/trophy-s3/${trophyId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching files:', error);
        return [];
    }
};

export const deleteFile = async (trophyId: string, file: iTrophyFile): Promise<{ success: boolean; error?: string }> => {
    try {
        if (!trophyId || !file) {
            throw new Error('Memory Mount Id and file are required');
        }

        if (!file.pathname) {
            throw new Error('File pathname is required for S3 deletion');
        }

        console.log('Deleting S3 file:', file.name);
        
        await axios.delete(`/api/delete-s3`, {
            params: {
                key: file.pathname
            }
        });

        return { success: true };
    } catch (error) {
        console.error('Error deleting file:', error);
        return { success: false, error: 'Failed to delete file' };
    }
};

export const listFiles = async (folder: string) => {
    console.log('folder: ', folder);
    try {
        if (!folder) {
            throw new Error('Folder name is required');
        }

        const token = process.env.BLOB_READ_WRITE_TOKEN;
        console.log('get file token: ', token);
        if (!token) {
            throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not set');
        }

        const response = await list({
            token,
            prefix: `${folder}`,
        });

        return response?.blobs || [];
    } catch (error) {
        console.error("Error listing files:", error);
        return [];
    }
};

export const getFileType = <T>(file: T): string => {
    if (!file) {
        return '';
    }

    // For File objects from the file system
    if (typeof file === 'object' && file !== null && 'name' in file && (file as any).name) {
        return (file as any).name.split('.').pop()?.toLowerCase() || '';
    }

    // For iTrophyFile objects from S3 storage
    if (typeof file === 'object' && file !== null && 'pathname' in file && (file as any).pathname) {
        return (file as any).pathname.split('.').pop()?.toLowerCase() || '';
    }

    // For iTrophyFile objects from Vercel Blob storage (legacy)
    if (typeof file === 'object' && file !== null && 'url' in file && (file as any).url) {
        return (file as any).url.split('.').pop()?.toLowerCase() || '';
    }

    return '';
};

// duplicate this to return 
export const sortFiles = <T>(files: (T)[]): {
    videoFiles: T[],
    imageFiles: T[],
    otherFiles: T[]
} => {
    if (!files || files.length === 0) {
        return { videoFiles: [], imageFiles: [], otherFiles: [] };
    }

    const videoFiles = files.filter(file => videoFileTypes.includes(getFileType(file)));
    const imageFiles = files.filter(file => imageFileTypes.includes(getFileType(file)));
    const otherFiles = files.filter(file =>
        !imageFileTypes.includes(getFileType(file)) &&
        !videoFileTypes.includes(getFileType(file))
    );

    return {
        videoFiles,
        imageFiles,
        otherFiles
    };
};

export const validateFiles = (files: File[]): { valid: boolean; message?: string } => {
    if (!files || files.length === 0) {
        return {
            valid: false,
            message: 'At least one file is required.',
        };
    }

    const { videoFiles, imageFiles, otherFiles } = sortFiles<File>(files);

    if (videoFiles.length > 1) {
        return {
            valid: false,
            message: 'Only one video file is allowed.',
        };
    }

    if (otherFiles.length > 0) {
        return {
            valid: false,
            message: `Only image and video files are allowed. Supported formats: ${imageFileTypes.join(', ')}, ${videoFileTypes.join(', ')}.`,
        };
    }

    if (videoFiles.length === 0 && imageFiles.length === 0) {
        return {
            valid: false,
            message: 'At least one video or image file is required.',
        };
    }

    // Check file sizes
    for (const file of files) {
        const fileType = getFileType(file);

        if (videoFileTypes.includes(fileType) && file.size > MAX_VIDEO_FILE_SIZE) {
            return {
                valid: false,
                message: `Video file "${file.name}" exceeds maximum size of ${MAX_VIDEO_FILE_SIZE / (1024 * 1024 * 1024)}GB.`,
            };
        }

        if (imageFileTypes.includes(fileType) && file.size > MAX_IMAGE_FILE_SIZE) {
            return {
                valid: false,
                message: `Image file "${file.name}" exceeds maximum size of ${MAX_IMAGE_FILE_SIZE / (1024 * 1024)}MB.`,
            };
        }
    }

    return { valid: true, message: 'File validation successful.' };
};