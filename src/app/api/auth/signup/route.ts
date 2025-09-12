import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/app/services/user.service';
import { JWTService } from '@/app/services/jwt.service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Validate required fields
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Please provide a valid email address' },
                { status: 400 }
            );
        }

        // Validate password length
        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        // Create user using UserService
        const user = await UserService.createUser({
            email,
            password,
            role: 'user'
        });

        const token = JWTService.generateToken({ userId: user._id, email: user.email });

        return NextResponse.json(
            {
                message: 'User created successfully',
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    token,
                }
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Signup error:', error);

        // Check for duplicate email error
        if (error instanceof Error && error.message.includes('already exists')) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
