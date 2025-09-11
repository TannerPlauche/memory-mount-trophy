"use client";
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import Lightbox from 'yet-another-react-lightbox';
import Inline from 'yet-another-react-lightbox/plugins/inline';
import { upload } from '@vercel/blob/client';
import { iTrophyFile } from '@/app/shared/types/types';
import { imageFileTypes, MAX_IMAGE_FILE_SIZE, MAX_VIDEO_FILE_SIZE } from '@/app/shared/constants/constants';
import { deleteFile, getFiles, sortFiles, validateFiles } from '@/app/services/file.service';
import 'yet-another-react-lightbox/styles.css';
import Modal from '@/app/components/Modal/Modal';
import { getLocalStorageItem, getVerifiedCode, urlEncode } from '@/app/shared/helpers';
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
    const [lightboxIsOpen, setLightboxIsOpen] = useState(false);
    const [index, setIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSize, setSelectedSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
    const [userToken, setUserToken] = useState('');
    const [codeVerified, setCodeVerified] = useState<string | boolean>('');
    const [canEdit, setCanEdit] = useState(false);

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
        const token = getLocalStorageItem('userToken');
        setUserToken(typeof token === 'string' ? token : '');
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
                        console.log(`Video file found: ${videoFiles[0].url}`);
                        setVideoFile({
                            ...videoFiles[0],
                            url: videoFiles[0].url,
                            name: videoFiles[0].url,
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
                } else {
                    setCodeVerified(false);
                    setFileError(true);
                    setFileErrorMessage('This memory mount has not been claimed yet. Please claim it first.');
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
            if (selectedVideoFile) {
                const videoFileType = selectedVideoFile.name.split('.').pop() || 'mp4';
                const renamedFile = new File([selectedVideoFile], `${safeFileName}.${videoFileType}`, { type: videoFileType });
                await upload(`/${trophyId}/${renamedFile.name}`, renamedFile, {
                    access: 'public',
                    handleUploadUrl: `/api/trophy/${trophyId}/${safeFileName}`,
                });
            }
            if (selectedImageFiles.length) {
                await Promise.all(selectedImageFiles.map(async (imageFile) => {
                    const imageFileType = imageFile.name.split('.').pop() || 'jpg';
                    const safeImageName = imageFile.name.replace(/[\\/\s-]/g, '_');
                    const renamedImageFile = new File([imageFile], `${safeImageName}`, { type: imageFileType });
                    return await upload(`/${trophyId}/${renamedImageFile.name}`, renamedImageFile, {
                        access: 'public',
                        handleUploadUrl: `/api/trophy/${trophyId}/${safeImageName}`,
                    });
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
        if (!userToken) {
            router.push(`/login?redirect=${urlEncode(window.location.pathname)}`);
            return;
        }
        if (confirm(`Are you sure you want to delete ${file.name}? This action cannot be undone.`)) {
            const success = await deleteFile(trophyId as string, file);
            if (success) {
                const updatedImageFiles = imageFiles.filter((img) => img.downloadUrl !== file.downloadUrl);
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
        if (!userToken) {
            router.push(`/login?redirect=${urlEncode(window.location.pathname)}`);
            return;
        }
        if (!confirm('Are you sure you want to replace the video? This will remove the current video.')) return;
        setVideoFile(null);
        setFileError(false);
        setFileErrorMessage('');
        if (fileNameRef.current) fileNameRef.current.value = '';
        if (videoInputRef.current) videoInputRef.current.value = '';
    };

    // Removed unused openEditImagesModal
    const openEditImagesModal = () => {
        if (!userToken) {
            router.push(`/login?redirect=${urlEncode(window.location.pathname)}`);
            return;
        }

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
        return router.push(`/login?redirect=${currentRoute}`);
    }

    if (!isLoading && !videoFile && !imageFiles.length) {
        const currentRoute = urlEncode(window.location.pathname);
        if (userToken && !codeVerified) return router.push(`/codecheck?redirect=${currentRoute}&trophyId=${trophyId}`);
        if (!userToken) return router.push(`/login?redirect=${currentRoute}`);
    }

    return !isLoading ? (
        <div className="min-h-screen bg-gray-900 py-10 px-4 md:px-10 text-gray-100">
            <div className="max-w-3xl mx-auto bg-gray-800 shadow-lg rounded-lg p-6 space-y-6">
                <header className="border-b border-gray-700 pb-4 flex justify-between">
                    <p className="text-gray-400 text-sm mt-1">
                        Trophy ID: <span className="font-mono text-blue-400">{trophyId}</span>
                    </p>

                    {(!!videoFile || !!imageFiles.length) && <Menu menuButton={
                        <MenuButton className="bg-gray-700 text-gray-100 px-4 py-2 rounded-md"><MenuAlt /></MenuButton>
                    }>
                        {canEdit && !!videoFile &&
                            // set hover color to gray-600
                            <div className="w-fit">
                                <a
                                    className="inline-block hover:underline py-2 text-sm cursor-pointer"
                                    onClick={() => replaceVideo()}
                                >
                                    Replace Video
                                </a>
                            </div>}

                        {canEdit && !!imageFiles.length &&
                            <div className="w-fit">
                                <a
                                    className="inline-block hover:underline py-2 text-sm cursor-pointer"
                                    onClick={openEditImagesModal}
                                >
                                    Edit Images
                                </a>
                            </div>
                        }
                        {canEdit && !!imageFiles.length &&
                            <div className="w-fit">
                                <a
                                    className="inline-block hover:underline py-2 text-sm cursor-pointer"
                                    onClick={(showImageUpload)}
                                >
                                    Add Images
                                </a>
                            </div>
                        }
                        {!!userToken &&
                            <div className="w-fit">
                                <a
                                    className="inline-block hover:underline py-2 text-sm cursor-pointer"
                                    onClick={() => router.push(`/account?redirect=${urlEncode(window.location.pathname)}`)}
                                >
                                    View Account
                                </a>
                            </div>
                        }
                    </Menu>
                    }

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
                            Memory Mount Video
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
                                src={videoFile ? videoFile.url : ''}
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
                                    Submit
                                </button>
                            </form>
                        </section>
                    ) : null
                }
                {!!imageFiles.length && (
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">
                            Memory Mount Images
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
                                                <Image src={imageFile.url} alt={imageFile.name} width={128} height={128} className="w-32 h-32 object-cover rounded" />
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
            </div >
        </div >
    ) : (
        <LoadingSpinner />
    );
}
