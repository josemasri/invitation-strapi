/**
 * Script to migrate existing phone numbers to WhatsApp format
 * This script normalizes all existing phone numbers in the database
 * to include the proper country code (521 prefix for Mexico)
 */

'use strict';

const path = require('path');

// Function to normalize phone number (same as in guest service)
function normalizePhoneToWhatsApp(phoneNumber) {
  console.log(`normalizePhoneToWhatsApp input: "${phoneNumber}"`);
  
  if (!phoneNumber) {
    console.log('Empty phone number provided');
    return phoneNumber;
  }
  
  // Remove any non-numeric characters
  let cleanPhone = phoneNumber.replace(/\D/g, '');
  console.log(`After removing non-numeric: "${cleanPhone}"`);
  
  // If already has 521 prefix, return as is
  if (cleanPhone.startsWith('521') && cleanPhone.length === 13) {
    console.log(`Already normalized: "${cleanPhone}"`);
    return cleanPhone;
  }
  
  // If has 52 prefix but not 521, convert it
  if (cleanPhone.startsWith('52') && cleanPhone.length === 12) {
    const normalized = '521' + cleanPhone.substring(2);
    console.log(`Converted 52 to 521: "${normalized}"`);
    return normalized;
  }
  
  // If it's a 10-digit Mexican number, add 521 prefix
  if (cleanPhone.length === 10) {
    const normalized = '521' + cleanPhone;
    console.log(`Added 521 prefix: "${normalized}"`);
    return normalized;
  }
  
  // If it has leading 1 (like 15563192945), remove it and add 521
  if (cleanPhone.startsWith('1') && cleanPhone.length === 11) {
    const withoutLeading1 = cleanPhone.substring(1);
    const normalized = '521' + withoutLeading1;
    console.log(`Removed leading 1 and added 521: "${normalized}"`);
    return normalized;
  }
  
  console.log(`Could not normalize phone: "${cleanPhone}", returning as is`);
  return cleanPhone;
}

async function migratePhoneNumbers() {
  try {
    console.log('🚀 Starting phone number migration...');
    
    // Get all guests using entityService
    const guests = await strapi.entityService.findMany('api::guest.guest', {
      fields: ['documentId', 'name', 'phone'],
    });
    
    console.log(`📊 Found ${guests.length} guests to process`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const guest of guests) {
      try {
        if (!guest.phone) {
          console.log(`⏩ Skipping guest ${guest.name} (ID: ${guest.documentId}) - no phone number`);
          skipped++;
          continue;
        }
        
        const originalPhone = guest.phone;
        const normalizedPhone = normalizePhoneToWhatsApp(originalPhone);
        
        // Only update if the phone number changed
        if (originalPhone !== normalizedPhone) {
          await strapi.entityService.update('api::guest.guest', guest.documentId, {
            data: { phone: normalizedPhone }
          });
          
          console.log(`✅ Updated ${guest.name} (ID: ${guest.documentId}): ${originalPhone} → ${normalizedPhone}`);
          updated++;
        } else {
          console.log(`⏩ Skipping guest ${guest.name} (ID: ${guest.documentId}) - phone already normalized: ${originalPhone}`);
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Error updating guest ${guest.name} (ID: ${guest.documentId}):`, error.message);
        errors++;
      }
    }
    
    console.log('\n📋 Migration Summary:');
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏩ Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total processed: ${guests.length}`);
    
    if (errors === 0) {
      console.log('🎉 Migration completed successfully!');
    } else {
      console.log('⚠️  Migration completed with some errors. Please review the logs above.');
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

module.exports = {
  migratePhoneNumbers,
  normalizePhoneToWhatsApp
};

// If this script is run directly
if (require.main === module) {
  const strapi = require('@strapi/strapi');
  const appContext = path.resolve(process.cwd());
  
  strapi.createStrapi({
    appDir: appContext,
    distDir: appContext
  }).load().then(async (app) => {
    global.strapi = app;
    
    try {
      await migratePhoneNumbers();
      console.log('Migration script completed');
      process.exit(0);
    } catch (error) {
      console.error('Migration script failed:', error);
      process.exit(1);
    }
  });
}