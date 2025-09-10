'use client'
import { getLocalStorageItem, urlEncode } from "@/app/shared/helpers";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const GetCodePage = () => {
    // fetch an unused memory code from the database
    const [unusedId, setUnusedId] = useState(null);
    const [unusedCode, setUnusedCode] = useState(null);
    const [message, setMessage] = useState("");
    const [displayMessage, setDisplayMessage] = useState(false);

    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const token = getLocalStorageItem('userToken');

    useEffect(() => {
        // Check if the user is an admin
        const checkAdmin = async () => {
            const response = await fetch('/api/auth/me', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setIsAdmin(data.user.admin);
        };
        checkAdmin();
    }, [token]);

    useEffect(() => {
        const fetchUnusedCode = async () => {
            const response = await fetch('/api/memory-mount/unassigned');
            const data = await response.json();
            setUnusedId(data.memoryCode.id);
            setUnusedCode(data.memoryCode.code);
        };

        fetchUnusedCode();
    }, []);


    if (!token) {
        router.push(`/login?redirect=${urlEncode('/account')}`);
        return;
    }


    const markCodeAsUsed = async () => {
        if (!unusedId) {
            alert("No code to mark as used");
            return;
        }

        const response = await axios.post(`/api/memory-mount/assign`, {
            memoryId: unusedId
        }, { headers: { 'Content-Type': 'application/json' } });

        if (response.status === 200) {
            setMessage("Code marked as assigned to product");
            displayMessageTemp();
        } else {
            setMessage("Failed to mark code as used");
            displayMessageTemp();
        }
    };

    const copyCode = () => {
        if (!unusedCode) {
            alert("No code to copy");
        } else {
            navigator.clipboard.writeText(unusedCode);
            setMessage("Code copied to clipboard");
            displayMessageTemp();
        }
    };

    const copyMemoryId = () => {
        if (!unusedId) {
            alert("No Memory Id to copy");
        } else {
            navigator.clipboard.writeText(unusedId);
            setMessage("Memory Id copied to clipboard");
            displayMessageTemp();
        }
    };

    const displayMessageTemp = () => {
        setDisplayMessage(true);
        setTimeout(() => {
            setDisplayMessage(false);
        }, 4000);
    };

    return isAdmin ? (
        <div className="bg-gray-500 size-dvw ">

            {displayMessage && <div className="message text-center">{message}</div>}
            {unusedId ? (
                <div className="h-full flex flex-col items-center justify-start py-1 gap-3">
                    <div className="flex flex-col md:flex-row ">
                        <div className="mx-4 bg-gray-400 p-4 rounded-lg text-center mb-5 md:mb-0">
                            <h2 className="text-lg font-light font-black text-black">Unused Memory ID:</h2>
                            <h3 className="text-xl italic font-bold text-black">{unusedId}</h3>
                            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={copyMemoryId}>
                                Copy Memory Id
                            </button>
                        </div>
                        <div className="mx-4 bg-gray-400 p-4 rounded-lg text-center">
                            <h2 className="text-lg font-light font-black text-black">Unused Memory Code:</h2>
                            <h3 className="text-xl italic font-bold text-black">{unusedCode}</h3>
                            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={copyCode}>
                                Copy Code
                            </button>
                        </div>
                    </div>
                    <br />
                    <small>By clicking this button you indicate that this Memory Mount Id has been assined to a product</small>
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={markCodeAsUsed}>
                        Mark as Assigned to Product
                    </button>
                    <br />
                    <button className="bg-green-700 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => window.location.reload()}>
                        Get Next Memory Id
                    </button>
                    {displayMessage && <div className="message">{message}</div>}
                    <br />
                    <a href={`/trophy/${unusedId}`}>Open this Memory ID</a>
                </div>
            ) : (
                <p className="text-black text-center">Loading...</p>
            )}

        </div>
    ) : (
        <h2 className="text-xl font-bold text-center py-20">Unauthorized</h2>
    );
};

export default GetCodePage;
