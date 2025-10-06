'use client';
import { useRouter } from "next/navigation";
import { useAuthToken } from "./hooks/useAuthToken";

export default function HomePage() {
    const router = useRouter();
    const token = useAuthToken();

    return (
        <div className="min-h-screen bg-darker flex flex-col items-center justify-start sm:pt-[2rem] font-sans">
            <main className="w-full card-bg-darker max-w-2xl bg-white/5 backdrop-blur-lg sm:rounded-xl shadow-2xl p-10 flex flex-col items-center gap-8">
                <div className="flex flex-col items-center gap-4">
                    <h1 className="text-5xl font-extrabold text-neutral text-center">
                        Welcome to <span className="text-primary-gold">Victory Vault</span>
                    </h1>
                    <p className="text-lg text-gray-800 text-center max-w-xl">
                        Your one-stop solution for managing and showcasing your digital trophies.<br />
                        Securely store, organize, and share achievement and victory memories.
                    </p>
                </div>
                <div className="flex flex-col items-center gap-4 w-full">
                    {token ? (
                        <button
                            className="bg-primary-neutral hover:bg-primary-gold text-primary-dark font-semibold py-3 px-8 rounded-lg shadow-lg transition-all text-lg w-full max-w-xs"
                            onClick={() => router.push('/account')}
                        >
                            Go to My Account
                        </button>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                            <button
                                className="bg-primary-neutral cursor-pointer hover:bg-primary-neutral text-primary-dark font-semibold py-3 px-8 rounded-lg shadow-lg transition-all text-lg w-full sm:w-auto"
                                onClick={() => router.push('/login?redirect=/')}
                            >
                                Log In
                            </button>
                            <button
                                className="bg-white/10 cursor-pointer hover:bg-white/20 text-primary-gold font-semibold py-3 px-8 rounded-lg shadow-lg transition-all text-lg w-full sm:w-auto border border-primary-dark"
                                onClick={() => router.push('/signup?redirect=/')}
                            >
                                Sign Up
                            </button>
                        </div>
                    )}
                </div>
            </main>
            <footer className="mt-16 text-primary-gold text-sm text-center fixed bottom-4">
                &copy; {new Date().getFullYear()} Memory Mount. All rights reserved.
            </footer>
        </div>
    );
}
