import { useState, useEffect } from 'react';
import { getLocalStorageItem } from '@/app/shared/helpers';
import { useRouter } from 'next/navigation';

/**
 * Custom hook to manage authentication token from localStorage
 * @returns The current authentication token string (empty string if not found)
 */
export const useAuthToken = (unauthorizedRoute?: string): string => {
    const router = useRouter();
    const [token, setToken] = useState('');

    useEffect(() => {
        const token = getLocalStorageItem('userToken');
        if(!token && unauthorizedRoute){
            router.push(unauthorizedRoute)
        } else {
            setToken(typeof token === 'string' ? token : '');
        }
    }, [router, unauthorizedRoute]);

    return token;
};
