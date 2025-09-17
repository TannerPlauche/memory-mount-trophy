import mongoose, { Document, Schema, Model } from 'mongoose';

// User interface for TypeScript
export interface IUser extends Document {
    _id: string;
    email: string;
    password: string;
    name?: string;
    role: 'user' | 'admin';
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    deleted?: Date;  // Soft delete timestamp
    admin?: boolean;  // Added admin property

    // Instance methods
    comparePassword(candidatePassword: string): Promise<boolean>;
}

// Interface for the User model with static methods
export interface IUserModel extends Model<IUser> {
    findByEmail(email: string): Promise<IUser | null>;
    createUser(userData: {
        email: string;
        password: string;
        role?: 'user' | 'admin';
    }): Promise<IUser>;
}

// User schema definition
const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                'Please provide a valid email address'
            ]
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters long']
        },
        name: {
            type: String,
            trim: true,
            required: false,
            maxlength: [50, 'Name cannot exceed 50 characters']
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        deleted: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
        toJSON: {
            transform: function (doc, ret) {
                // Remove password from JSON output
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { password, ...userWithoutPassword } = ret;
                return userWithoutPassword;
            }
        }
    }
);

// Pre-save middleware to hash password (if using this model with password hashing)
// Note: Since we're using JWTService for hashing, this is optional
// UserSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
//   
//   try {
//     const { JWTService } = await import('../services/jwt.service');
//     this.password = await JWTService.hashPassword(this.password);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// Instance method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    const { JWTService } = await import('../services/jwt.service');
    return JWTService.comparePassword(candidatePassword, this.password);
};

// Static method to find user by email
UserSchema.statics.findByEmail = function (email: string) {
    return this.findOne({ email: email.toLowerCase(), deleted: null });
};

// Static method to create user with hashed password
UserSchema.statics.createUser = async function (userData: {
    email: string;
    password: string;
    name?: string;
    role?: 'user' | 'admin';
}) {
    const { JWTService } = await import('../services/jwt.service');

    const hashedPassword = await JWTService.hashPassword(userData.password);

    return this.create({
        ...userData,
        password: hashedPassword,
        email: userData.email.toLowerCase()
    });
};

// Create the model
let User: IUserModel;

try {
    // Check if model already exists (important for Next.js hot reloading)
    User = mongoose.model<IUser, IUserModel>('User') as IUserModel;
} catch {
    // Model doesn't exist, create it
    User = mongoose.model<IUser, IUserModel>('User', UserSchema);
}

export default User;
