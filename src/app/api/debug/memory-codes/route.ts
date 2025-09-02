import { NextRequest, NextResponse } from 'next/server';
import MemoryCode from '@/app/models/MemoryCode';
import dbConnect from '@/app/services/db.service';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const memoryId = searchParams.get('memoryId');
    
    if (memoryId) {
      // Debug: Search for the specific memory ID
      console.log('Searching for memoryId:', memoryId);
      
      // Try different search methods
      const byId = await MemoryCode.findOne({ id: memoryId });
      const byIdCaseInsensitive = await MemoryCode.findOne({ id: { $regex: new RegExp(`^${memoryId}$`, 'i') } });
      const byObjectId = await MemoryCode.findById(memoryId).catch(() => null);
      
      return NextResponse.json({
        searchedFor: memoryId,
        results: {
          byId: byId ? { id: byId.id, code: byId.code, _id: byId._id } : null,
          byIdCaseInsensitive: byIdCaseInsensitive ? { id: byIdCaseInsensitive.id, code: byIdCaseInsensitive.code, _id: byIdCaseInsensitive._id } : null,
          byObjectId: byObjectId ? { id: byObjectId.id, code: byObjectId.code, _id: byObjectId._id } : null
        }
      });
    }
    
    // Get first 5 memory codes to see the structure
    const sampleCodes = await MemoryCode.find({}).limit(5);
    
    return NextResponse.json({
      message: 'Debug Memory Codes',
      total: await MemoryCode.countDocuments({}),
      sampleCodes: sampleCodes.map(code => ({
        _id: code._id,
        id: code.id,
        code: code.code,
        isUsed: code.isUsed,
        assignedToProduct: code.assignedToProduct
      }))
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
