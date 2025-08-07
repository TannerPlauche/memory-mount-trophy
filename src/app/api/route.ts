import { redirect } from 'next/navigation';

export async function GET() {
    console.log('getTrophies called');
    return redirect('/trophy');
}

export async function POST() {
    return new Response(JSON.stringify({ message: 'POST request successful' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function PUT() {
    return new Response(JSON.stringify({ message: 'PUT request successful' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function DELETE() {
    return new Response(JSON.stringify({ message: 'DELETE request successful' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

