'use client';
import { useRouter } from "next/navigation";
import { useAuthToken } from "./hooks/useAuthToken";

export default function HomePage() {
    const router = useRouter();
    const token = useAuthToken();

    return (
        <div className="min-h-screen flex flex-col items-center justify-start sm:pt-[2rem] font-sans" style={{background: 'linear-gradient(to bottom right, #2d1810, #3d2317, #5c3a26)'}}>
            <main className="w-full max-w-2xl backdrop-blur-lg sm:rounded-xl shadow-2xl p-10 flex flex-col items-center gap-8" style={{backgroundColor: 'rgba(61, 35, 23, 0.8)'}}>
                <div className="flex flex-col items-center gap-4">
                    <h1 className="text-5xl font-extrabold text-amber-100 text-center">
                        Welcome to <span className="text-orange-400">Memory Mount</span>
                    </h1>
                    <p className="text-lg text-amber-200 text-center max-w-xl">
                        Your one-stop solution for managing and showcasing your digital trophies.<br />
                        Securely store, organize, and share your hunting and fishing memories.
                    </p>
                </div>
                <div className="flex flex-col items-center gap-4 w-full">
                    {token ? (
                        <button
                            className="bg-orange-600 hover:bg-orange-700 text-amber-100 font-semibold py-3 px-8 rounded-lg shadow-lg transition-all text-lg w-full max-w-xs"
                            onClick={() => router.push('/account')}
                        >
                            Go to My Account
                        </button>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                            <button
                                className="bg-orange-600 hover:bg-orange-700 text-amber-100 font-semibold py-3 px-8 rounded-lg shadow-lg transition-all text-lg w-full sm:w-auto"
                                onClick={() => router.push('/login?redirect=/')}
                            >
                                Log In
                            </button>
                            <button
                                className="bg-amber-800 hover:bg-amber-700 text-amber-100 font-semibold py-3 px-8 rounded-lg shadow-lg transition-all text-lg w-full sm:w-auto border border-orange-400"
                                onClick={() => router.push('/signup?redirect=/')}
                            >
                                Sign Up
                            </button>
                        </div>
                    )}
                </div>
            </main>
            <footer className="mt-16 text-amber-400 text-sm text-center fixed bottom-4">
                &copy; {new Date().getFullYear()} Memory Mount. All rights reserved.
            </footer>
        </div>
    );
}
