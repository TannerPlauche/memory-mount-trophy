"use client";
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import Modal from '@/app/components/Modal/Modal';
import { useAuthToken } from '@/app/hooks/useAuthToken';
import { getLocalStorageItem, urlEncode } from '@/app/shared/helpers';
import { User, Edit, Trash2, Shield, ShieldOff, Award } from '@geist-ui/icons';

interface UserData {
    _id: string;
    email: string;
    name?: string;
    role: 'user' | 'admin';
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

interface MemoryMount {
    id: string;
    code: string;
    name?: string;
    usedAt: string;
    createdAt: string;
    userId?: string;
}

export default function UsersPage() {
    const router = useRouter();
    const token = useAuthToken(`/login?redirect=${urlEncode('/admin/users')}`);

    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [users, setUsers] = useState<UserData[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [userMemoryMounts, setUserMemoryMounts] = useState<MemoryMount[]>([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        role: 'user' as 'user' | 'admin'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchUsers = useCallback(async () => {
        try {
            const token = getLocalStorageItem('userToken');
            const response = await fetch('/api/admin/users', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data.users);
                setFilteredUsers(data.users); // Initialize filtered users
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to load users');
        }
    }, []);

    // Filter users based on search term
    const filterUsers = useCallback((term: string) => {
        if (!term.trim()) {
            setFilteredUsers(users);
        } else {
            const filtered = users.filter(user => 
                user.email.toLowerCase().includes(term.toLowerCase()) ||
                (user.name && user.name.toLowerCase().includes(term.toLowerCase()))
            );
            setFilteredUsers(filtered);
        }
    }, [users]);

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        filterUsers(term);
    };

    const checkAdminAndLoadUsers = useCallback(async () => {
        try {
            // Check if user is admin
            const response = await fetch('/api/auth/me', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.user.admin) {
                    setIsAdmin(true);
                    await fetchUsers();
                } else {
                    router.push('/');
                }
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
            router.push('/');
        } finally {
            setIsLoading(false);
        }
    }, [token, router, fetchUsers]);

    const fetchUserMemoryMounts = async (userId: string) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}/memory-mounts`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUserMemoryMounts(data.memoryMounts || []);
            }
        } catch (error) {
            console.error('Error fetching user memory mounts:', error);
        }
    };

    const handleEditUser = (user: UserData) => {
        setSelectedUser(user);
        setEditForm({
            name: user.name || '',
            email: user.email,
            role: user.role
        });
        fetchUserMemoryMounts(user._id);
        setShowEditModal(true);
    };

    const handleDeleteUser = (user: UserData) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    const submitUserUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        setError('');
        setSuccess('');

        try {
            const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });

            if (response.ok) {
                setSuccess('User updated successfully');
                setShowEditModal(false);
                await fetchUsers();
                filterUsers(searchTerm); // Re-apply search filter
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to update user');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            setError('Failed to update user');
        }
    };

    const confirmDeleteUser = async () => {
        if (!selectedUser) return;

        try {
            const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                setSuccess('User deleted successfully');
                setShowDeleteModal(false);
                await fetchUsers();
                filterUsers(searchTerm); // Re-apply search filter
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            setError('Failed to delete user');
        }
    };

    const toggleUserRole = async (user: UserData) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';

        try {
            const response = await fetch(`/api/admin/users/${user._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ...user, role: newRole })
            });

            if (response.ok) {
                setSuccess(`User role changed to ${newRole}`);
                await fetchUsers();
                filterUsers(searchTerm); // Re-apply search filter
            }
        } catch (error) {
            console.error('Error updating user role:', error);
            setError('Failed to update user role');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    useEffect(() => {
        if (token) {
            checkAdminAndLoadUsers();
        }
    }, [token, checkAdminAndLoadUsers]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-white mb-4">Access Denied</h2>
                    <p className="text-gray-400">You don&apos;t have permission to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 py-10 px-4 md:px-10 text-gray-100">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-gray-800 shadow-lg rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white">User Management</h1>
                            <p className="text-gray-400 mt-1">Manage users and their memory mounts</p>
                        </div>
                        <button
                            onClick={() => router.push('/admin')}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Back to Admin
                        </button>
                    </div>
                </div>

                {/* Status Messages */}
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

                {/* Users Table */}
                <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-700">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <h2 className="text-xl font-semibold text-white">
                                All Users ({filteredUsers.length}{searchTerm && ` of ${users.length}`})
                            </h2>
                            
                            {/* Search Input */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full sm:w-80 bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center">
                                            <div className="text-gray-400">
                                                {searchTerm ? (
                                                    <>
                                                        <p className="text-lg font-medium">No users found</p>
                                                        <p className="text-sm mt-1">No users match your search criteria &quot;{searchTerm}&quot;</p>
                                                    </>
                                                ) : (
                                                    <p className="text-lg font-medium">No users available</p>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                                    <User size={20} className="text-white" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-white">
                                                        {user.name || 'No name'}
                                                    </div>
                                                    <div className="text-sm text-gray-400">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin'
                                                    ? 'bg-purple-900 text-purple-200'
                                                    : 'bg-blue-900 text-blue-200'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isVerified
                                                    ? 'bg-green-900 text-green-200'
                                                    : 'bg-yellow-900 text-yellow-200'
                                                }`}>
                                                {user.isVerified ? 'Verified' : 'Unverified'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {formatDate(user.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="text-blue-400 hover:text-blue-300"
                                                    title="Edit User"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => toggleUserRole(user)}
                                                    className="text-purple-400 hover:text-purple-300"
                                                    title={`Make ${user.role === 'admin' ? 'User' : 'Admin'}`}
                                                >
                                                    {user.role === 'admin' ? <ShieldOff size={16} /> : <Shield size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="text-red-400 hover:text-red-300"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Edit User Modal */}
                <Modal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedUser(null);
                        setUserMemoryMounts([]);
                        setError('');
                        setSuccess('');
                    }}
                    title={`Edit User: ${selectedUser?.name || selectedUser?.email}`}
                    size="lg"
                >
                    <form onSubmit={submitUserUpdate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* User Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-white border-b border-gray-600 pb-2">
                                    User Information
                                </h3>

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
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Role
                                    </label>
                                    <select
                                        value={editForm.role}
                                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'user' | 'admin' })}
                                        className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>

                            {/* Memory Mounts */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-white border-b border-gray-600 pb-2">
                                    Memory Mounts ({userMemoryMounts.length})
                                </h3>

                                <div className="max-h-80 overflow-y-auto space-y-2">
                                    {userMemoryMounts.length === 0 ? (
                                        <p className="text-gray-400 text-sm">No memory mounts found</p>
                                    ) : (
                                        userMemoryMounts.map((mount) => (
                                            <div key={mount.id} className="cursor-pointer bg-gray-700 rounded-lg p-3 border border-gray-600">
                                                <a href={`/trophy/${mount.id}`} target="_blank" rel="noopener noreferrer">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="text-sm font-medium text-white font-mono">
                                                                {mount.name || mount.id}
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                Code: {mount.code}
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                Used: {formatDate(mount.usedAt)}
                                                            </p>
                                                        </div>
                                                        <Award size={16} className="text-blue-400" />
                                                    </div>
                                                </a>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-600">
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setSelectedUser(null);
                    }}
                    title="Delete User"
                    size="sm"
                >
                    <div className="space-y-4">
                        <p className="text-gray-300">
                            Are you sure you want to delete the user <strong>{selectedUser?.name || selectedUser?.email}</strong>?
                        </p>
                        <p className="text-red-400 text-sm">
                            This action cannot be undone and will permanently delete all user data including memory mounts.
                        </p>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteUser}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Delete User
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
}
