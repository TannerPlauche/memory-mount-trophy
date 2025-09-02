// Standalone JavaScript migration script
// This script works independently without requiring TypeScript services

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Memory Code Schema (JavaScript version)
const MemoryCodeSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, 'ID is required'],
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    userId: {
      type: String,
      trim: true,
      ref: 'User'
    },
    isUsed: {
      type: Boolean,
      default: false
    },
    usedAt: {
      type: Date
    },
    assignedToProduct: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        const { __v, ...cleanRet } = ret;
        return cleanRet;
      }
    }
  }
);

// Create model
const MemoryCode = mongoose.models.MemoryCode || mongoose.model('MemoryCode', MemoryCodeSchema);

// Database connection
async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trophy-mount';
  
  try {
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

// Migration function
async function migrateMemoryCodesFromJson() {
  try {
    console.log('🚀 Starting memory code migration...');
    
    // Connect to database
    await connectToDatabase();

    // Read the memory-codes.json file
    const jsonPath = path.join(process.cwd(), 'memory-codes.json');
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Memory codes file not found at: ${jsonPath}`);
    }

    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const memoryCodes = JSON.parse(jsonData);

    console.log(`📄 Found ${memoryCodes.length} memory codes in JSON file`);

    let created = 0;
    let skipped = 0;
    const errors = [];

    // Process codes in batches
    for (const codeData of memoryCodes) {
      try {
        // Check if code already exists
        const existing = await MemoryCode.findOne({ code: codeData.code.toUpperCase() });
        if (existing) {
          skipped++;
          continue;
        }

        // Create new memory code
        await MemoryCode.create({
          id: codeData.id,
          code: codeData.code.toUpperCase(),
          isUsed: false
        });
        created++;

        // Log progress every 1000 records
        if ((created + skipped) % 1000 === 0) {
          console.log(`📊 Processed ${created + skipped} records...`);
        }

      } catch (error) {
        errors.push(`Failed to create code ${codeData.code}: ${error.message}`);
      }
    }

    // Show results
    console.log('\n✅ Migration completed:');
    console.log(`- Created: ${created}`);
    console.log(`- Skipped: ${skipped}`);
    
    if (errors.length > 0) {
      console.log(`- Errors: ${errors.length}`);
      errors.slice(0, 5).forEach(error => console.error(`  ${error}`));
      if (errors.length > 5) {
        console.log(`  ... and ${errors.length - 5} more errors`);
      }
    }

    // Show database stats
    const totalCodes = await MemoryCode.countDocuments({});
    const usedCodes = await MemoryCode.countDocuments({ isUsed: true });
    const unusedCodes = totalCodes - usedCodes;
    const usagePercentage = totalCodes > 0 ? ((usedCodes / totalCodes) * 100).toFixed(2) : 0;

    console.log('\n📊 Database statistics:');
    console.log(`- Total codes: ${totalCodes}`);
    console.log(`- Used codes: ${usedCodes}`);
    console.log(`- Unused codes: ${unusedCodes}`);
    console.log(`- Usage percentage: ${usagePercentage}%`);

    // Close database connection
    await mongoose.connection.close();
    console.log('📦 Database connection closed');

    return {
      created,
      skipped,
      errors,
      totalCodes,
      usedCodes,
      unusedCodes
    };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { migrateMemoryCodesFromJson };
}

// Run directly if this script is executed
if (require.main === module) {
  migrateMemoryCodesFromJson()
    .then(() => {
      console.log('🎉 Migration script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}
