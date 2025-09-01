export const urlEncode = (url: string) => encodeURIComponent(url);

export const urlDecode = (url: string) => decodeURIComponent(url);

export const parseQueryString = () => {

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
    localStorage.setItem(key, data);
}

export const getLocalStorageItem = (key: string) => {
    const data = localStorage.getItem(key);

    if (data && ['true', 'false'].includes(data)) {
        return data === 'true';
    }

    return data;
}