import mongoose, { Document, Schema, Model } from 'mongoose';

// MemoryCode interface for TypeScript (based on IMountRecord with additional fields)
export interface IMemoryCode extends Document {
  _id: string;
  id: string; // Original id from IMountRecord
  code: string; // 6-character code from IMountRecord
  userId?: string; // Optional user ID to associate with a user
  isUsed: boolean; // Track if the memory code has been used
  usedAt?: Date; // When the code was used
  assignedToProduct?: Date; // When the code was assigned to a product
  createdAt: Date;
  updatedAt: Date;
}

// Interface for the MemoryCode model with static methods
export interface IMemoryCodeModel extends Model<IMemoryCode> {
  findByCode(code: string): Promise<IMemoryCode | null>;
  findByUserId(userId: string): Promise<IMemoryCode[]>;
  findUnusedCodes(): Promise<IMemoryCode[]>;
  findUnassignedCode(): Promise<IMemoryCode | null>;
  markAsAssigned(memoryId: string): Promise<IMemoryCode | null>;
  claimMemory(code: string, userId?: string): Promise<IMemoryCode | null>;
}

// MemoryCode schema definition
const MemoryCodeSchema = new Schema<IMemoryCode>(
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
      trim: true,
      length: [6, 'Code must be exactly 6 characters']
    },
    userId: {
      type: String,
      trim: true,
      required: false,
      ref: 'User' // Reference to User model
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
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
      transform: function(doc, ret) {
        // Remove MongoDB-specific fields from JSON output
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { __v, ...cleanRet } = ret;
        return cleanRet;
      }
    }
  }
);

// Instance method to mark code as used
MemoryCodeSchema.methods.markAsUsed = function(userId?: string) {
  this.isUsed = true;
  this.usedAt = new Date();
  if (userId) {
    this.userId = userId;
  }
  return this.save();
};

// Static method to find memory code by code
MemoryCodeSchema.statics.findByCode = function(code: string) {
  return this.findOne({ code: code.toUpperCase() });
};

// Static method to find memory codes by user ID
MemoryCodeSchema.statics.findByUserId = function(userId: string) {
  return this.find({ userId });
};

// Static method to find unused memory codes
MemoryCodeSchema.statics.findUnusedCodes = function() {
  return this.find({ isUsed: false });
};

// Static method to find a single unassigned memory code
MemoryCodeSchema.statics.findUnassignedCode = function() {
  return this.findOne({ 
    isUsed: false, 
    assignedToProduct: { $exists: false } 
  }).sort({ createdAt: 1 }); // Order by createdAt ascending (earliest first)
};

// Static method to mark a code as assigned to product
MemoryCodeSchema.statics.markAsAssigned = async function(memoryId: string) {
  console.log('memoryId in query: ', memoryId);
  
  try {
    console.log('Attempting to find memory code...');
    
    // Check database connection
    if (!this.db || this.db.readyState !== 1) {
      throw new Error('Database not connected');
    }
    
    console.log('Database is connected, searching for memory code...');
    
    // Try to find by id field
    const memoryCode = await this.findOne({ id: memoryId });
    console.log('memoryCode found by id:', memoryCode ? 'FOUND' : 'NOT FOUND');
    
    if (!memoryCode) {
      console.log('Memory code not found, checking database count...');
      
      // Let's check if there are any codes at all
      const count = await this.countDocuments({});
      console.log('Total memory codes in database:', count);
      
      if (count === 0) {
        throw new Error('No memory codes found in database. Please run migration first.');
      }
      
      // Let's see what IDs actually exist
      const sampleCodes = await this.find({}, { id: 1, code: 1 }).limit(3);
      console.log('Sample memory codes:', sampleCodes);
      
      throw new Error(`Memory code not found with id: ${memoryId}. Total codes in DB: ${count}`);
    }
    
    console.log('Found memory code, checking status...');
    
    if (memoryCode.isUsed) {
      throw new Error('Memory code has already been used');
    }
    
    if (memoryCode.assignedToProduct) {
      throw new Error('Memory code has already been assigned to a product');
    }
    
    console.log('Marking memory code as assigned...');
    memoryCode.isUsed = true;
    memoryCode.assignedToProduct = new Date();
    return memoryCode.save();
    
  } catch (error) {
    console.error('Error in markAsAssigned:', error);
    throw error;
  }
};

// Static method to mark a code as used
MemoryCodeSchema.statics.claimMemory = async function(code: string, userId?: string) {
  const memoryCode = await this.findOne({ code: code.toUpperCase() });
  if (!memoryCode) {
    throw new Error('Memory code not found');
  }
  
  if (memoryCode?.userId) {
    throw new Error('Memory code has already been used');
  }
  
  return memoryCode.markAsUsed(userId);
};

// Create the model
let MemoryCode: IMemoryCodeModel;

try {
  // Check if model already exists (important for Next.js hot reloading)
  MemoryCode = mongoose.model<IMemoryCode, IMemoryCodeModel>('MemoryCode') as IMemoryCodeModel;
} catch {
  // Model doesn't exist, create it
  MemoryCode = mongoose.model<IMemoryCode, IMemoryCodeModel>('MemoryCode', MemoryCodeSchema);
}

export default MemoryCode;
