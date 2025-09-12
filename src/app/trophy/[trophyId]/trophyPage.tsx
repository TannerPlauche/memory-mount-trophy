"use client";
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import Lightbox from 'yet-another-react-lightbox';
import Inline from 'yet-another-react-lightbox/plugins/inline';
import { iTrophyFile } from '@/app/shared/types/types';
import { imageFileTypes, MAX_IMAGE_FILE_SIZE, MAX_VIDEO_FILE_SIZE } from '@/app/shared/constants/constants';
import { deleteFile, getFiles, sortFiles, validateFiles } from '@/app/services/file.service';
import 'yet-another-react-lightbox/styles.css';
import Modal from '@/app/components/Modal/Modal';
import { getVerifiedCode, urlEncode } from '@/app/shared/helpers';
import { useAuthToken } from '@/app/hooks/useAuthToken';
import Image from 'next/image';
import { Menu, MenuButton } from '@szhsin/react-menu';
import { MenuAlt } from 'geist-icons';
import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/zoom.css';

const publicPrefix = process.env.PUBLIC_PREFIX;


export default function TrophyPage() {
    const router = useRouter();
    const { trophyId } = useParams();
    const [fileError, setFileError] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [fileErrorMessage, setFileErrorMessage] = useState('');
    const [imageErrorMessage, setImageErrorMessage] = useState('');
    const [videoFile, setVideoFile] = useState<iTrophyFile | null>(null);
    const [imageFiles, setImageFiles] = useState<iTrophyFile[]>([]);
    const [slides, setSlides] = useState<{ src: string; width: number; height: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>('');
    const [lightboxIsOpen, setLightboxIsOpen] = useState(false);
    const [index, setIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSize, setSelectedSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
    const userToken = useAuthToken();
    console.log('userToken: ', userToken);
    const [codeVerified, setCodeVerified] = useState<string | boolean>('');
    const [canEdit, setCanEdit] = useState(false);
    const [memoryMountName, setMemoryMountName] = useState<string | null>(null);

    const uploadToS3 = async (file: File, trophyId: string, fileName: string, trophyName?: string) => {
        const fileSizeLimit = 4 * 1024 * 1024; // 4MB - Vercel function payload limit
        
        if (file.size > fileSizeLimit) {
            // Use presigned URL for large files
            return uploadLargeFileToS3(file, trophyId, fileName, trophyName);
        } else {
            // Use direct upload for small files
            return uploadSmallFileToS3(file, trophyId, fileName, trophyName);
        }
    };

    const uploadLargeFileToS3 = async (file: File, trophyId: string, fileName: string, trophyName?: string) => {
        try {
            setUploadProgress('Getting upload URL...');
            
            // Step 1: Get presigned POST data
            const presignedResponse = await fetch('/api/upload/s3-presigned', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileName,
                    fileType: file.type,
                    trophyId,
                }),
            });

            if (!presignedResponse.ok) {
                throw new Error('Failed to get presigned URL');
            }

            const { presignedPost, fileUrl } = await presignedResponse.json();

            setUploadProgress('Uploading to cloud storage...');
            
            // Step 2: Upload directly to S3 using presigned POST
            const formData = new FormData();
            
            // Add all the required fields from the presigned post
            Object.entries(presignedPost.fields).forEach(([key, value]) => {
                formData.append(key, value as string);
            });
            
            // Add the file last
            formData.append('file', file);

            const uploadResponse = await fetch(presignedPost.url, {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload file to S3');
            }

            // Step 3: Complete upload and update memory code name
            if (trophyName) {
                setUploadProgress('Finalizing upload...');
                await fetch('/api/upload/s3-complete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        trophyId,
                        trophyName,
                    }),
                });
            }

            setUploadProgress('');
            return fileUrl;
        } catch (error) {
            setUploadProgress('');
            console.error('Large file upload error:', error);
            throw error;
        }
    };

    const uploadSmallFileToS3 = async (file: File, trophyId: string, fileName: string, trophyName?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('trophyId', trophyId);
        formData.append('fileName', fileName);
        if (trophyName) {
            formData.append('trophyName', trophyName);
        }

        const response = await fetch('/api/upload/s3', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const result = await response.json();
        return result.url;
    };

    const openModal = (size: 'sm' | 'md' | 'lg' | 'xl') => {
        setSelectedSize(size);
        setIsModalOpen(true);
    };
    const closeModal = () => setIsModalOpen(false);

    // useRef to hold the file input element
    const videoInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const fileNameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const code = getVerifiedCode(trophyId as string);
        if (code) {
            setCodeVerified(code);
        }
    }, [trophyId]);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                if (!trophyId || typeof trophyId !== 'string') {
                    setFileError(true);
                    setFileErrorMessage('Invalid trophy ID.');
                    setIsLoading(false);
                    return;
                }
                const fileData = await getFiles(trophyId);
                if (!fileData?.length) {
                    setFileError(true);
                    setFileErrorMessage('No file uploaded. Please upload a file.');
                } else {
                    const sortedFiles = sortByLastModified(fileData);
                    const { videoFiles, imageFiles } = sortFiles<iTrophyFile>(sortedFiles);
                    setFileError(false);
                    setFileErrorMessage('');
                    if (videoFiles.length > 0) {
                        console.log(`Video file found: ${videoFiles[0].downloadUrl}`);
                        setVideoFile({
                            ...videoFiles[0],
                            url: videoFiles[0].downloadUrl,
                            name: videoFiles[0].downloadUrl,
                        });
                    }
                    const processedImageFiles = imageFiles.map((file) => ({
                        ...file,
                        url: file.url,
                        name: file.url,
                    }));
                    setImageFiles(processedImageFiles);
                    setSlides(imageFiles.map((imageFile) => ({
                        src: imageFile.url,
                        width: 800,
                        height: 600
                    })));
                }
            } catch (err) {
                console.error('err: ', err);
                setFileError(true);
                setFileErrorMessage('No file uploaded. Please upload a file.');
            } finally {
                setIsLoading(false);
            }
        };

        const verifyMountClaimed = async () => {
            try {
                if (!trophyId || typeof trophyId !== 'string') {
                    setFileError(true);
                    setFileErrorMessage('Invalid trophy ID.');
                    setIsLoading(false);
                    return;
                }

                const response = await fetch(`${publicPrefix || ''}/api/memory-mount/verify/${trophyId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userToken}`
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                if (data.verified) {
                    setCodeVerified(true);
                    setCanEdit(data.canEdit || false);
                    setMemoryMountName(data.name || null);
                } else {
                    setCodeVerified(false);
                    setFileError(true);
                    setFileErrorMessage('This memory mount has not been claimed yet. Please claim it first.');
                    setMemoryMountName(data.name || null);
                }
            } catch (err) {
                console.error('Verification error: ', err);
                setFileError(true);
                setFileErrorMessage('Error verifying memory mount. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        if (codeVerified && userToken) {
            fetchFiles();
        } else {
            verifyMountClaimed();
        }

    }, [trophyId, codeVerified, userToken]);

    const sortByLastModified = (files: iTrophyFile[]) =>
        files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    const checkFileSize = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.size > MAX_VIDEO_FILE_SIZE) {
            setFileError(true);
            setFileErrorMessage('Please upload a smaller file. Videos must be smaller than 1GB');
            e.target.value = '';
        } else {
            setFileError(false);
            setFileErrorMessage('');
        }
    };

    const checkImagesFileSize = (e: React.ChangeEvent<HTMLInputElement>) => {
        const imageFiles = Array.from(e.target.files || []);
        const largeImages = imageFiles.filter((file) => file.size > MAX_IMAGE_FILE_SIZE);
        if (largeImages.length > 0) {
            setImageError(true);
            setImageErrorMessage('Image files must be smaller than 10MB.');
            e.target.value = '';
        } else {
            setImageError(false);
            setImageErrorMessage('');
        }
    };

    const uploadFiles = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setIsUploading(true);
        const fileName = fileNameRef.current?.value || '';
        const safeFileName = fileName.replace(/[\\/\s-]/g, '_');
        if (!videoFile) {
            if (!fileName) {
                setFileError(true);
                setFileErrorMessage('Please enter a file name.');
                setIsUploading(false);
                return;
            }
            if (!videoInputRef.current) {
                setFileError(true);
                setFileErrorMessage('File input is not available.');
                setIsUploading(false);
                return;
            }
            if (!videoInputRef.current?.files) {
                throw new Error('No file selected');
            }
        }
        const selectedVideoFile = videoInputRef.current?.files?.[0];
        const selectedImageFiles = Array.from(imageInputRef.current?.files || []);
        const filesToValidate = [selectedVideoFile, ...selectedImageFiles].filter((f): f is File => !!f);
        const { valid, message } = validateFiles(filesToValidate);
        if (!valid) {
            setFileError(true);
            setFileErrorMessage(message || 'Invalid file type or size.');
            setIsUploading(false);
            return;
        }
        try {
            const trophyName = fileName; // Use the fileName input as the trophy name

            if (selectedVideoFile) {
                const videoFileType = selectedVideoFile.name.split('.').pop() || 'mp4';
                const renamedFile = new File([selectedVideoFile], `${safeFileName}.${videoFileType}`, { type: selectedVideoFile.type });
                await uploadToS3(renamedFile, trophyId as string, renamedFile.name, trophyName);
            }
            if (selectedImageFiles.length) {
                await Promise.all(selectedImageFiles.map(async (imageFile) => {
                    const safeImageName = imageFile.name.replace(/[\\/\s-]/g, '_');
                    const renamedImageFile = new File([imageFile], `${safeImageName}`, { type: imageFile.type });
                    return await uploadToS3(renamedImageFile, trophyId as string, renamedImageFile.name, trophyName);
                }));
            }
            setIsUploading(false);
            window.location.reload();
        } catch (err) {
            console.error('err: ', err);
            setFileError(true);
            setFileErrorMessage('Error uploading file. Please try again.');
            setIsUploading(false);
        }
    };

    const deleteImage = async (file: iTrophyFile) => {
        if (confirm(`Are you sure you want to delete ${file.name}? This action cannot be undone.`)) {
            const result = await deleteFile(trophyId as string, file);
            if (result.success) {
                const updatedImageFiles = imageFiles.filter((img) => img.pathname !== file.pathname);
                setImageFiles(updatedImageFiles);
                setSlides(updatedImageFiles.map((imageFile) => ({
                    src: imageFile.url,
                    width: 800,
                    height: 600
                })));
            }
        }
    };

    const showImageUpload = () => {
        if (!userToken) {
            setVideoFile(null);
            setImageFiles([]);
            return;
        }
        if (confirm('Are you sure you want to replace the video? This will remove the current video.')) {
            setImageFiles([]);
        }
    };

    // Removed unused displayErrorTemp

    const replaceVideo = () => {
        if (!confirm('Are you sure you want to replace the video? This will remove the current video.')) return;
        setVideoFile(null);
        setFileError(false);
        setFileErrorMessage('');
        if (fileNameRef.current) fileNameRef.current.value = '';
        if (videoInputRef.current) videoInputRef.current.value = '';
    };

    // Removed unused openEditImagesModal
    const openEditImagesModal = () => {
        if (!confirm('Are you sure you want to edit images? Deleted images cannot be recovered.')) return;
        openModal('md')
    }

    const updateIndex = (when: boolean) =>
        ({ index: current }: { index: number }) => {
            if (when === lightboxIsOpen) setIndex(current);
        };

    const toggleOpen = setLightboxIsOpen;

    // Redirects
    if (!isLoading && !videoFile && !imageFiles.length && !userToken) {
        const currentRoute = urlEncode(window.location.pathname);
        // return router.push(`/login?redirect=${currentRoute}`);
    }

    if (!isLoading && !videoFile && !imageFiles.length) {
        const currentRoute = urlEncode(window.location.pathname);
        if (userToken && !codeVerified) return router.push(`/codecheck?redirect=${currentRoute}&trophyId=${trophyId}`);
        if (!userToken) return router.push(`/login?redirect=${currentRoute}`);
    }

    return !isLoading ? (
        <div className="min-h-screen bg-gray-900 py-10 px-4 md:px-10 text-gray-100">
            <div className="max-w-3xl mx-auto bg-gradient-to-br from-blue-900 via-gray-900 to-black shadow-lg rounded-lg p-6 space-y-6">
                <header className="border-b border-gray-700 pb-4 flex justify-between">
                    <div>
                        <p className="text-gray-400 text-sm mt-1">
                            Trophy ID: <span className="font-mono text-blue-400">{trophyId}</span>
                        </p>
                        {memoryMountName && (
                            <p className="text-gray-300 text-lg font-semibold mt-2">
                                {memoryMountName}
                            </p>
                        )}
                    </div>
                </header>
                {
                    fileError && (
                        <div className="text-red-400 text-sm">{fileErrorMessage}</div>
                    )
                }

                {
                    canEdit && !videoFile ? (
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">
                                Select a Trophy Video
                            </h2>
                            {isUploading && <LoadingSpinner isFullScreen={true} message={uploadProgress || "Uploading"} />}
                            <form className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Trophy Name
                                    </label>
                                    <input
                                        id="fileName"
                                        ref={fileNameRef}
                                        type="text"
                                        name="fileName"
                                        placeholder="e.g., Elk Hunt 2024"
                                        className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Upload Video
                                    </label>
                                    <input
                                        id="videoInput"
                                        ref={videoInputRef}
                                        type="file"
                                        name="file"
                                        accept="video/*"
                                        onChange={checkFileSize}
                                        className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
                                    />
                                </div>
                            </form>
                            {(!videoFile && !!imageFiles.length) && (
                                <button
                                    type="button"
                                    onClick={uploadFiles}
                                    className="my-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    Submit
                                </button>
                            )}
                        </section>
                    ) : null
                }
                {!!videoFile && (
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">
                            {memoryMountName ? `${memoryMountName} Video` : 'Memory Mount Video'}
                        </h2>
                        {/* <ul className="mb-4 space-y-2">
                                <li>
                                    <a
                                        href={videoFile.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className=" hover:underline break-all text-sm"
                                    >
                                        {videoFile.name}
                                    </a>
                                </li>
                            </ul> */}
                        <div className="rounded overflow-hidden border border-gray-700 shadow-sm">
                            <video
                                src={videoFile ? videoFile.downloadUrl : ''}
                                controls
                                className="w-full max-h-[500px] bg-black"
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </section>
                )
                }

                {
                    canEdit && !imageFiles.length ? (
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">
                                Select Memory Mount Images
                            </h2>
                            {isUploading && <LoadingSpinner isFullScreen={true} message={uploadProgress || "Uploading"} />}
                            <form className="space-y-4">
                                {imageError && (
                                    <div className="text-red-400 text-sm">{imageErrorMessage}</div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Upload Images
                                    </label>
                                    <input
                                        id="imageInput"
                                        ref={imageInputRef}
                                        type="file"
                                        name="file"
                                        accept={imageFileTypes.join(',')}
                                        multiple
                                        onChange={checkImagesFileSize}
                                        className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={uploadFiles}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    Submit
                                </button>
                            </form>
                        </section>
                    ) : null
                }
                {!!imageFiles.length && (
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">
                            {memoryMountName ? `${memoryMountName} Images` : 'Memory Mount Images'}
                        </h2>
                        <Lightbox
                            open={lightboxIsOpen}
                            close={() => toggleOpen(false)}
                            index={index}
                            plugins={[Inline]}
                            on={{
                                view: updateIndex(true),
                                click: () => toggleOpen(true),
                            }}
                            carousel={{
                                padding: 0,
                                spacing: 0,
                                imageFit: "cover",
                            }}
                            inline={{
                                style: {
                                    aspectRatio: "3 / 2",
                                    margin: "0 auto",
                                },
                            }}
                            slides={slides}
                        />

                        {lightboxIsOpen && (
                            <Lightbox
                                open={lightboxIsOpen}
                                close={() => toggleOpen(false)}
                                index={index}
                                slides={slides}
                                on={{ view: updateIndex(true) }}
                                animation={{ fade: 0 }}
                                controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
                            />
                        )}

                        <Modal
                            isOpen={isModalOpen}
                            onClose={closeModal}
                            title="Delete Images"
                            size={selectedSize}
                        >
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-30 mt-10 mb-10">
                                    {imageFiles.map((imageFile) => (
                                        <div key={imageFile.name} className="flex flex-col space-y-2">
                                            <span className="text-sm text-gray-300 truncate">{imageFile.name}</span>
                                            <div className="relative inline-block w-32 h-32">
                                                <Image src={imageFile.downloadUrl} alt={imageFile.name} width={128} height={128} className="w-32 h-32 object-cover rounded" />
                                                <button
                                                    onClick={() => deleteImage(imageFile)}
                                                    className="delete-image absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-700 transition-colors"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={closeModal}
                                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                            {/* </div> */}
                            {/* </div> */}
                        </Modal>
                    </section>
                )
                }
                {/* Move menu items down here */}
                {canEdit && <hr className="border-gray-700 p-0 m-0" />}
                <h3 className='text-lg font-semibold p-2 m-0 text-center'>Owner Tools</h3>
                {/* {canEdit && <hr className="border-gray-700 p-0 m-0" />} */}
                <div className="mt-3 flex flex-col flex-wrap gap-4 justify-center">
                    {canEdit && !!videoFile && (
                        <button
                            className="bg-blue-900 font-semibold hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors text-sm"
                            onClick={replaceVideo}
                        >
                            Replace Video
                        </button>
                    )}
                    {canEdit && !!imageFiles.length && (
                        <button
                            className="bg-blue-900 font-semibold hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors text-sm"
                            onClick={openEditImagesModal}
                        >
                            Edit Images
                        </button>
                    )}
                    {canEdit && !!imageFiles.length && (
                        <button
                            className="bg-blue-900 font-semibold hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors text-sm"
                            onClick={showImageUpload}
                        >
                            Add Images
                        </button>
                    )}
                    {!!userToken && (
                        <button
                            className="bg-blue-900 font-semibold hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors text-sm"
                            onClick={() => router.push(`/account?redirect=${urlEncode(window.location.pathname)}`)}
                        >
                            View Account
                        </button>
                    )}
                </div>
            </div >
        </div >
    ) : (
        <LoadingSpinner />
    );
}
