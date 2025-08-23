"use client";
import { useState } from "react";
import LoadingSpinner from "@/app/components/LoadingSpinner";

interface SignUpPageProps {
    onSuccess: () => void;
    navigate: () => void;
}

export default function SignUpPage({ onSuccess, navigate }: SignUpPageProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsLoading(true);
        setError("");
        // Simulate SignUp API call
        setTimeout(() => {
            setIsLoading(false);
            // mock registration success
            // Always succeed for demo purposes
            if (true) {
                onSuccess();
            } else {
                setError("Invalid email or password.");
            }
        }, 1200);
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-start justify-center py-10 px-4 md:px-10 text-gray-100">
            <div className="max-w-md w-full bg-gray-800 shadow-lg rounded-lg p-8 space-y-6">
                <header className="border-b border-gray-700 pb-4 mb-4">
                    <h1 className="text-2xl font-bold text-white">Sign Up</h1>
                    <p className="text-gray-400 text-sm mt-1">Sign up to claim your Trophy Mount account</p>
                </header>
                {error && <div className="text-red-400 text-sm">{error}</div>}
                <form className="space-y-4" onSubmit={handleSignUp}>
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
                            placeholder="password"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="password"
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
                    <p>Already have an account? <a onClick={navigate} className="text-blue-500 hover:underline">Sign in</a></p>
                </div>
                {isLoading && <LoadingSpinner isFullScreen={true} message="Signing in..." />}
            </div>
        </div>
    );
}
