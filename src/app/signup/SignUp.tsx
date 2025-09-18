"use client";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import { parseQueryString, urlDecode } from "../shared/helpers";
import axios from "axios";


export default function SignUpPage({ }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [trophyId, setTrophyId] = useState("");
    const [redirect, setRedirect] = useState("");

    const router = useRouter();

    // use useEffect to set redirect and trophyId
    useEffect(() => {
        const { redirect, trophyId } = parseQueryString();
        setRedirect(urlDecode(redirect));
        setTrophyId(trophyId);
    }, []);

    const handleSignUp = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsLoading(true);
        setError("");
        // Simulate SignUp API call

        axios.post('/api/auth/signup', {
            email,
            password,
        }).then((response) => {
            setIsLoading(false);
            const { data } = response;
            if (data && data?.user?.token) {
                // Store token in local storage or context
                localStorage.setItem("token", data.user.token);
                router.push(redirect);
            }
        }).catch(() => {
            setIsLoading(false);
            setError("Registration failed.");
        });
    };


    return (
        <div className="min-h-screen bg-darker flex items-start justify-center py-10 px-4 md:px-10 text-gray-100">
            <div className="max-w-md w-full bg-primary-dark shadow-lg rounded-lg p-8 space-y-6">
                <header className="border-b border-gray-700 pb-4 mb-4">
                    <h1 className="text-2xl font-bold text-neutral">Sign Up</h1>
                    <p className="text-primary-gold text-sm mt-1">Sign up to claim your Memory Mount account</p>
                </header>
                {error && <div className="text-red-400 text-sm">{error}</div>}
                <form className="space-y-4" onSubmit={handleSignUp}>
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
                            placeholder="password"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-primary-gold mb-1">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-primary-light text-primary-dark border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="password"
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
                    <p className="text-primary-light">Already have an account? <a onClick={() => router.push(`/login?redirect=${redirect}&trophyId=${trophyId}`)} className="text-primary-gold hover:underline">Sign in</a></p>
                </div>
                {isLoading && <LoadingSpinner isFullScreen={true} message="Signing in..." />}
            </div>
        </div>
    );
}
