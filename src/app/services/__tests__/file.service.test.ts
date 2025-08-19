import {
    createFile,
    getFiles,
    deleteTrophyFile,
    listFiles,
    emptyBucket,
    getFileType,
    sortFiles,
    validateFiles
} from '../file.service';
import { del, list, put } from '@vercel/blob';
import axios from 'axios';
import { iTrophyFile } from '../../shared/types/types';
import { MAX_IMAGE_FILE_SIZE, MAX_VIDEO_FILE_SIZE } from '../../shared/constants/constants';

// Mock dependencies
jest.mock('@vercel/blob');
jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedPut = put as jest.MockedFunction<typeof put>;
const mockedList = list as jest.MockedFunction<typeof list>;
const mockedDel = del as jest.MockedFunction<typeof del>;

describe('file.service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.BLOB_READ_WRITE_TOKEN = 'test-token';
    });

    afterEach(() => {
        delete process.env.BLOB_READ_WRITE_TOKEN;
    });

    describe('createFile', () => {
        it('should create a file successfully', async () => {
            const mockFile = { pipe: jest.fn() } as any;
            const mockBlob = { 
                url: 'https://test.com/file.mp4',
                downloadUrl: 'https://test.com/file.mp4',
                pathname: '/trophy123/test.mp4',
                contentType: 'video/mp4',
                contentDisposition: 'inline'
            };

            mockedList.mockResolvedValue({ 
                blobs: [],
                hasMore: false,
                cursor: undefined
            } as any);
            mockedPut.mockResolvedValue(mockBlob as any);

            const result = await createFile('trophy123', 'test.mp4', mockFile);

            expect(mockedList).toHaveBeenCalledWith({
                token: 'test-token',
                prefix: 'trophy123'
            });
            expect(mockedPut).toHaveBeenCalledWith(
                '/trophy123/test.mp4',
                mockFile,
                expect.objectContaining({
                    access: 'public',
                    token: 'test-token',
                    allowOverwrite: true
                })
            );
            expect(result).toEqual(mockBlob);
        });

        it('should throw error when missing required parameters', async () => {
            await expect(createFile('', 'test.mp4', {} as any)).rejects.toThrow('Missing required parameters');
            await expect(createFile('trophy123', '', {} as any)).rejects.toThrow('Missing required parameters');
            await expect(createFile('trophy123', 'test.mp4', null as any)).rejects.toThrow('Missing required parameters');
        });

        it('should throw error when BLOB_READ_WRITE_TOKEN is not set', async () => {
            delete process.env.BLOB_READ_WRITE_TOKEN;
            const mockFile = { pipe: jest.fn() } as any;

            mockedList.mockResolvedValue({ 
                blobs: [],
                hasMore: false,
                cursor: undefined
            } as any);

            await expect(createFile('trophy123', 'test.mp4', mockFile)).rejects.toThrow('BLOB_READ_WRITE_TOKEN environment variable is not set');
        });

        it('should empty bucket if files exist', async () => {
            const mockFile = { pipe: jest.fn() } as any;
            const mockBlob = { 
                url: 'https://test.com/file.mp4',
                downloadUrl: 'https://test.com/file.mp4',
                pathname: '/trophy123/test.mp4',
                contentType: 'video/mp4',
                contentDisposition: 'inline'
            };
            const existingFiles = [{
                url: 'https://test.com/old.mp4',
                downloadUrl: 'https://test.com/old.mp4',
                pathname: '/trophy123/old.mp4',
                size: 1000,
                uploadedAt: new Date()
            }];

            mockedList.mockResolvedValue({ 
                blobs: existingFiles,
                hasMore: false,
                cursor: undefined
            } as any);
            mockedPut.mockResolvedValue(mockBlob as any);
            mockedDel.mockResolvedValue(undefined as any);

            await createFile('trophy123', 'test.mp4', mockFile);

            expect(mockedDel).toHaveBeenCalledWith('https://test.com/old.mp4', { token: 'test-token' });
        });
    });

    describe('getFiles', () => {
        it('should fetch files successfully', async () => {
            const mockFiles = [
                { name: 'test1.mp4', url: 'https://test.com/test1.mp4' },
                { name: 'test2.jpg', url: 'https://test.com/test2.jpg' }
            ];
            mockedAxios.get.mockResolvedValue({ data: mockFiles });

            const result = await getFiles('trophy123');

            expect(mockedAxios.get).toHaveBeenCalledWith('/api/trophy/trophy123');
            expect(result).toEqual(mockFiles);
        });

        it('should return error when trophy ID is missing', async () => {
            const result = await getFiles('');

            expect(result).toEqual({ error: 'Failed to fetch files' });
        });

        it('should handle API errors gracefully', async () => {
            mockedAxios.get.mockRejectedValue(new Error('API Error'));

            const result = await getFiles('trophy123');

            expect(result).toEqual({ error: 'Failed to fetch files' });
        });
    });

    describe('deleteTrophyFile', () => {
        it('should delete file successfully', async () => {
            const mockFile: iTrophyFile = {
                name: 'test.mp4',
                downloadUrl: 'https://test.com/test.mp4',
                uploadedAt: new Date(),
                pathname: '/trophy123/test.mp4',
                Key: 'test.mp4',
                url: 'https://test.com/test.mp4'
            } as iTrophyFile;

            mockedAxios.delete.mockResolvedValue({ data: { success: true } });

            const result = await deleteTrophyFile('trophy123', mockFile);

            expect(mockedAxios.delete).toHaveBeenCalledWith('/api/trophy/trophy123/delete', {
                params: {
                    downloadUrl: encodeURIComponent('https://test.com/test.mp4')
                }
            });
            expect(result).toEqual({ success: true });
        });

        it('should return error when parameters are missing', async () => {
            const result1 = await deleteTrophyFile('', {} as iTrophyFile);
            const result2 = await deleteTrophyFile('trophy123', null as any);

            expect(result1).toEqual({ success: false, error: 'Failed to delete file' });
            expect(result2).toEqual({ success: false, error: 'Failed to delete file' });
        });

        it('should handle API errors gracefully', async () => {
            const mockFile: iTrophyFile = {
                name: 'test.mp4',
                downloadUrl: 'https://test.com/test.mp4',
                uploadedAt: new Date(),
                pathname: '/trophy123/test.mp4',
                Key: 'test.mp4',
                url: 'https://test.com/test.mp4'
            } as iTrophyFile;

            mockedAxios.delete.mockRejectedValue(new Error('API Error'));

            const result = await deleteTrophyFile('trophy123', mockFile);

            expect(result).toEqual({ success: false, error: 'Failed to delete file' });
        });
    });

    describe('listFiles', () => {
        it('should list files successfully', async () => {
            const mockFiles = [
                { 
                    url: 'https://test.com/test1.mp4',
                    downloadUrl: 'https://test.com/test1.mp4',
                    pathname: '/trophy123/test1.mp4',
                    size: 1000,
                    uploadedAt: new Date()
                },
                { 
                    url: 'https://test.com/test2.jpg',
                    downloadUrl: 'https://test.com/test2.jpg',
                    pathname: '/trophy123/test2.jpg',
                    size: 500,
                    uploadedAt: new Date()
                }
            ];
            mockedList.mockResolvedValue({ 
                blobs: mockFiles,
                hasMore: false,
                cursor: undefined
            } as any);

            const result = await listFiles('trophy123');

            expect(mockedList).toHaveBeenCalledWith({
                token: 'test-token',
                prefix: 'trophy123'
            });
            expect(result).toEqual(mockFiles);
        });

        it('should return empty array when no files exist', async () => {
            mockedList.mockResolvedValue({ 
                blobs: [],
                hasMore: false,
                cursor: undefined
            } as any);

            const result = await listFiles('trophy123');

            expect(result).toEqual([]);
        });

        it('should return empty array when folder is missing', async () => {
            const result = await listFiles('');

            expect(result).toEqual([]);
        });

        it('should return empty array when token is missing', async () => {
            delete process.env.BLOB_READ_WRITE_TOKEN;

            const result = await listFiles('trophy123');

            expect(result).toEqual([]);
        });
    });

    describe('emptyBucket', () => {
        it('should delete all files in bucket', async () => {
            const files = [
                { url: 'https://test.com/file1.mp4' },
                { url: 'https://test.com/file2.jpg' }
            ];
            mockedDel.mockResolvedValue(undefined as any);

            await emptyBucket(files);

            expect(mockedDel).toHaveBeenCalledTimes(2);
            expect(mockedDel).toHaveBeenCalledWith('https://test.com/file1.mp4', { token: 'test-token' });
            expect(mockedDel).toHaveBeenCalledWith('https://test.com/file2.jpg', { token: 'test-token' });
        });

        it('should handle empty file list', async () => {
            await emptyBucket([]);

            expect(mockedDel).not.toHaveBeenCalled();
        });

        it('should handle null file list', async () => {
            await emptyBucket(null as any);

            expect(mockedDel).not.toHaveBeenCalled();
        });

        it('should throw error when token is missing', async () => {
            delete process.env.BLOB_READ_WRITE_TOKEN;
            const files = [{ url: 'https://test.com/file1.mp4' }];

            await expect(emptyBucket(files)).rejects.toThrow('BLOB_READ_WRITE_TOKEN environment variable is not set');
        });
    });

    describe('getFileType', () => {
        it('should extract file type from File object', () => {
            const file = new File(['content'], 'test.mp4', { type: 'video/mp4' });
            expect(getFileType(file)).toBe('mp4');
        });

        it('should extract file type from iTrophyFile object', () => {
            const file: iTrophyFile = {
                pathname: '/trophy123/test.jpg',
                name: 'test.jpg'
            } as iTrophyFile;
            expect(getFileType(file)).toBe('jpg');
        });

        it('should return empty string for invalid file', () => {
            expect(getFileType(null as any)).toBe('');
            expect(getFileType({} as any)).toBe('');
        });

        it('should handle files without extensions', () => {
            const file = new File(['content'], 'test', { type: 'video/mp4' });
            expect(getFileType(file)).toBe('test');
        });
    });

    describe('sortFiles', () => {
        it('should sort files by type correctly', () => {
            const files = [
                new File(['content'], 'video.mp4', { type: 'video/mp4' }),
                new File(['content'], 'image.jpg', { type: 'image/jpeg' }),
                new File(['content'], 'document.pdf', { type: 'application/pdf' }),
                new File(['content'], 'another.png', { type: 'image/png' })
            ];

            const result = sortFiles(files);

            expect(result.videoFiles).toHaveLength(1);
            expect(result.imageFiles).toHaveLength(2);
            expect(result.otherFiles).toHaveLength(1);
        });

        it('should handle empty file list', () => {
            const result = sortFiles([]);

            expect(result.videoFiles).toHaveLength(0);
            expect(result.imageFiles).toHaveLength(0);
            expect(result.otherFiles).toHaveLength(0);
        });

        it('should handle null/undefined input', () => {
            const result = sortFiles(null as any);

            expect(result.videoFiles).toHaveLength(0);
            expect(result.imageFiles).toHaveLength(0);
            expect(result.otherFiles).toHaveLength(0);
        });
    });

    describe('validateFiles', () => {
        it('should validate correct files', () => {
            const files = [
                new File(['content'], 'video.mp4', { type: 'video/mp4' }),
                new File(['content'], 'image.jpg', { type: 'image/jpeg' })
            ];

            const result = validateFiles(files);

            expect(result.valid).toBe(true);
            expect(result.message).toBe('File validation successful.');
        });

        it('should reject multiple video files', () => {
            const files = [
                new File(['content'], 'video1.mp4', { type: 'video/mp4' }),
                new File(['content'], 'video2.mp4', { type: 'video/mp4' })
            ];

            const result = validateFiles(files);

            expect(result.valid).toBe(false);
            expect(result.message).toBe('Only one video file is allowed.');
        });

        it('should reject unsupported file types', () => {
            const files = [
                new File(['content'], 'document.pdf', { type: 'application/pdf' })
            ];

            const result = validateFiles(files);

            expect(result.valid).toBe(false);
            expect(result.message).toContain('Only image and video files are allowed');
        });

        it('should reject empty file list', () => {
            const result = validateFiles([]);

            expect(result.valid).toBe(false);
            expect(result.message).toBe('At least one file is required.');
        });

        it('should reject files that are too large', () => {
            // Create a large video file
            const largeVideoFile = new File(['content'], 'large-video.mp4', { type: 'video/mp4' });
            Object.defineProperty(largeVideoFile, 'size', { value: MAX_VIDEO_FILE_SIZE + 1 });

            const result = validateFiles([largeVideoFile]);

            expect(result.valid).toBe(false);
            expect(result.message).toContain('exceeds maximum size');
        });

        it('should reject large image files', () => {
            // Create a large image file
            const largeImageFile = new File(['content'], 'large-image.jpg', { type: 'image/jpeg' });
            Object.defineProperty(largeImageFile, 'size', { value: MAX_IMAGE_FILE_SIZE + 1 });

            const result = validateFiles([largeImageFile]);

            expect(result.valid).toBe(false);
            expect(result.message).toContain('exceeds maximum size');
        });

        it('should accept files within size limits', () => {
            const validVideoFile = new File(['content'], 'video.mp4', { type: 'video/mp4' });
            Object.defineProperty(validVideoFile, 'size', { value: MAX_VIDEO_FILE_SIZE - 1000 });

            const validImageFile = new File(['content'], 'image.jpg', { type: 'image/jpeg' });
            Object.defineProperty(validImageFile, 'size', { value: MAX_IMAGE_FILE_SIZE - 1000 });

            const result = validateFiles([validVideoFile, validImageFile]);

            expect(result.valid).toBe(true);
            expect(result.message).toBe('File validation successful.');
        });
    });
});
