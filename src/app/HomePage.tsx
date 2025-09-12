'use client';
import { useRouter } from "next/navigation";
import { useAuthToken } from "./hooks/useAuthToken";

export default function HomePage() {
    const router = useRouter();
    const token = useAuthToken();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-black flex flex-col items-center justify-start sm:pt-[2rem] font-sans">
            <main className="w-full max-w-2xl bg-white/5 backdrop-blur-lg sm:rounded-xl shadow-2xl p-10 flex flex-col items-center gap-8">
                <div className="flex flex-col items-center gap-4">
                    <h1 className="text-5xl font-extrabold text-white text-center">
                        Welcome to <span className="text-blue-400">Memory Mount</span>
                    </h1>
                    <p className="text-lg text-gray-200 text-center max-w-xl">
                        Your one-stop solution for managing and showcasing your digital trophies.<br />
                        Securely store, organize, and share your hunting and fishing memories.
                    </p>
                </div>
                <div className="flex flex-col items-center gap-4 w-full">
                    {token ? (
                        <button
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-all text-lg w-full max-w-xs"
                            onClick={() => router.push('/account')}
                        >
                            Go to My Account
                        </button>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                            <button
                                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-all text-lg w-full sm:w-auto"
                                onClick={() => router.push('/login?redirect=/')}
                            >
                                Log In
                            </button>
                            <button
                                className="bg-white/10 hover:bg-white/20 text-blue-200 font-semibold py-3 px-8 rounded-lg shadow-lg transition-all text-lg w-full sm:w-auto border border-blue-400"
                                onClick={() => router.push('/signup?redirect=/')}
                            >
                                Sign Up
                            </button>
                        </div>
                    )}
                </div>
            </main>
            <footer className="mt-16 text-gray-400 text-sm text-center fixed bottom-4">
                &copy; {new Date().getFullYear()} Memory Mount. All rights reserved.
            </footer>
        </div>
    );
}
