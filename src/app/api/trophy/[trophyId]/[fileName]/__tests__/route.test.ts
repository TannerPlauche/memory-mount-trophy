/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';
import { del } from '@vercel/blob';
import { POST, DELETE } from '../route';

// Mock dependencies
jest.mock('@vercel/blob/client');
jest.mock('@vercel/blob');

const mockedHandleUpload = handleUpload as jest.MockedFunction<typeof handleUpload>;
const mockedDel = del as jest.MockedFunction<typeof del>;

// Mock NextResponse
const mockJson = jest.fn();

jest.mock('next/server', () => ({
    NextRequest: jest.fn(),
    NextResponse: {
        json: jest.fn()
    }
}));

const mockedNextResponse = NextResponse as jest.Mocked<typeof NextResponse>;

describe('/api/trophy/[trophyId]/[fileName]/route', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.BLOB_READ_WRITE_TOKEN = 'test-token';
        mockedNextResponse.json.mockImplementation((data, options) => ({
            json: () => Promise.resolve(data),
            status: options?.status || 200,
            data
        }) as any);
    });

    afterEach(() => {
        delete process.env.BLOB_READ_WRITE_TOKEN;
    });

    describe('POST', () => {
        const mockParams = Promise.resolve({ trophyId: 'trophy123', fileName: 'test-file' });
        const mockRequest = {
            json: jest.fn()
        } as any;

        it('should handle file upload successfully', async () => {
            const mockBody = { pathname: '/test/path', token: 'upload-token' };
            const mockResponse = {
                type: 'blob.upload-completed' as const,
                response: 'ok' as const
            };

            mockRequest.json.mockResolvedValue(mockBody);
            mockedHandleUpload.mockResolvedValue(mockResponse);

            const result = await POST(mockRequest, { params: mockParams });

            expect(mockRequest.json).toHaveBeenCalled();
            expect(mockedHandleUpload).toHaveBeenCalledWith({
                body: mockBody,
                request: mockRequest,
                token: 'test-token',
                onBeforeGenerateToken: expect.any(Function),
                onUploadCompleted: expect.any(Function)
            });
            expect(mockedNextResponse.json).toHaveBeenCalledWith(mockResponse);
        });

        it('should return error when BLOB_READ_WRITE_TOKEN is not set', async () => {
            delete process.env.BLOB_READ_WRITE_TOKEN;
            const mockBody = { pathname: '/test/path' };

            mockRequest.json.mockResolvedValue(mockBody);

            const result = await POST(mockRequest, { params: mockParams });

            expect(mockedNextResponse.json).toHaveBeenCalledWith(
                { error: 'BLOB_READ_WRITE_TOKEN is not set' },
                { status: 500 }
            );
        });

        it('should handle upload errors gracefully', async () => {
            const mockBody = { pathname: '/test/path' };
            const error = new Error('Upload failed');

            mockRequest.json.mockResolvedValue(mockBody);
            mockedHandleUpload.mockRejectedValue(error);

            const result = await POST(mockRequest, { params: mockParams });

            expect(mockedNextResponse.json).toHaveBeenCalledWith(
                { error: 'Upload failed' },
                { status: 400 }
            );
        });

        it('should call onBeforeGenerateToken with correct parameters', async () => {
            const mockBody = { pathname: '/test/path' };
            mockRequest.json.mockResolvedValue(mockBody);

            let onBeforeGenerateTokenCallback: any;
            mockedHandleUpload.mockImplementation((config) => {
                onBeforeGenerateTokenCallback = config.onBeforeGenerateToken;
                return Promise.resolve({
                    type: 'blob.upload-completed' as const,
                    response: 'ok' as const
                });
            });

            await POST(mockRequest, { params: mockParams });

            // Test the callback
            const result = await onBeforeGenerateTokenCallback('test-pathname', 'test-payload', {} as any);

            expect(result).toEqual({
                pathname: '/test-payload',
                allowedContentTypes: ['video/*', 'image/*'],
                tokenPayload: JSON.stringify({
                    trophyId: 'trophy123',
                    fileName: 'test-file'
                })
            });
        });

        it('should handle onUploadCompleted callback', async () => {
            const mockBody = { pathname: '/test/path' };
            mockRequest.json.mockResolvedValue(mockBody);

            let onUploadCompletedCallback: any;
            mockedHandleUpload.mockImplementation((config) => {
                onUploadCompletedCallback = config.onUploadCompleted;
                return Promise.resolve({
                    type: 'blob.upload-completed' as const,
                    response: 'ok' as const
                });
            });

            await POST(mockRequest, { params: mockParams });

            // Test the callback with valid token payload
            const mockBlob = { url: 'test-url' };
            const tokenPayload = JSON.stringify({ trophyId: 'trophy123', fileName: 'test-file' });

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await expect(onUploadCompletedCallback({ blob: mockBlob, tokenPayload })).resolves.toBeUndefined();

            expect(consoleSpy).toHaveBeenCalledWith('Upload completed for trophy:', 'trophy123', 'file:', 'test-file');

            consoleSpy.mockRestore();
        });

        it('should handle onUploadCompleted callback with invalid token payload', async () => {
            const mockBody = { pathname: '/test/path' };
            mockRequest.json.mockResolvedValue(mockBody);

            let onUploadCompletedCallback: any;
            mockedHandleUpload.mockImplementation((config) => {
                onUploadCompletedCallback = config.onUploadCompleted;
                return Promise.resolve({
                    type: 'blob.upload-completed' as const,
                    response: 'ok' as const
                });
            });

            await POST(mockRequest, { params: mockParams });

            // Test the callback with invalid token payload
            const mockBlob = { url: 'test-url' };
            const tokenPayload = 'invalid-json';

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            await expect(onUploadCompletedCallback({ blob: mockBlob, tokenPayload })).rejects.toThrow('Could not process upload completion');

            expect(consoleErrorSpy).toHaveBeenCalledWith('Error processing upload completion:', expect.any(SyntaxError));

            consoleErrorSpy.mockRestore();
        });

        it('should handle onUploadCompleted callback with no token payload', async () => {
            const mockBody = { pathname: '/test/path' };
            mockRequest.json.mockResolvedValue(mockBody);

            let onUploadCompletedCallback: any;
            mockedHandleUpload.mockImplementation((config) => {
                onUploadCompletedCallback = config.onUploadCompleted;
                return Promise.resolve({
                    type: 'blob.upload-completed' as const,
                    response: 'ok' as const
                });
            });

            await POST(mockRequest, { params: mockParams });

            // Test the callback with no token payload
            const mockBlob = { url: 'test-url' };

            await expect(onUploadCompletedCallback({ blob: mockBlob, tokenPayload: null })).resolves.toBeUndefined();
        });
    });

    describe('DELETE', () => {
        const mockParams = Promise.resolve({ trophyId: 'trophy123', fileName: 'test-file' });

        it('should delete file successfully', async () => {
            const downloadUrl = 'https://blob.vercel-storage.com/test.mp4';
            const mockRequest = {
                nextUrl: {
                    searchParams: {
                        get: jest.fn().mockReturnValue(downloadUrl)
                    }
                }
            } as any;

            mockedDel.mockResolvedValue(undefined as any);

            const result = await DELETE(mockRequest, { params: mockParams });

            expect(mockRequest.nextUrl.searchParams.get).toHaveBeenCalledWith('downloadUrl');
            expect(mockedDel).toHaveBeenCalledWith(decodeURIComponent(downloadUrl), { token: 'test-token' });
            expect(mockedNextResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Successfully deleted file: test-file for trophy: trophy123'
            });
        });

        it('should return error when BLOB_READ_WRITE_TOKEN is not set', async () => {
            delete process.env.BLOB_READ_WRITE_TOKEN;
            const mockRequest = {
                nextUrl: {
                    searchParams: {
                        get: jest.fn().mockReturnValue('https://test.com/file.mp4')
                    }
                }
            } as any;

            const result = await DELETE(mockRequest, { params: mockParams });

            expect(mockedNextResponse.json).toHaveBeenCalledWith(
                { error: 'BLOB_READ_WRITE_TOKEN is not set' },
                { status: 500 }
            );
        });

        it('should return error when downloadUrl is missing', async () => {
            const mockRequest = {
                nextUrl: {
                    searchParams: {
                        get: jest.fn().mockReturnValue(null)
                    }
                }
            } as any;

            const result = await DELETE(mockRequest, { params: mockParams });

            expect(mockedNextResponse.json).toHaveBeenCalledWith(
                { error: 'downloadUrl is required' },
                { status: 400 }
            );
        });

        it('should handle delete errors gracefully', async () => {
            const downloadUrl = 'https://blob.vercel-storage.com/test.mp4';
            const mockRequest = {
                nextUrl: {
                    searchParams: {
                        get: jest.fn().mockReturnValue(downloadUrl)
                    }
                }
            } as any;

            const error = new Error('Delete failed');
            mockedDel.mockRejectedValue(error);

            const result = await DELETE(mockRequest, { params: mockParams });

            expect(mockedNextResponse.json).toHaveBeenCalledWith(
                { error: 'Delete failed' },
                { status: 400 }
            );
        });

        it('should decode URL properly', async () => {
            const encodedUrl = 'https%3A//blob.vercel-storage.com/test%20file.mp4';
            const decodedUrl = 'https://blob.vercel-storage.com/test file.mp4';
            const mockRequest = {
                nextUrl: {
                    searchParams: {
                        get: jest.fn().mockReturnValue(encodedUrl)
                    }
                }
            } as any;

            mockedDel.mockResolvedValue(undefined as any);

            await DELETE(mockRequest, { params: mockParams });

            expect(mockedDel).toHaveBeenCalledWith(decodedUrl, { token: 'test-token' });
        });
    });

    describe('Parameter handling', () => {
        it('should extract parameters correctly from params promise', async () => {
            const mockParams = Promise.resolve({ trophyId: 'trophy456', fileName: 'another-file' });
            const mockRequest = { json: jest.fn().mockResolvedValue({}) } as any;

            mockedHandleUpload.mockResolvedValue({
                type: 'blob.upload-completed' as const,
                response: 'ok' as const
            });

            await POST(mockRequest, { params: mockParams });

            // Verify that the parameters were extracted correctly by checking the tokenPayload
            expect(mockedHandleUpload).toHaveBeenCalledWith(
                expect.objectContaining({
                    onBeforeGenerateToken: expect.any(Function)
                })
            );

            // Get the onBeforeGenerateToken function and test it
            const call = mockedHandleUpload.mock.calls[0][0];
            const onBeforeGenerateToken = call.onBeforeGenerateToken;
            const result = await onBeforeGenerateToken('test-path', 'test-payload', {} as any);

            expect(result.tokenPayload).toBeDefined();
            if (result.tokenPayload) {
                expect(JSON.parse(result.tokenPayload)).toEqual({
                    trophyId: 'trophy456',
                    fileName: 'another-file'
                });
            }
        });
    });
});
