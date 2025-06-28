/**
 * Script to migrate existing phone numbers to separate countryCode and phone fields
 * This script separates phone numbers into countryCode and phone fields
 * Default country code is 521 for Mexico
 */

'use strict';

const path = require('path');

// Function to parse phone number into country code and phone number
function parsePhoneNumber(phoneNumber) {
  console.log(`parsePhoneNumber input: "${phoneNumber}"`);
  
  if (!phoneNumber) {
    console.log('Empty phone number provided');
    return { countryCode: '521', phone: null };
  }
  
  // Remove any non-numeric characters
  let cleanPhone = phoneNumber.replace(/\D/g, '');
  console.log(`After removing non-numeric: "${cleanPhone}"`);
  
  // If already has 521 prefix (WhatsApp format)
  if (cleanPhone.startsWith('521') && cleanPhone.length === 13) {
    const phone = cleanPhone.substring(3);
    console.log(`Parsed 521 format: countryCode=521, phone=${phone}`);
    return { countryCode: '521', phone };
  }
  
  // If has 52 prefix but not 521
  if (cleanPhone.startsWith('52') && cleanPhone.length === 12) {
    const phone = cleanPhone.substring(2);
    console.log(`Parsed 52 format: countryCode=521, phone=${phone}`);
    return { countryCode: '521', phone };
  }
  
  // If it's a 10-digit Mexican number
  if (cleanPhone.length === 10) {
    console.log(`Parsed 10-digit Mexican: countryCode=521, phone=${cleanPhone}`);
    return { countryCode: '521', phone: cleanPhone };
  }
  
  // If it has leading 1 (like 15563192945), remove it and treat as Mexican
  if (cleanPhone.startsWith('1') && cleanPhone.length === 11) {
    const phone = cleanPhone.substring(1);
    console.log(`Parsed 1-prefixed format: countryCode=521, phone=${phone}`);
    return { countryCode: '521', phone };
  }
  
  // If it starts with 1 and is 11 digits, might be US number
  if (cleanPhone.startsWith('1') && cleanPhone.length === 11) {
    const phone = cleanPhone.substring(1);
    console.log(`Parsed US format: countryCode=1, phone=${phone}`);
    return { countryCode: '1', phone };
  }
  
  // Default to Mexican format
  console.log(`Could not parse phone: "${cleanPhone}", defaulting to Mexican format`);
  return { countryCode: '521', phone: cleanPhone };
}

async function migratePhoneNumbers() {
  try {
    console.log('🚀 Starting phone number separation migration...');
    
    // Get all guests using entityService
    const guests = await strapi.entityService.findMany('api::guest.guest', {
      fields: ['documentId', 'name', 'phone', 'countryCode'],
    });
    
    console.log(`📊 Found ${guests.length} guests to process`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const guest of guests) {
      try {
        // Skip if guest already has separated fields and phone is present
        if (guest.countryCode && guest.phone) {
          console.log(`⏩ Skipping guest ${guest.name} (ID: ${guest.documentId}) - already has separated fields: countryCode=${guest.countryCode}, phone=${guest.phone}`);
          skipped++;
          continue;
        }
        
        if (!guest.phone) {
          // Set default country code if no phone number
          if (!guest.countryCode) {
            await strapi.entityService.update('api::guest.guest', guest.documentId, {
              data: { countryCode: '521' }
            });
            console.log(`✅ Set default countryCode for ${guest.name} (ID: ${guest.documentId}): countryCode=521`);
            updated++;
          } else {
            console.log(`⏩ Skipping guest ${guest.name} (ID: ${guest.documentId}) - no phone number but has countryCode`);
            skipped++;
          }
          continue;
        }
        
        const originalPhone = guest.phone;
        const { countryCode, phone } = parsePhoneNumber(originalPhone);
        
        // Update the guest with separated fields
        const updateData = {
          countryCode: countryCode,
          phone: phone
        };
        
        await strapi.entityService.update('api::guest.guest', guest.documentId, {
          data: updateData
        });
        
        console.log(`✅ Updated ${guest.name} (ID: ${guest.documentId}): "${originalPhone}" → countryCode=${countryCode}, phone=${phone}`);
        updated++;
        
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
  parsePhoneNumber
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