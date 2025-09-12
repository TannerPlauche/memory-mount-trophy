export interface iTrophyFile extends File {
    id?: string;
    uploadedAt: string | number | Date;
    pathname: string;
    Key: string;
    downloadUrl: string;
    url: string;
    name: string;
    error?: string;
}