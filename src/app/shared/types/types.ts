export interface iTrophyFile extends File {
    uploadedAt: string | number | Date;
    pathname: string;
    Key: string;
    downloadUrl: string;
    url: string;
    name: string
}