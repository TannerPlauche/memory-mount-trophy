"use client";
import { useParams } from 'next/navigation';
import axios from "axios";
import { useEffect, useState } from "react";

interface TrophyPageProps {
    params: { trophyId: string };
}

const publicPrefix = "https://pub-e08d3d9ccb3b41799db9d047e05263e7.r2.dev/";

export default function TrophyPage() {
    const { trophyId } = useParams();
    console.log('trophyId: ', trophyId);
    const [fileError, setFileError] = useState(false);
    const [fileErrorMessage, setFileErrorMessage] = useState<string>('');
    const [file, setFile] = useState<File & { publicUrl: string; name: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFile = async () => {
            try {
                const response = await axios.get(`/api/trophy/${trophyId}`);
                console.log('response: ', response);
                if (response.data.error) {
                    setFileError(true);
                    setFileErrorMessage(response.data.error);
                    setLoading(false);
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
                    setLoading(false);
                }
            } catch (err) {
                setFileError(true);
                setFileErrorMessage('Error fetching file.');
                setLoading(false);
            }
        };

        fetchFile();
    }, [trophyId]);

    const sortByLastModified = (files: any[]) => {
        return files.sort((a, b) => {
            const aDate = new Date(a.LastModified);
            const bDate = new Date(b.LastModified);
            return bDate.getTime() - aDate.getTime(); // Sort descending
        });
    };

    const checkFileSize = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            if (file.size > 300 * 1024 * 1024) {
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
                        <form
                            action={`/api/trophy/${trophyId}`}
                            method="POST"
                            encType="multipart/form-data"
                            className="space-y-4"
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
                                    href={file.publicUrl}
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
                                src={file.publicUrl}
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
    );
}
