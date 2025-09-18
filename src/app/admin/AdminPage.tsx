// AdminPage.tsx
'use client'
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { ArrowRightOnRectangleIcon, CodeBracketIcon, DocumentTextIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { urlEncode } from "../shared/helpers";
import { useAuthToken } from "../hooks/useAuthToken";

const AdminPage = () => {
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


    return isAdmin ? (
        <div className="min-h-screen bg-darker text-primary-dark p-10">
            <h1 className="text-4xl text-neutral font-bold mb-8">Admin Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/admin/users" className="bg-primary-dark p-6 rounded-lg shadow hover:bg-primary-light transition">
                    <div className="flex items-center">
                        <UserGroupIcon className="h-8 w-8 mr-4 text-green-400" />
                        <div>
                            <h2 className="text-xl font-semibold">Manage Users  </h2>
                            <p className="mt-2 text-primary-gold">View and manage user accounts</p>
                        </div>
                    </div>
                </Link>
                <Link href="/admin/get-code" className="bg-primary-dark p-6 rounded-lg shadow hover:bg-primary-light transition">
                    <div className="flex items-center">
                        <CodeBracketIcon className="h-8 w-8 mr-4 text-neutral" />
                        <div>
                            <h2 className="text-xl font-semibold">Memory Codes</h2>
                            <p className="mt-2 text-primary-gold">Generate and manage memory codes</p>
                        </div>
                    </div>
                </Link>
                <Link href="/admin/reports" className="bg-primary-dark p-6 rounded-lg shadow hover:bg-primary-light transition">
                    <div className="flex items-center">
                        <DocumentTextIcon className="h-8 w-8 mr-4 text-yellow-400" />
                        <div>
                            <h2 className="text-xl font-semibold">Reports</h2>
                            <p className="mt-2 text-primary-gold">View system reports and analytics</p>
                        </div>
                    </div>
                </Link>
                <Link href="/api/auth/logout" className="bg-red-600 p-6 rounded-lg shadow hover:bg-red-700 text-white transition">
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
        <div className="text-center">
            <h2 className="text-xl font-bold text-center py-20">Unauthorized</h2>
            <a href={`/login?redirect=${urlEncode('/admin')}`} className="text-blue-500 hover:underline">Login</a>
        </div>
    );
};

export default AdminPage;