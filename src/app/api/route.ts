import type { NextApiRequest, NextApiResponse } from 'next'
import { redirect } from 'next/navigation';


// get trophies
export async function GET(req: NextApiRequest, res: NextApiResponse) {
    console.log('getTrophies called');
    return redirect('/trophy');
}

// create trophy
export async function POST(req: NextApiRequest, res: NextApiResponse) {
    return res.status(201).json({ message: 'POST request successful' });
}

// update trophy
export async function PUT(req: NextApiRequest, res: NextApiResponse) {
    return res.status(200).json({ message: 'PUT request successful' });
}

// delete trophy
export async function DELETE(req: NextApiRequest, res: NextApiResponse) {
    return res.status(200).json({ message: 'DELETE request successful' });
}
