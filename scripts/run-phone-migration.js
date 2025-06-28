#!/usr/bin/env node

/**
 * Script to run the phone number normalization migration
 * This script loads Strapi and executes the migration manually
 */

'use strict';

const path = require('path');

async function runMigration() {
  console.log('🚀 Starting Strapi for migration...');
  
  // Create Strapi instance
  const strapi = require('@strapi/strapi');
  const appContext = path.resolve(__dirname, '..');
  
  try {
    // Load Strapi
    const app = await strapi.createStrapi({
      appDir: appContext,
      distDir: appContext
    }).load();
    
    global.strapi = app;
    
    console.log('✅ Strapi loaded successfully');
    
    // Import and run the migration
    const migration = require('../database/migrations/001_normalize_phone_numbers.js');
    
    console.log('📞 Running phone number normalization migration...');
    await migration.up();
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    if (global.strapi) {
      console.log('🔄 Destroying Strapi instance...');
      await global.strapi.destroy();
    }
    console.log('✅ Migration script completed');
    process.exit(0);
  }
}

// Run the migration
runMigration().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});