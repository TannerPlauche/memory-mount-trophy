import { listFiles } from "@/app/services/file.service";

interface TrophyPageParams {
    trophyId: string;
}

interface TrophyPageProps {
    params: Promise<TrophyPageParams>;
}

export default async function TrophyPage({ params }: TrophyPageProps) {
    let paramData = await params;
    // console.log('paramData: ', paramData);
    const { trophyId } = await params;
    console.log('trophyId: ', trophyId);

    const files = await listFiles(trophyId);
    const fileExists = files.length > 0;

    const publicPrefix = 'https://pub-e08d3d9ccb3b41799db9d047e05263e7.r2.dev/';
    files.forEach((file: any) => {
        file.publicUrl = publicPrefix + file.Key;
    });
    console.log('files: ', files);

    return (
        <div>
            <h1>Trophy Page</h1>
            <p>{trophyId}</p>
            <a href={`/api/trophy`}>Edit Trophy</a>

            {!fileExists && <div>
                <form action={`/api/trophy/${trophyId}`} method="POST" encType="multipart/form-data">
                    <input type="text" name="name" placeholder="Trophy Name" />
                    <input type="file" name="file" />
                    <button type="submit">Submit Trophy</button>
                </form>
            </div>}

            {fileExists && <div>
                <h2>Files for Trophy {trophyId}</h2>
                <ul>
                    {files.map((file: any) => (
                        <li key={file.Key}>
                            <a href={`https://memory-mount.r2.cloudflarestorage.com/${file.Key}`} target="_blank" rel="noopener noreferrer">
                                {file.Key}
                            </a>
                        </li>
                    ))}
                </ul>
                <video src={files[0].publicUrl} controls></video>
            </div>}
        </div>

    );
}