import { NextRequest, NextResponse } from 'next/server';
import { migrateMemoryCodesFromJson } from '@/app/services/memory-code-migration.service';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check for admin users
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.MIGRATION_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid migration secret' },
        { status: 401 }
      );
    }

    console.log('🚀 Starting memory code migration via API...');
    
    await migrateMemoryCodesFromJson();
    
    return NextResponse.json(
      { 
        message: 'Memory code migration completed successfully',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'Memory Code Migration API',
      usage: 'POST with Authorization: Bearer <MIGRATION_SECRET>',
      endpoint: '/api/admin/migrate-memory-codes'
    },
    { status: 200 }
  );
}
