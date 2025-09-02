'use client'
import axios from "axios";
import { useEffect, useState } from "react";

const GetCodePage = () => {
    // fetch an unused memory code from the database
    const [unusedCodeId, setUnusedCodeId] = useState(null);
    const [message, setMessage] = useState("");
    const [displayMessage, setDisplayMessage] = useState(false);

    useEffect(() => {
        const fetchUnusedCode = async () => {
            const response = await fetch('/api/memory-mount/unassigned');
            const data = await response.json();
            setUnusedCodeId(data.memoryCode.id);
        };

        fetchUnusedCode();
    }, []);

    const markCodeAsUsed = async () => {
        if (!unusedCodeId) {
            alert("No code to mark as used");
            return;
        }

        const response = await axios.post(`/api/memory-mount/assign`, {
            memoryId: unusedCodeId
        }, { headers: { 'Content-Type': 'application/json' } });

        if (response.status === 200) {
            setMessage("Code marked as assigned to product");
            displayMessageTemp();
        } else {
            setMessage("Failed to mark code as used");
            displayMessageTemp();
        }
    };

    const copyMemoryId = () => {
        if (!unusedCodeId) {
            alert("No code to copy");
        } else {
            navigator.clipboard.writeText(unusedCodeId);
            setMessage("Code copied to clipboard");
            displayMessageTemp();
        }
    };

    const displayMessageTemp = () => {
        setDisplayMessage(true);
        setTimeout(() => {
            setDisplayMessage(false);
        }, 4000);
    };

    return (
        <div className="bg-gray-500 size-dvw ">
            {unusedCodeId ? (
                <div className="h-full flex flex-col items-center justify-start py-1 gap-3">
                    <h2 className="text-lg font-bold font-black text-black">Unused Memory Code:</h2>
                    {/* <div className="flex flex-row"> */}
                    <h3 className="text-xl font-bold text-black">{unusedCodeId}</h3>
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={copyMemoryId}>
                        Copy Code
                    </button>

                    <br />
                    <small>By clicking this button you indicate that this Memory Mount Id has been assined to a product</small>
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={markCodeAsUsed}>
                        Mark as Assigned to Product
                    </button>
                     <br />
                    <button className="bg-green-700 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => window.location.reload()}>
                        Get Next Memory Id
                    </button>
                    {/* </div> */}
                    {displayMessage && <div className="message">{message}</div>}
                </div>
            ) : (
                <p className="text-black text-center">Loading...</p>
            )}
        </div>
    );
};

export default GetCodePage;
