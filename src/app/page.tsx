'use client';
import { useRouter } from "next/navigation";
import { getLocalStorageItem, urlEncode } from "./shared/helpers";

export default function Home() {
  const router = useRouter();
  const token = getLocalStorageItem('userToken');

  if (!token) {
    router.push(`/login?redirect=${urlEncode('/account')}`);
    return;
  } else {
    router.push('/account');
  }

  return (
    <div className="font-sans flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center sm:text-left">
          Welcome to <span className="text-blue-600">Memory Mount</span>
        </h1>
        <p className="text-lg text-center sm:text-left max-w-[600px]">
          Your one-stop solution for managing and showcasing your digital trophies.
          Create an account or log in to get started!
        </p>
      </main>
    </div>
  );
}
