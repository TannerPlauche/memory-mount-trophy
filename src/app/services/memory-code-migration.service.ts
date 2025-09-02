// Migration script to import memory codes from JSON file to MongoDB
// This script can be run to populate the database with existing memory codes

import { MemoryCodeService } from './memory-code-db.service';
import { IMemoryCode } from '@/app/models/MemoryCode';
import { readFileSync } from 'fs';
import { join } from 'path';

interface IMountRecord {
  id: string;
  code: string;
}

export async function migrateMemoryCodesFromJson(): Promise<void> {
  try {
    // Read the memory-codes.json file
    const jsonPath = join(process.cwd(), 'memory-codes.json');
    const jsonData = readFileSync(jsonPath, 'utf8');
    const memoryCodes: IMountRecord[] = JSON.parse(jsonData);

    console.log(`Found ${memoryCodes.length} memory codes in JSON file`);

    // Bulk create memory codes in the database
    const result = await MemoryCodeService.bulkCreateMemoryCodes(memoryCodes);

    console.log('Migration completed:');
    console.log(`- Created: ${result.created}`);
    console.log(`- Skipped: ${result.skipped}`);
    
    if (result.errors.length > 0) {
      console.log(`- Errors: ${result.errors.length}`);
      result.errors.forEach(error => console.error(`  ${error}`));
    }

    // Show stats
    const stats = await MemoryCodeService.getMemoryCodeStats();
    console.log('\nDatabase statistics:');
    console.log(`- Total codes: ${stats.total}`);
    console.log(`- Used codes: ${stats.used}`);
    console.log(`- Unused codes: ${stats.unused}`);
    console.log(`- Usage percentage: ${stats.usagePercentage}%`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Example usage functions
export class MemoryCodeExamples {
  /**
   * Example: Redeem a memory code for a user
   */
  static async redeemMemoryCode(code: string, userId: string): Promise<{
    success: boolean;
    message: string;
    memoryCode?: {
      id: string;
      code: string;
      userId?: string;
      usedAt?: Date;
    };
  }> {
    try {
      // First validate the code
      const validation = await MemoryCodeService.validateMemoryCode(code);
      
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message
        };
      }

      // Mark the code as used by the user
      const usedCode = await MemoryCodeService.markMemoryCodeAsUsed(code, userId);
      
      return {
        success: true,
        message: 'Memory code redeemed successfully',
        memoryCode: {
          id: usedCode.id,
          code: usedCode.code,
          userId: usedCode.userId,
          usedAt: usedCode.usedAt
        }
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Example: Get user's redeemed memory codes
   */
  static async getUserMemoryCodes(userId: string) {
    try {
      const memoryCodes = await MemoryCodeService.getMemoryCodesByUserId(userId);
      
      return {
        success: true,
        memoryCodes: memoryCodes.map(code => ({
          id: code.id,
          code: code.code,
          usedAt: code.usedAt,
          createdAt: code.createdAt
        }))
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
