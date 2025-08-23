"use client";
import { useState } from "react";
import LoadingSpinner from "@/app/components/LoadingSpinner";

interface LoginPageProps {
  onSuccess: () => void;
  navigate: () => void;
}

export default function LoginPage({ onSuccess, navigate }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    // Simulate login API call
    setTimeout(() => {
      setIsLoading(false);
      if (email.toLowerCase() === "demo@trophy.com" && password.toLowerCase() === "password") {
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
          <h1 className="text-2xl font-bold text-white">Login</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to claim your Trophy Mount account</p>
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
          <p>No account? <a onClick={navigate} className="text-blue-500 hover:underline">Sign up</a></p>
        </div>
        {isLoading && <LoadingSpinner isFullScreen={true} message="Signing in..." />}
      </div>
    </div>
  );
}
