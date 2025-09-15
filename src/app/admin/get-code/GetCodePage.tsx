'use client'
import { urlEncode } from "@/app/shared/helpers";
import { useAuthToken } from "@/app/hooks/useAuthToken";
import axios from "axios";
import { useEffect, useState } from "react";

const GetCodePage = () => {
    const [unusedId, setUnusedId] = useState(null);
    const [unusedCode, setUnusedCode] = useState(null);
    const [message, setMessage] = useState("");
    const [displayMessage, setDisplayMessage] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const token = useAuthToken();

    useEffect(() => {
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
            setMessage(`Code copied to clipboard: \n ${unusedCode}`);
            displayMessageTemp();
        }
    };

    const copyMemoryIdWithFullUrl = () => {
        if (!unusedId) {
            alert("No Memory Id to copy");
        } else {
            const fullUrl = `${window.location.origin}/trophy/${unusedId}`;
            navigator.clipboard.writeText(fullUrl);
            setMessage(`Memory Id copied to clipboard: \n ${fullUrl}`);
            displayMessageTemp();
        }
    };

    const displayMessageTemp = () => {
        setDisplayMessage(true);
        setTimeout(() => {
            setDisplayMessage(false);
        }, 5000);
    };

    return isAdmin ? (
        <div className="h-full min-h-screen p-10 text-amber-100" style={{backgroundColor: '#2d1810'}}>

            {displayMessage && <div className="message text-center text-l p-2 text-amber-100">{message}</div>}
            {unusedId ? (
                <div className="h-full flex flex-col items-center justify-start py-1 gap-3">
                    <div className="flex flex-col md:flex-row ">
                        <div className="mx-4 p-4 rounded-lg text-center mb-5 md:mb-0" style={{backgroundColor: '#8b7355'}}>
                            <h2 className="text-lg font-black text-amber-900">Unused Memory ID:</h2>
                            <h3 className="text-xl italic font-bold text-amber-900">{unusedId}</h3>
                            <button className="bg-orange-600 hover:bg-orange-700 text-amber-100 font-bold py-2 px-4 rounded" onClick={copyMemoryIdWithFullUrl}>
                                Copy Memory Id
                            </button>
                        </div>
                        <div className="mx-4 p-4 rounded-lg text-center" style={{backgroundColor: '#8b7355'}}>
                            <h2 className="text-lg font-black text-amber-900">Unused Memory Code:</h2>
                            <h3 className="text-xl italic font-bold text-amber-900">{unusedCode}</h3>
                            <button className="bg-orange-600 hover:bg-orange-700 text-amber-100 font-bold py-2 px-4 rounded" onClick={copyCode}>
                                Copy Code
                            </button>
                        </div>
                    </div>
                    <br />
                    <small className="px-10">By clicking this button you indicate that this Memory Mount Id has been assined to a product</small>
                    <button className="bg-orange-600 hover:bg-orange-700 text-amber-100 font-bold py-2 px-4 rounded" onClick={markCodeAsUsed}>
                        Mark as Assigned to Product
                    </button>
                    <br />
                    <button className="bg-green-700 hover:bg-green-800 text-amber-100 font-bold py-2 px-4 rounded" onClick={() => window.location.reload()}>
                        Get Next Memory Id
                    </button>
                    {displayMessage && <div className="message text-amber-100">{message}</div>}
                    <br />
                    <a href={`/trophy/${unusedId}`} className="text-orange-400 hover:text-orange-300 hover:underline">Open this Memory ID</a>
                </div>
            ) : (
                <p className="text-amber-200 text-center">Loading...</p>
            )}

        </div>
    ) : (
        <div className="text-center">
            <h2 className="text-xl font-bold text-center py-20 text-amber-100">Unauthorized</h2>
            <a href={`/login?redirect=${urlEncode('/admin/get-code')}`} className="text-orange-400 hover:text-orange-300 hover:underline" target="_blank">Login</a>
        </div>
    );
};

export default GetCodePage;
