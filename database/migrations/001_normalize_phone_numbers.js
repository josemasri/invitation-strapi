'use strict';

/**
 * Database migration to normalize phone numbers to WhatsApp format
 * This migration adds the proper country code (521) to existing phone numbers
 */

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

module.exports = {
  async up() {
    await strapi.db.transaction(async (trx) => {
      console.log('🚀 Starting phone number migration...');
      
      // Get all guests using raw database query
      const guests = await trx.select(['id', 'document_id', 'name', 'phone']).from('guests');
      
      console.log(`📊 Found ${guests.length} guests to process`);
      
      let updated = 0;
      let skipped = 0;
      let errors = 0;
      
      for (const guest of guests) {
        try {
          if (!guest.phone) {
            console.log(`⏩ Skipping guest ${guest.name} (ID: ${guest.document_id}) - no phone number`);
            skipped++;
            continue;
          }
          
          const originalPhone = guest.phone;
          const normalizedPhone = normalizePhoneToWhatsApp(originalPhone);
          
          // Only update if the phone number changed
          if (originalPhone !== normalizedPhone) {
            await trx('guests')
              .where({ id: guest.id })
              .update({ phone: normalizedPhone });
            
            console.log(`✅ Updated ${guest.name} (ID: ${guest.document_id}): ${originalPhone} → ${normalizedPhone}`);
            updated++;
          } else {
            console.log(`⏩ Skipping guest ${guest.name} (ID: ${guest.document_id}) - phone already normalized: ${originalPhone}`);
            skipped++;
          }
        } catch (error) {
          console.error(`❌ Error updating guest ${guest.name} (ID: ${guest.document_id}):`, error.message);
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
    });
  },
};