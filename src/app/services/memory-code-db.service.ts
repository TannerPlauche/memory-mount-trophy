import MemoryCode, { IMemoryCode } from '@/app/models/MemoryCode';
import dbConnect from '@/app/services/db.service';

export class MemoryCodeService {
  /**
   * Create a new memory code
   */
  static async createMemoryCode(data: {
    id: string;
    code: string;
    userId?: string;
  }): Promise<IMemoryCode> {
    await dbConnect();
    
    // Check if memory code already exists
    const existingCode = await MemoryCode.findByCode(data.code);
    if (existingCode) {
      throw new Error('Memory code already exists');
    }

    return MemoryCode.create(data);
  }

  /**
   * Get memory code by code
   */
  static async getMemoryCodeByCode(code: string): Promise<IMemoryCode | null> {
    await dbConnect();
    return MemoryCode.findByCode(code);
  }

  // create a method that checks if a memory code exists by its id
  static async verifyMemoryCodeById(memoryId: string): Promise<IMemoryCode | null> {
    await dbConnect();
    // project userId and isUsed fields only
    return MemoryCode.findOne({ id: memoryId }, { userId: 1, isUsed: 1 });
  }

  /**
   * Get memory codes by user ID
   */
  static async getMemoryCodesByUserId(userId: string): Promise<IMemoryCode[]> {
    await dbConnect();
    return MemoryCode.findByUserId(userId);
  }

  /**
   * Get all unused memory codes
   */
  static async getUnusedMemoryCodes(): Promise<IMemoryCode[]> {
    await dbConnect();
    return MemoryCode.findUnusedCodes();
  }

  /**
   * Get a single unassigned memory code
   */
  static async getUnassignedMemoryCode(): Promise<IMemoryCode | null> {
    await dbConnect();
    return MemoryCode.findUnassignedCode();
  }

  /**
   * Mark a memory code as assigned to product
   */
  static async markMemoryCodeAsAssigned(memoryId: string): Promise<IMemoryCode> {
    console.log('memoryId in assign: ', memoryId);
    await dbConnect();
    
    try {
      console.log('Database connected, searching for memory code...');
      
      // Use the model directly instead of the static method
      const memoryCode = await MemoryCode.findOne({ id: memoryId });
      console.log('memoryCode found by id:', memoryCode ? 'FOUND' : 'NOT FOUND');
      
      if (!memoryCode) {
        console.log('Memory code not found, checking database count...');
        
        // Check if there are any codes at all
        const count = await MemoryCode.countDocuments({});
        console.log('Total memory codes in database:', count);
        
        if (count === 0) {
          throw new Error('No memory codes found in database. Please run migration first.');
        }
        
        throw new Error(`Memory code not found with id: ${memoryId}. Total codes in DB: ${count}`);
      }
      
      console.log('Found memory code, checking status...');
      
      if (memoryCode.isUsed) {
        throw new Error('Memory code has already been used');
      }
      
      if (memoryCode.assignedToProduct) {
        throw new Error('Memory code has already been assigned to a product');
      }

      console.log('Marking memory code as assigned to product...');
      memoryCode.assignedToProduct = new Date();
      const result = await memoryCode.save();

      console.log('Memory code marked as assigned to product successfully');
      return result;
      
    } catch (error) {
      console.error('Error in markMemoryCodeAsAssigned:', error);
      throw error;
    }
  }

  /**
   * Mark a memory code as used
   */
  static async markMemoryCodeAsUsed(code: string, userId?: string): Promise<IMemoryCode> {
    await dbConnect();
    
    const result = await MemoryCode.claimMemory(code, userId);
    if (!result) {
      throw new Error('Failed to mark memory code as used');
    }
    
    return result;
  }

  /**
   * Claim a memory mount with memory ID, code, and user ID
   */
  static async claimMemoryMount(memoryId: string, code: string, userId: string): Promise<{
    success: boolean;
    message: string;
    memoryCode?: IMemoryCode;
  }> {
    await dbConnect();
    
    try {
      // Find the memory code by code
      const memoryCode = await MemoryCode.findByCode(code);
      
      if (!memoryCode) {
        return {
          success: false,
          message: 'Memory code not found'
        };
      }

      // Check if memory ID matches
      if (memoryCode.id !== memoryId) {
        return {
          success: false,
          message: 'Memory ID does not match the provided code'
        };
      }

      // Check if already used
      if (memoryCode.userId) {
        return {
          success: false,
          message: 'Memory code has already been claimed'
        };
      }

      // Claim the memory code
      const claimedCode = await MemoryCode.claimMemory(code, userId);
      
      if (!claimedCode) {
        return {
          success: false,
          message: 'Failed to claim memory code'
        };
      }
      
      return {
        success: true,
        message: 'Memory mount claimed successfully',
        memoryCode: claimedCode
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to claim memory mount'
      };
    }
  }

  /**
   * Validate if a memory code exists and is unused
   */
  static async validateMemoryCode(code: string): Promise<{
    isValid: boolean;
    isUsed: boolean;
    memoryCode?: IMemoryCode;
    message: string;
  }> {
    await dbConnect();
    
    const memoryCode = await MemoryCode.findByCode(code);
    
    if (!memoryCode) {
      return {
        isValid: false,
        isUsed: false,
        message: 'Memory code not found'
      };
    }

    if (memoryCode.isUsed) {
      return {
        isValid: false,
        isUsed: true,
        memoryCode,
        message: 'Memory code has already been used'
      };
    }

    return {
      isValid: true,
      isUsed: false,
      memoryCode,
      message: 'Memory code is valid and unused'
    };
  }

  /**
   * Bulk create memory codes (useful for importing from existing data)
   */
  static async bulkCreateMemoryCodes(codes: Array<{
    id: string;
    code: string;
    userId?: string;
  }>): Promise<{
    created: number;
    skipped: number;
    errors: string[];
  }> {
    await dbConnect();
    
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const codeData of codes) {
      try {
        // Check if code already exists
        const existing = await MemoryCode.findByCode(codeData.code);
        if (existing) {
          skipped++;
          continue;
        }

        await MemoryCode.create(codeData);
        created++;
      } catch (error) {
        errors.push(`Failed to create code ${codeData.code}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { created, skipped, errors };
  }

  /**
   * Get memory code statistics
   */
  static async getMemoryCodeStats(): Promise<{
    total: number;
    used: number;
    unused: number;
    usagePercentage: number;
  }> {
    await dbConnect();
    
    const [total, used] = await Promise.all([
      MemoryCode.countDocuments({}),
      MemoryCode.countDocuments({ isUsed: true })
    ]);

    const unused = total - used;
    const usagePercentage = total > 0 ? (used / total) * 100 : 0;

    return {
      total,
      used,
      unused,
      usagePercentage: Math.round(usagePercentage * 100) / 100
    };
  }
}
