'use strict';

/**
 * guest service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::guest.guest', ({ strapi }) => ({
  // Normalize phone number to WhatsApp format (with country code)
  normalizePhoneToWhatsApp(phoneNumber) {
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
  },

  // Keep the default service
  async find(params) {
    return await super.find(params);
  },
  
  // Override create method to normalize phone numbers
  async create(params) {
    if (params.data && params.data.phone) {
      params.data.phone = this.normalizePhoneToWhatsApp(params.data.phone);
    }
    return await super.create(params);
  },
  
  // Override update method to normalize phone numbers
  async update(entityId, params) {
    if (params.data && params.data.phone) {
      params.data.phone = this.normalizePhoneToWhatsApp(params.data.phone);
    }
    return await super.update(entityId, params);
  },
  
  // Add custom service for processing CSV uploads
  async processCSVUpload(csvData) {
    try {
      // Parse CSV rows (assuming csvData is an array of objects)
      const rows = Array.isArray(csvData) ? csvData : JSON.parse(csvData);
      
      const results = {
        total: rows.length,
        created: 0,
        duplicates: [],
        errors: []
      };
      
      // Process each row
      for (const row of rows) {
        try {
          // Validate required fields
          if (!row.name) {
            results.errors.push({ row, error: 'Missing name field' });
            continue;
          }
          
          // Check for duplicates by phone number (normalize before checking)
          if (row.phone) {
            const normalizedPhone = this.normalizePhoneToWhatsApp(row.phone);
            const existingGuest = await strapi.db.query('api::guest.guest').findOne({
              where: { phone: normalizedPhone }
            });
            
            if (existingGuest) {
              results.duplicates.push({
                row,
                existing: {
                  id: existingGuest.id,
                  name: existingGuest.name,
                  phone: existingGuest.phone
                }
              });
              continue;
            }
          }
          
          // Prepare guest data
          const guestData = {
            name: row.name,
            phone: row.phone ? this.normalizePhoneToWhatsApp(row.phone) : null,
            maxGuests: parseInt(row.maxGuests) || 1,
            confirmedGuests: parseInt(row.confirmedGuests) || null,
            confirmed: row.confirmed || 'unknown',
            invitedBy: row.invitedBy || null,
            timesSended: parseInt(row.timesSended) || 0,
            message: row.message || null
          };
          
          // Create the guest
          await strapi.entityService.create('api::guest.guest', {
            data: guestData
          });
          
          results.created++;
        } catch (error) {
          results.errors.push({ row, error: error.message });
        }
      }
      
      return results;
    } catch (error) {
      throw new Error(`Error processing CSV: ${error.message}`);
    }
  }
}));
