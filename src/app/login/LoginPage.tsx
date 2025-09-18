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
                setLocalStorageItem('userToken', response?.data?.user?.token || 'sdsdsdsfdfsdf');
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
        <div className="min-h-screen bg-darker flex items-start justify-center py-10 px-4 md:px-10 text-gray-100">
            <div className="max-w-md w-full bg-primary-dark shadow-lg rounded-lg p-8 space-y-6">
                <header className="border-b border-gold pb-4 mb-4">
                    <h1 className="text-2xl font-bold text-neutral">Login</h1>
                    <p className="text-primary-gold text-sm mt-1">Sign in to claim your Memory Mount account</p>
                </header>
                {error && <div className="text-red-400 text-sm">{error}</div>}
                <form className="space-y-4" onSubmit={handleLogin}>
                    <div>
                        <label className="block text-sm font-medium text-primary-gold mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-primary-light text-primary-dark border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="demo@trophy.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-primary-gold mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-primary-light text-primary-dark border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-primary-neutral text-primary-dark px-4 py-2 rounded hover:bg-primary-gold transition-colors font-semibold"
                        disabled={isLoading}
                    >
                        {isLoading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
                <div>
                    <p className="text-neutral">No account? <a onClick={() => router.push(`/signup?redirect=${redirect}&trophyId=${trophyId}`)} className="text-primary-gold hover:underline cursor-pointer">Sign up</a></p>
                </div>
                {isLoading && <LoadingSpinner isFullScreen={true} message="Signing in..." />}
            </div>
        </div>
    );
}
