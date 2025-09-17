// Example usage of User model with MongoDB
// This demonstrates how to integrate the User model with the existing auth APIs

import User, { IUser } from '@/app/models/User';
import dbConnect from '@/app/services/db.service';
import { JWTService } from '@/app/services/jwt.service';

export class UserService {
  /**
   * Create a new user
   */
  static async createUser(userData: {
    email: string;
    password: string;
    name?: string;
    role?: 'user' | 'admin';
  }): Promise<IUser> {
    await dbConnect();
    
    // Check if user already exists
    const existingUser = await User.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create user with hashed password
    const user = await User.createUser(userData);
    return user;
  }

  /**
   * Authenticate user login
   */
  static async authenticateUser(email: string, password: string): Promise<{
    user: IUser;
    token: string;
  }> {
    await dbConnect();
    
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = JWTService.generateToken({
      userId: user._id,
      email: user.email
    });

    return { user, token };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<IUser | null> {
    await dbConnect();
    return User.findById(userId);
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<IUser | null> {
    await dbConnect();
    return User.findByEmail(email);
  }

  /**
   * Update user
   */
  static async updateUser(userId: string, updateData: Partial<IUser>): Promise<IUser | null> {
    await dbConnect();
    
    // Remove sensitive fields from update
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUpdateData } = updateData;
    
    return User.findByIdAndUpdate(
      userId,
      safeUpdateData,
      { new: true, runValidators: true }
    );
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    await dbConnect();
    
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password length
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    // Hash new password
    const { JWTService } = await import('@/app/services/jwt.service');
    const hashedNewPassword = await JWTService.hashPassword(newPassword);

    // Update password
    user.password = hashedNewPassword;
    await user.save();
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<boolean> {
    await dbConnect();
    
    const result = await User.findByIdAndDelete(userId);
    return !!result;
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(page: number = 1, limit: number = 10): Promise<{
    users: IUser[];
    total: number;
    pages: number;
  }> {
    await dbConnect();
    
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      User.find({}).skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments({})
    ]);

    return {
      users,
      total,
      pages: Math.ceil(total / limit)
    };
  }
}
