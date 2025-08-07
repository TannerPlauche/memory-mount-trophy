"use client";
import { useParams } from 'next/navigation';
import axios from "axios";
import { useEffect, useState } from "react";
import { Oval } from 'react-loader-spinner';

interface TrophyPageProps {
    params: { trophyId: string };
}

const publicPrefix = "https://pub-e08d3d9ccb3b41799db9d047e05263e7.r2.dev/";

export default function TrophyPage() {
    const { trophyId } = useParams();
    console.log('trophyId: ', trophyId);
    const [fileError, setFileError] = useState(false);
    const [fileErrorMessage, setFileErrorMessage] = useState<string>('');
    const [file, setFile] = useState<File & { downloadUrl: string; url: string; name: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB in bytes

    useEffect(() => {
        const fetchFile = async () => {
            try {
                const response = await axios.get(`/api/trophy/${trophyId}`);
                console.log('response: ', response);
                if (response.data.error) {
                    setFileError(true);
                    setFileErrorMessage(response.data.error);
                    setIsLoading(false);
                } else if (response.data?.length > 0) {
                    const sortedFiles = sortByLastModified(response.data);
                    console.log('sortedFiles: ', sortedFiles);
                    // Assuming the first file is the most recent one
                    setFileError(false);
                    setFileErrorMessage('');
                    // Use the first file in the sorted list
                    console.log('response.data[0]: ', response.data[0]);
                    console.log('publicPrefix: ', publicPrefix);
                    // Create a file object with the public URL and name
                    const fileWithUrl = {
                        ...sortedFiles[0],
                        publicUrl: publicPrefix + sortedFiles[0].Key,
                        name: sortedFiles[0].Key,
                    };
                    setFile(fileWithUrl);
                    setIsLoading(false);
                }
            } catch (err) {
                setFileError(true);
                setFileErrorMessage('Error fetching file.');
                setIsLoading(false);
            }
        };

        fetchFile();
    }, [trophyId]);

    const sortByLastModified = (files: any[]) => {
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
            if (file.size > MAX_FILE_SIZE) {
                setFileError(true);
                setFileErrorMessage('Please upload a smaller file.');
                input.value = ''; // Clear the input
            } else {
                setFileError(false);
                setFileErrorMessage('');
            }
        }
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
                        <a
                            className="inline-block mt-2 text-blue-400 hover:underline text-sm"
                            onClick={() => setFile(null)}
                        >
                            Edit Video
                        </a>
                    </header>

                    {fileError && (
                        <div className="text-red-400 text-sm">{fileErrorMessage}</div>
                    )}

                    {!file ? (
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">
                                Upload a Trophy Video
                            </h2>
                            {isUploading && (<div className="flex flex-col items-center align-center justify-baseline min-h-screen fixed top-10 left-0 right-0">
                                <div className='bg-gray-600 p-10 rounded-lg shadow-lg text-center'>
                                    <h2 className='pb-10 text-xl'>Uploading</h2>
                                    <Oval
                                        visible={true}
                                        height="180"
                                        width="180"
                                        color="#4fa94d"
                                        ariaLabel="oval-loading"
                                        wrapperStyle={{}}
                                        wrapperClass=""
                                    />
                                </div>
                            </div>
                            )}
                            <form
                                action={`/api/trophy/${trophyId}`}
                                method="POST"
                                encType="multipart/form-data"
                                className="space-y-4"
                                onSubmit={() => setIsUploading(true)}
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Trophy Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="e.g., Elk Hunt 2024"
                                        required
                                        className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Upload Video
                                    </label>
                                    <input
                                        id="fileInput"
                                        type="file"
                                        name="file"
                                        accept="video/*"
                                        required
                                        onChange={checkFileSize}
                                        className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    Submit Trophy
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
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:underline break-all text-sm"
                                    >
                                        {file.name}
                                    </a>
                                </li>
                            </ul>
                            <div className="rounded overflow-hidden border border-gray-700 shadow-sm">
                                <video
                                    src={file.url}
                                    controls
                                    className="w-full max-h-[500px] bg-black"
                                >
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        ) : (
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
        )
    );
}
