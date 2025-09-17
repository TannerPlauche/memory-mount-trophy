"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import Modal from '@/app/components/Modal/Modal';
import { urlEncode } from '@/app/shared/helpers';
import { useAuthToken } from '@/app/hooks/useAuthToken';
import { User, Edit, Award, Code, LogOut, Settings, Camera, Calendar, Star } from '@geist-ui/icons';

interface UserData {
    id: string;
    email: string;
    name?: string;
    role: 'user' | 'admin';
    admin: boolean;
    createdAt: string;
}

interface MemoryCode {
    id: string;
    code: string;
    usedAt: string;
    createdAt: string;
    name?: string;
    userId?: string;
}

interface Trophy {
    id: string;
    name: string;
    lastModified: string;
    fileCount: number;
    hasVideo: boolean;
    hasImages: boolean;
}

export default function AccountPage() {
    const router = useRouter();
    const token = useAuthToken(`/login?redirect=${urlEncode('/account')}`);
    console.log('token: ', token);
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [memoryCodes, setMemoryCodes] = useState<MemoryCode[]>([]);
    const [trophies, setTrophies] = useState<Trophy[]>([]);
    const [activeTab, setActiveTab] = useState<'profile' | 'trophies' | 'codes' | 'settings'>('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', email: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        console.log('token in use effect', token)
        if (token) {
            const fetchUserData = async () => {
                try {
                    //set bearer token in headers
                    const response = await fetch('/api/auth/me', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        console.log('data: ', data);
                        setUserData(data.user);
                        setEditForm({ name: data.user.name || '', email: data.user.email });
                    } else {
                        throw new Error('Failed to fetch user data');
                    }
                    setIsLoading(false);
                } catch {
                    console.error('Error fetching user data');
                    setError('Failed to load user data');
                }
            };


            const fetchMemoryCodes = async () => {
                try {
                    const response = await fetch(`/api/memory-mount?token=${token}`);
                    if (response.ok) {
                        const data = await response.json();
                        setMemoryCodes(data.memoryCodes || []);
                    }
                } catch {
                    console.error('Error fetching memory codes');
                }
            };

            const fetchTrophies = async () => {

                //  {
                //             id: 'elk-hunt-2024',
                //             name: 'Elk Hunt 2024',
                //             lastModified: '2024-12-01',
                //             fileCount: 8,
                //             hasVideo: true,
                //             hasImages: true
                //         },

                try {
                    const response = await fetch(`/api/memory-mount?token=${token}`);
                    if (response.ok) {
                        const data = await response.json();
                        setTrophies(data.memoryCodes || []);
                    }
                } catch {
                    console.error('Error fetching trophies');
                }
            };

            const loadData = async () => {
                await fetchUserData();
                await fetchMemoryCodes();
                await fetchTrophies();
            };

            loadData();
        }
    }, [router, userData?.id, token]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(editForm),
            });

            if (response.ok) {
                const data = await response.json();
                setUserData(data.user);
                setIsEditing(false);
                setSuccess('Profile updated successfully');
            } else {
                throw new Error('Failed to update profile');
            }
        } catch {
            setError('Failed to update profile');
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        // Validate passwords match
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                }),
            });

            if (response.ok) {
                setPasswordSuccess('Password changed successfully');
                setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setTimeout(() => {
                    setShowPasswordModal(false);
                    setPasswordSuccess('');
                }, 2000);
            } else {
                const data = await response.json();
                setPasswordError(data.error || 'Failed to change password');
            }
        } catch {
            setPasswordError('Failed to change password');
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            localStorage.removeItem('userToken');
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-gray-900 py-10 px-4 md:px-10 text-gray-100">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-gray-800 shadow-lg rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                                <User size={32} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    {userData?.name || 'Welcome'}
                                </h1>
                                <p className="text-gray-400">{userData?.email}</p>
                                <p className="text-xs text-gray-500">
                                    Member since {userData?.createdAt ? formatDate(userData.createdAt) : 'Unknown'}
                                </p>
                            </div>
                        </div>
                        {/* <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            <LogOut size={16} />
                            <span>Logout</span>
                        </button> */}
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-gray-800 shadow-lg rounded-lg mb-6">
                    <div className="flex border-b border-gray-700">
                        {[
                            { id: 'profile', label: 'Profile', icon: User },
                            // { id: 'trophies', label: 'My Trophies', icon: Award },
                            { id: 'codes', label: 'My Memory Mounts', icon: Code },
                            { id: 'settings', label: 'Settings', icon: Settings }
                        ].map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id as 'profile' | 'trophies' | 'codes' | 'settings')}
                                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${activeTab === id
                                    ? 'text-blue-400 border-b-2 border-blue-400'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <Icon size={16} />
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-gray-800 shadow-lg rounded-lg p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded-lg text-red-200">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-900 border border-green-700 rounded-lg text-green-200">
                            {success}
                        </div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-l font-semibold text-white mr-3">Profile Information</h2>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    <Edit size={16} />
                                    <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                                </button>
                            </div>

                            {isEditing ? (
                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                                        >
                                            Save Changes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400">Name</label>
                                            <p className="text-white">{userData?.name || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400">Email</label>
                                            <p className="text-white">{userData?.email}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400">Role</label>
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${userData?.role === 'admin'
                                                ? 'bg-purple-900 text-purple-200'
                                                : 'bg-blue-900 text-blue-200'
                                                }`}>
                                                {userData?.admin ? 'Admin' : userData?.role}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400">Member Since</label>
                                            <p className="text-white">{userData?.createdAt ? formatDate(userData.createdAt) : 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400">Total Trophies</label>
                                            <p className="text-white">{trophies.length}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400">Memory Codes Used</label>
                                            <p className="text-white">{memoryCodes.length}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Trophies Tab */}
                    {activeTab === 'trophies' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-white">My Trophies</h2>
                            </div>

                            {trophies.length === 0 ? (
                                <div className="text-center py-12">
                                    <Award size={48} className="mx-auto text-gray-500 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-400 mb-2">No trophies yet</h3>
                                    <p className="text-gray-500 mb-4">Start by adding your first trophy memory!</p>
                                    <button
                                        onClick={() => router.push('/codecheck')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                                    >
                                        Add Your First Trophy
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {trophies.map((trophy) => (
                                        <div
                                            key={trophy.id}
                                            className="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:bg-gray-650 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/trophy/${trophy.id}`)}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <h3 className="font-medium text-white truncate">{trophy.name}</h3>
                                                <div className="flex space-x-1">
                                                    {trophy.hasVideo && <Camera size={16} className="text-blue-400" />}
                                                    {trophy.hasImages && <Star size={16} className="text-yellow-400" />}
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-sm text-gray-400">
                                                <div className="flex items-center space-x-2">
                                                    <Calendar size={14} />
                                                    <span>Last updated: {formatDate(trophy.lastModified)}</span>
                                                </div>
                                                <div>
                                                    <span>{trophy.fileCount} files</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Memory Codes Tab */}
                    {activeTab === 'codes' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-white">Memory Mounts</h2>
                                <button
                                    onClick={() => window.location.href = 'https://www.memorymount.com'}
                                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    <Code size={16} />
                                    <span>Redeem New Code</span>
                                </button>
                            </div>

                            {memoryCodes.length === 0 ? (
                                <div className="text-center py-12">
                                    <Code size={48} className="mx-auto text-gray-500 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-400 mb-2">No memory codes redeemed</h3>
                                    <p className="text-gray-500 mb-4">Redeem a memory code to access your trophy content!</p>
                                    <button
                                        onClick={() => router.push('/codecheck')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                                    >
                                        Redeem Your First Code
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {memoryCodes.map((mount) => (
                                        <div
                                            key={mount.id}
                                            className="bg-gray-700 border border-gray-600 rounded-lg p-4 cursor-pointer hover:bg-gray-650 transition-colors"
                                            onClick={() => router.push(`/trophy/${mount.id}`)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-medium text-white font-mono">{mount.name || mount.id}</h3>
                                                    <p className="text-sm text-gray-400">
                                                        Redeemed on {formatDate(mount.usedAt)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="inline-block px-2 py-1 bg-green-900 text-green-200 rounded text-xs font-medium">
                                                        Active
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-white">Account Settings</h2>

                            <div className="space-y-4">
                                <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                                    <h3 className="font-medium text-white mb-2">Password</h3>
                                    <p className="text-gray-400 text-sm mb-3">Change your account password</p>
                                    <button 
                                        onClick={() => setShowPasswordModal(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                                    >
                                        Change Password
                                    </button>
                                </div>

                                <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                                    <h3 className="font-medium text-white mb-2">Privacy</h3>
                                    <p className="text-gray-400 text-sm mb-3">Manage your privacy settings</p>
                                    <button className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded transition-colors">
                                        Privacy Settings
                                    </button>
                                </div>

                                <div className="bg-red-900 border border-red-700 rounded-lg p-4">
                                    <h3 className="font-medium text-white mb-2">Danger Zone</h3>
                                    <p className="text-gray-300 text-sm mb-3">Permanently delete your account and all data</p>
                                    <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors">
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Password Change Modal */}
                <Modal
                    isOpen={showPasswordModal}
                    onClose={() => {
                        setShowPasswordModal(false);
                        setPasswordForm({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                        });
                        setPasswordError('');
                        setPasswordSuccess('');
                    }}
                    title="Change Password"
                    size="sm"
                >
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        {passwordError && (
                            <div className="p-3 bg-red-900 border border-red-700 rounded-lg text-red-200 text-sm">
                                {passwordError}
                            </div>
                        )}

                        {passwordSuccess && (
                            <div className="p-3 bg-green-900 border border-green-700 rounded-lg text-green-200 text-sm">
                                {passwordSuccess}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                minLength={6}
                                required
                            />
                            <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div className="flex space-x-3 pt-4">
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                                disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                            >
                                Change Password
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowPasswordModal(false)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </Modal>

                <button
                    onClick={handleLogout}
                    className="flex my-5 items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <LogOut size={16} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}
