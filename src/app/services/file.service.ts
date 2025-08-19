import { del, list, put } from '@vercel/blob';
import { ReadStream } from 'fs';
import { iTrophyFile } from '../shared/types/types';
import { imageFileTypes, videoFileTypes, MAX_IMAGE_FILE_SIZE, MAX_VIDEO_FILE_SIZE } from '../shared/constants/constants';
import axios from 'axios';

export async function createFile(trophyId: string, fileName: string, file: ReadStream): Promise<any> {
    if (!trophyId || !fileName || !file) {
        throw new Error('Missing required parameters: trophyId, fileName, or file');
    }

    const files = await listFiles(trophyId);
    console.log('Existing files count:', files.length);
    
    if (files.length > 0) {
        await emptyBucket(files);
    }

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

export const getFiles = async (trophyId: string): Promise<iTrophyFile[] | { error: string }> => {
    try {
        if (!trophyId) {
            throw new Error('Trophy ID is required');
        }

        const response = await axios.get(`/api/trophy/${trophyId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching files:', error);
        return { error: 'Failed to fetch files' };
    }
};

export const deleteTrophyFile = async (trophyId: string, file: iTrophyFile): Promise<{ success: boolean; error?: string }> => {
    try {
        if (!trophyId || !file) {
            throw new Error('Trophy ID and file are required');
        }

        if (!file.downloadUrl) {
            throw new Error('File download URL is required');
        }

        console.log('Deleting file:', file.name);
        const encodedUrl = encodeURIComponent(file.downloadUrl);

        const response = await axios.delete(`/api/trophy/${trophyId}/delete`, {
            params: {
                downloadUrl: encodedUrl
            }
        });

        return { success: true };
    } catch (error) {
        console.error('Error deleting file:', error);
        return { success: false, error: 'Failed to delete file' };
    }
};

export const listFiles = async (folder: string): Promise<any[]> => {
    try {
        if (!folder) {
            throw new Error('Folder name is required');
        }

        const token = process.env.BLOB_READ_WRITE_TOKEN;
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

export const emptyBucket = async (files: any[]): Promise<void> => {
    if (!files || files.length === 0) {
        return;
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
        throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not set');
    }

    console.log('Deleting files, count:', files.length);
    
    await Promise.all(files.map(async (file) => {
        if (file && file.url) {
            await del(file.url, { token });
        }
    }));
};

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
};

export const sortFiles = (files: (File | iTrophyFile)[]): { 
    videoFiles: (File | iTrophyFile)[], 
    imageFiles: (File | iTrophyFile)[], 
    otherFiles: (File | iTrophyFile)[] 
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

    const { videoFiles, imageFiles, otherFiles } = sortFiles(files);

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