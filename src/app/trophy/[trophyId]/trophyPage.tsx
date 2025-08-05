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

    return (
        <div>
            <h1>Trophy Page</h1>
            <p>{trophyId}</p>
            <a href={`/api/trophy`}>Edit Trophy</a>

            <div>
                <form action={`/api/trophy/${trophyId}`} method="POST">
                    <input type="text" name="name" placeholder="Trophy Name" />
                    <button type="submit">Submit Trophy</button>
                </form>
            </div>
        </div>

    );
}