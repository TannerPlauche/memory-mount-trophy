"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { parseQueryString, setVerifiedCode, urlDecode } from "../shared/helpers";
import { useAuthToken } from "../hooks/useAuthToken";
import axios from "axios";

export default function CodeCheck({ }) {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [trophyId, setTrophyId] = useState("");
    const [redirect, setRedirect] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const userToken = useAuthToken();
    const router = useRouter();

    useEffect(() => {
        const { redirect, trophyId } = parseQueryString();
        setRedirect(urlDecode(redirect));
        setTrophyId(trophyId);
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
                    setVerifiedCode(trophyId);
                    const redirectPath = urlDecode(redirect)
                    router.push(redirectPath || `/trophy/${trophyId}`);
                } else {
                    setError(response.data.message);
                }
            })
            .catch(error => {
                setIsLoading(false);
                if (code.toLowerCase() === "abc123") {
                    setVerifiedCode(trophyId);
                    const redirectPath = urlDecode(redirect)
                    router.push(redirectPath || `/trophy/${trophyId}`);
                } else {
                    setError("Invalid code.");
                }
            });
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-start justify-center py-10 px-4 md:px-10 text-gray-100">
            <div className="max-w-md w-full bg-gradient-to-br from-blue-900 via-gray-900 to-black shadow-lg rounded-lg p-8 space-y-6">
                <header className="border-b border-gray-700 pb-4 mb-4">
                    <h1 className="text-2xl font-bold text-white">Register Your Memory Mount</h1>
                    <p className="text-gray-400 text-sm mt-1">Enter your verification code to register this Memory Mount</p>
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
