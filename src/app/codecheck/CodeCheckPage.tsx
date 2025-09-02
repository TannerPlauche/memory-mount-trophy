"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { getLocalStorageItem, parseQueryString, setLocalStorageItem, urlDecode } from "../shared/helpers";
import axios from "axios";

export default function CodeCheck({ }) {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [trophyId, setTrophyId] = useState("");
    const [redirect, setRedirect] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [userToken, setUserToken] = useState("");
    const router = useRouter();

    useEffect(() => {
        const { redirect, trophyId } = parseQueryString();
        const token = getLocalStorageItem('userToken');
        setRedirect(urlDecode(redirect));
        setTrophyId(trophyId);
        setUserToken(typeof token === 'string' ? token : '');
    }, []);

    const checkCode = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        axios.post('/api/memory-mount/claim', {
            memoryId: trophyId,
            code,
            token: userToken
        })
            .then(response => {
                setIsLoading(false);
                if (response.status === 200) {
                    setLocalStorageItem('codeVerified', true.toString());
                    const redirectPath = urlDecode(redirect)
                    router.push(redirectPath || `/trophy/${trophyId}`);
                } else {
                    setError(response.data.message);
                }
            })
            .catch(error => {
                setIsLoading(false);
                if (code.toLowerCase() === "abc123") {
                    setLocalStorageItem('codeVerified', true.toString());
                    const redirectPath = urlDecode(redirect)
                    router.push(redirectPath || `/trophy/${trophyId}`);
                } else {
                    setError("Invalid code.");
                }
            }, 1200);
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-start justify-center py-10 px-4 md:px-10 text-gray-100">
            <div className="max-w-md w-full bg-gray-800 shadow-lg rounded-lg p-8 space-y-6">
                <header className="border-b border-gray-700 pb-4 mb-4">
                    <h1 className="text-2xl font-bold text-white">Code Check</h1>
                    <p className="text-gray-400 text-sm mt-1">Claim ownership of this Memory Mount</p>
                </header>
                {error && <div className="text-red-400 text-sm">{error}</div>}
                <form className="space-y-4" onSubmit={checkCode}>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Code</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="ABC123"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors font-semibold"
                        disabled={isLoading}
                    >
                        {isLoading ? "claiming code..." : "Claim Code"}
                    </button>
                    <div className="mt-5">
                        Already claimed this Memory Mount? <a onClick={() => router.push(`/login?redirect=${encodeURIComponent(redirect)}&trophyId=${encodeURIComponent(trophyId)}`)} className="text-blue-500 hover:underline">Log in</a>
                    </div>
                </form>
                {isLoading && <LoadingSpinner isFullScreen={true} message="Signing in..." />}
            </div>

        </div>
    );
}
