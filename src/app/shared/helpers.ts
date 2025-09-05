import { get } from "http";

export const urlEncode = (url: string) => encodeURIComponent(url);

export const urlDecode = (url: string) => decodeURIComponent(url);

export const parseQueryString = () => {
    if (!window) {
        return {};
    }

    const str = window.location.search;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objURL: any = {};

    str.replace(
        new RegExp("([^?=&]+)(=([^&]*))?", "g"),
        function ($0, $1, $2, $3) {
            objURL[$1] = $3;
            return $0;
        }
    );
    return objURL;
};

export const setLocalStorageItem = (key: string, data: string) => {
    if (!window || !window.localStorage) return;

    localStorage.setItem(key, data);
}

export const getLocalStorageItem = (key: string) => {
    if (!window || !window.localStorage) return null;

    const data = localStorage.getItem(key);
    console.log('data: ', data);

    if (data && ['true', 'false'].includes(data)) {
        return data === 'true';
    }

    return data;
}

const encodeId = (id: string) => {
    return `assigned_${id}`;
};

const decodeId = (encodedId: string) => {
    return encodedId.replace('assigned_', '');
};

export const setVerifiedCode = (id: string) => {
    if (!window || !window.localStorage) return;

    setLocalStorageItem(encodeId(id), 'id');
};

export const getVerifiedCode = (id: string) => {
    if (!window || !window.localStorage) return null;

    const data = getLocalStorageItem(encodeId(id));
    console.log('data: ', data);
    
    if (data) {
        return decodeId(data as string);
    }

    return null;
};
