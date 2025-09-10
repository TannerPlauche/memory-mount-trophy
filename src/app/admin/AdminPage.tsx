// AdminPage.tsx
// create links to other admin pages
'use client'
import Link from "next/link";
import React, { useEffect } from "react";
import { ArrowRightOnRectangleIcon, CodeBracketIcon, DocumentTextIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { getLocalStorageItem, urlEncode } from "../shared/helpers";
import { useRouter } from "next/navigation";

const AdminPage = () => {
    const router = useRouter();
    const [isAdmin, setIsAdmin] = React.useState(false);
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

    if (!token) {
        router.push(`/login?redirect=${urlEncode('/account')}`);
        return;
    }


    return isAdmin ? (
        <div className="min-h-screen bg-gray-900 text-white p-10">
            <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/admin/users" className="bg-gray-800 p-6 rounded-lg shadow hover:bg-gray-700 transition">
                    <div className="flex items-center">
                        <UserGroupIcon className="h-8 w-8 mr-4 text-green-400" />
                        <div>
                            <h2 className="text-xl font-semibold">Manage Users  </h2>
                            <p className="mt-2 text-gray-400">View and manage user accounts</p>
                        </div>
                    </div>
                </Link>
                <Link href="/admin/get-code" className="bg-gray-800 p-6 rounded-lg shadow hover:bg-gray-700 transition">
                    <div className="flex items-center">
                        <CodeBracketIcon className="h-8 w-8 mr-4 text-blue-400" />
                        <div>
                            <h2 className="text-xl font-semibold">Memory Codes</h2>
                            <p className="mt-2 text-gray-400">Generate and manage memory codes</p>
                        </div>
                    </div>
                </Link>
                <Link href="/admin/reports" className="bg-gray-800 p-6 rounded-lg shadow hover:bg-gray-700 transition">
                    <div className="flex items-center">
                        <DocumentTextIcon className="h-8 w-8 mr-4 text-yellow-400" />
                        <div>
                            <h2 className="text-xl font-semibold">Reports</h2>
                            <p className="mt-2 text-gray-400">View system reports and analytics</p>
                        </div>
                    </div>
                </Link>
                <Link href="/api/auth/logout" className="bg-red-600 p-6 rounded-lg shadow hover:bg-red-700 transition">
                    <div className="flex items-center">
                        <ArrowRightOnRectangleIcon className="h-8 w-8 mr-4 text-white" />
                        <div>
                            <h2 className="text-xl font-semibold">Logout</h2>
                            <p className="mt-2 text-gray-200">Sign out of the admin dashboard</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    ) : (
        <h2 className="text-xl font-bold text-center py-20">Unauthorized</h2>
    );
};

export default AdminPage;