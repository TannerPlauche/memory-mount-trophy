#!/usr/bin/env node

// Simple script to run the memory code migration
// Usage: node scripts/migrate-memory-codes.js

const { migrateMemoryCodesFromJson } = require('./migrate-memory-codes-standalone.js');

async function runMigration() {
  console.log('🚀 Starting memory code migration...');
  
  try {
    await migrateMemoryCodesFromJson();
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
