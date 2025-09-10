"use client";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { parseQueryString, setLocalStorageItem, urlDecode } from "../shared/helpers";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function LoginPage({ }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [trophyId, setTrophyId] = useState("");
    const [redirect, setRedirect] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // use useEffect to set redirect and trophyId
    useEffect(() => {
        const { redirect, trophyId } = parseQueryString();
        setRedirect(urlDecode(redirect));
        setTrophyId(trophyId);
    }, []);

    const handleLogin = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        //post login
        axios.post('/api/auth/login', { email, password })
            .then(response => {
                setLocalStorageItem('userToken', response?.data?.user?.token);
                const redirectUrl = urlDecode(redirect);
                router.push(redirectUrl || `/trophy/${trophyId}`);
            })
            .catch(error => {
                console.log('error: ', error);
                setError("Invalid email or password.");
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-start justify-center py-10 px-4 md:px-10 text-gray-100">
            <div className="max-w-md w-full bg-gray-800 shadow-lg rounded-lg p-8 space-y-6">
                <header className="border-b border-gray-700 pb-4 mb-4">
                    <h1 className="text-2xl font-bold text-white">Login</h1>
                    <p className="text-gray-400 text-sm mt-1">Sign in to claim your Memory Mount account</p>
                </header>
                {error && <div className="text-red-400 text-sm">{error}</div>}
                <form className="space-y-4" onSubmit={handleLogin}>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="demo@trophy.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors font-semibold"
                        disabled={isLoading}
                    >
                        {isLoading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
                <div>
                    <p>No account? <a onClick={() => router.push(`/signup?redirect=${redirect}&trophyId=${trophyId}`)} className="text-blue-500 hover:underline">Sign up</a></p>
                </div>
                {isLoading && <LoadingSpinner isFullScreen={true} message="Signing in..." />}
            </div>
        </div>
    );
}
