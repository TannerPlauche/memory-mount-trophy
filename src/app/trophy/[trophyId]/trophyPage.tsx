"use client";
import { useParams } from 'next/navigation';
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { Oval } from 'react-loader-spinner';
import Lightbox from "yet-another-react-lightbox";
import Inline from "yet-another-react-lightbox/plugins/inline";
import { upload } from '@vercel/blob/client';
import { iTrophyFile } from '@/app/shared/types/types';
import { imageFileTypes, MAX_IMAGE_FILE_SIZE, MAX_VIDEO_FILE_SIZE } from '@/app/shared/constants/constants';
import { sortFiles, validateFiles } from '@/app/services/file.service';

import "yet-another-react-lightbox/styles.css";

const publicPrefix = process.env.PUBLIC_PREFIX;

// Reusable Loading Spinner Component
const LoadingSpinner = ({ isFullScreen = false, message = "Loading" }: { isFullScreen?: boolean; message?: string }) => {
    const spinnerContent = (
        <>
            <h2 className='pb-10 text-xl'>{message}</h2>
            <Oval
                visible={true}
                height="180"
                width="180"
                color="#4fa94d"
                ariaLabel="oval-loading"
                wrapperStyle={{}}
                wrapperClass=""
            />
        </>
    );

    if (isFullScreen) {
        return (
            <div className="flex flex-col items-center align-center justify-baseline min-h-screen fixed top-10 left-0 right-0">
                <div className='bg-gray-600 p-10 rounded-lg shadow-lg text-center'>
                    {spinnerContent}
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <Oval
                visible={true}
                height="80"
                width="80"
                color="#4fa94d"
                ariaLabel="oval-loading"
                wrapperStyle={{}}
                wrapperClass=""
            />
        </div>
    );
};

export default function TrophyPage() {
    const { trophyId } = useParams();
    const [fileError, setFileError] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [fileErrorMessage, setFileErrorMessage] = useState<string>('');
    const [imageErrorMessage, setImageErrorMessage] = useState<string>('');
    const [videoFile, setVideoFile] = useState<iTrophyFile | null>(null);
    const [imageFiles, setImageFiles] = useState<iTrophyFile[]>([]);
    const [slides, setSlides] = useState<{ src: string; width: number; height: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [lightboxIsOpen, setLightboxIsOpen] = useState(false);
    const [index, setIndex] = useState(0);

    // useRef to hold the file input element
    const videoInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const fileNameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await axios.get(`/api/trophy/${trophyId}`);
                
                if (response.data.error) {
                    setFileError(true);
                    setFileErrorMessage(response.data.error);
                } else if (response.data?.length > 0) {
                    const sortedFiles = sortByLastModified(response.data);
                    const { videoFiles, imageFiles } = sortFiles(sortedFiles);
                    
                    setFileError(false);
                    setFileErrorMessage('');
                    
                    // Set video file if available
                    if (videoFiles.length > 0) {
                        const videoFileWithUrl = {
                            ...videoFiles[0],
                            publicUrl: publicPrefix + videoFiles[0].Key,
                            name: videoFiles[0].Key,
                        };
                        setVideoFile(videoFileWithUrl);
                    }
                    
                    // Set image files and slides
                    const processedImageFiles = imageFiles.map((file) => ({
                        ...file,
                        publicUrl: publicPrefix + file.Key,
                        name: file.Key,
                    }));
                    
                    setImageFiles(processedImageFiles);
                    setSlides(imageFiles.map((imageFile) => ({
                        src: imageFile.url, 
                        width: 800, 
                        height: 600 
                    })));
                }
            } catch (err) {
                console.log('Error fetching files:', err);
                setFileError(true);
                setFileErrorMessage('No file uploaded. Please upload a file.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFiles();
    }, [trophyId]);

    const sortByLastModified = (files: iTrophyFile[]) => {
        return files.sort((a, b) => {
            const aDate = new Date(a.uploadedAt);
            const bDate = new Date(b.uploadedAt);
            return bDate.getTime() - aDate.getTime(); // Sort descending
        });
    };

    const checkFileSize = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            if (file.size > MAX_VIDEO_FILE_SIZE) {
                setFileError(true);
                setFileErrorMessage('Please upload a smaller file. Videos must be smaller than 1GB');
                input.value = ''; // Clear the input
            } else {
                setFileError(false);
                setFileErrorMessage('');
            }
        }
    };

    const checkImagesFileSize = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        if (input.files && input.files.length > 0) {
            const imageFiles = Array.from(input.files);
            const largeImages = imageFiles.filter((file) => file.size > MAX_IMAGE_FILE_SIZE);

            if (largeImages.length > 0) {
                setImageError(true);
                setImageErrorMessage('Image files must be smaller than 10MB.');
                input.value = ''; // Clear the input
            } else {
                setImageError(false);
                setImageErrorMessage('');
            }

        }
    };

    const uploadFiles = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setIsUploading(true)
        const fileName = fileNameRef.current?.value || '';
        const safeFileName = fileName.replace(/[\\/\s-]/g, "_");

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

        // I am allowing a user to upload a video and images separately, but a video is required. So there may not be a a video selected
        // because it has already been uploaded. So, account for the video file/input being empty.
        const selectedVideoFile = videoInputRef.current && videoInputRef.current.files ? videoInputRef.current.files[0] : undefined;
        const selectedImageFiles = Array.from(imageInputRef?.current?.files || []);
        const filesToValidate = [selectedVideoFile, ...selectedImageFiles].filter((f): f is File => !!f);
        const { valid, message } = validateFiles(filesToValidate);

        if (!valid) {
            setFileError(true);
            setFileErrorMessage(message || 'Invalid file type or size.');
            setIsUploading(false);
            return;
        }

        try {
            if (selectedVideoFile) {
                const videoFileType = selectedVideoFile.name.split('.').pop() || 'mp4'; // Default to mp4 if no extension
                const renamedFile = new File([selectedVideoFile], `${safeFileName}.${videoFileType}`, { type: videoFileType });
                await upload(`/${trophyId}/${renamedFile.name}`, renamedFile, {
                    access: 'public',
                    handleUploadUrl: `/api/trophy/${trophyId}/${safeFileName}`,
                });
            }

            if (selectedImageFiles) {
                await Promise.all(selectedImageFiles.map(async (imageFile) => {
                    const imageFileType = imageFile.name.split('.').pop() || 'jpg'; // Default to jpg if no extension
                    const safeImageName = imageFile.name.replace(/[\\/\s-]/g, "_");
                    const renamedImageFile = new File([imageFile], `${safeImageName}.${imageFileType}`, { type: imageFileType });
                    return await upload(`/${trophyId}/${renamedImageFile.name}`, renamedImageFile, {
                        access: 'public',
                        handleUploadUrl: `/api/trophy/${trophyId}/${safeImageName}`,
                    });
                }));
            }

            setIsUploading(false);
            window.location.reload(); // Reload the page to fetch the new file
        } catch (error) {
            console.error('Error uploading file:', error);
            setFileError(true);
            setFileErrorMessage('Error uploading file. Please try again.');
            setIsUploading(false);
        }
    }

    const replaceVideo = () => {
        const replacePrompt = confirm('Are you sure you want to replace the video? This will remove the current video.');

        if (!replacePrompt) {
            return;
        }

        // Reset video state
        setVideoFile(null);
        setFileError(false);
        setFileErrorMessage('');

        // Clear form inputs
        if (fileNameRef.current) {
            fileNameRef.current.value = '';
        }

        if (videoInputRef.current) {
            videoInputRef.current.value = '';
        }
    };


    const updateIndex = (when: boolean) =>
        ({ index: current }: { index: number }) => {
            if (when === lightboxIsOpen) {
                setIndex(current);
            }
        };

    const toggleOpen = (open: boolean) => {
        setLightboxIsOpen(open);
    };

    return (
        !isLoading ? (
            <div className="min-h-screen bg-gray-900 py-10 px-4 md:px-10 text-gray-100">
                <div className="max-w-3xl mx-auto bg-gray-800 shadow-lg rounded-lg p-6 space-y-6">
                    <header className="border-b border-gray-700 pb-4">
                        <h1 className="text-3xl font-bold text-white">Memory Mount</h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Trophy ID: <span className="font-mono text-blue-400">{trophyId}</span>
                        </p>

                    </header>

                    {fileError && (
                        <div className="text-red-400 text-sm">{fileErrorMessage}</div>
                    )}

                    {!videoFile ? (
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">
                                Upload a Trophy Video
                            </h2>
                            {isUploading && <LoadingSpinner isFullScreen={true} message="Uploading" />}
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
                                <button
                                    type="button"
                                    onClick={uploadFiles}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    Submit Trophy Video
                                </button>
                            </form>

                        </section>
                    ) : (
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">
                                Trophy Video
                            </h2>
                            <ul className="mb-4 space-y-2">
                                <li>
                                    <a
                                        href={videoFile.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:underline break-all text-sm"
                                    >
                                        {videoFile.name}
                                    </a>
                                </li>
                            </ul>
                            <div className="rounded overflow-hidden border border-gray-700 shadow-sm">
                                <video
                                    src={videoFile.url}
                                    controls
                                    className="w-full max-h-[500px] bg-black"
                                >
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        </section>
                    )}

                    {!imageFiles.length ? (
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">
                                Upload Trophy Images
                            </h2>
                            {isUploading && <LoadingSpinner isFullScreen={true} message="Uploading" />}
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
                                    Submit Trophy Images
                                </button>
                            </form>
                        </section>
                    ) : (
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">
                                Trophy Images
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
                        </section>
                    )}
                </div>
                {!!videoFile && <a
                    className="inline-block mt-2 text-blue-400 hover:underline text-sm fixed bottom-5"
                    onClick={() => replaceVideo()}
                >
                    Replace Video
                </a>
                }
            </div>
        ) : (
            <LoadingSpinner />
        )
    );
}
