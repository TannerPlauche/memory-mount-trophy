import { NextApiRequest, NextApiResponse } from "next";
import { redirect } from "next/navigation";

interface TrophyIdParams {
    params: Promise<{ trophyId: string }>
}

export async function POST(req: Request, paramsData: TrophyIdParams, res: NextApiResponse) {
    const params = await paramsData.params;
    const { trophyId } = params;
    const formData = await req.formData()
    console.log('trophyId: ', trophyId);
    console.log('formData: ', formData);
    return redirect(`/trophy/${trophyId}`);
}