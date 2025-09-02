// Migration script to import memory codes from JSON file to MongoDB
// JavaScript version of memory-code-migration.service.ts

const { MemoryCodeService } = require('./memory-code-db.service.js');
const fs = require('fs');
const path = require('path');

async function migrateMemoryCodesFromJson() {
  try {
    // Read the memory-codes.json file
    const jsonPath = path.join(process.cwd(), 'memory-codes.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const memoryCodes = JSON.parse(jsonData);

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
class MemoryCodeExamples {
  /**
   * Example: Redeem a memory code for a user
   */
  static async redeemMemoryCode(code, userId) {
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
  static async getUserMemoryCodes(userId) {
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

module.exports = {
  migrateMemoryCodesFromJson,
  MemoryCodeExamples
};
