'use strict';

/**
 * guest service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::guest.guest', ({ strapi }) => ({
  // Parse and separate country code from full phone number
  parsePhoneNumber(fullPhoneNumber) {
    console.log(`parsePhoneNumber input: "${fullPhoneNumber}"`);
    
    if (!fullPhoneNumber) {
      return { countryCode: '521', phone: '' };
    }
    
    // Remove any non-numeric characters
    let cleanPhone = fullPhoneNumber.replace(/\D/g, '');
    console.log(`After removing non-numeric: "${cleanPhone}"`);
    
    // If it has 521 prefix (Mexico with mobile prefix)
    if (cleanPhone.startsWith('521') && cleanPhone.length === 13) {
      return {
        countryCode: '521',
        phone: cleanPhone.substring(3) // Remove 521 prefix
      };
    }
    
    // If it has 52 prefix (Mexico without mobile prefix)
    if (cleanPhone.startsWith('52') && cleanPhone.length === 12) {
      return {
        countryCode: '521',
        phone: cleanPhone.substring(2) // Remove 52 prefix
      };
    }
    
    // If it has leading 1 (Mexico city code format)
    if (cleanPhone.startsWith('1') && cleanPhone.length === 11) {
      return {
        countryCode: '521',
        phone: cleanPhone.substring(1) // Remove leading 1
      };
    }
    
    // If it's a 10-digit number (assume Mexico)
    if (cleanPhone.length === 10) {
      return {
        countryCode: '521',
        phone: cleanPhone
      };
    }
    
    // Default case: assume it's already separated
    console.log(`Could not parse phone: "${cleanPhone}", treating as phone only`);
    return {
      countryCode: '521',
      phone: cleanPhone
    };
  },

  // Combine country code and phone for WhatsApp format
  combinePhoneForWhatsApp(countryCode, phone) {
    if (!phone) return '';
    
    // Remove any non-numeric characters from both
    const cleanCountryCode = countryCode ? countryCode.replace(/\D/g, '') : '521';
    const cleanPhone = phone.replace(/\D/g, '');
    
    console.log(`Combining ${cleanCountryCode} + ${cleanPhone} for WhatsApp`);
    return `${cleanCountryCode}${cleanPhone}`;
  },

  // Keep the default service
  async find(params) {
    return await super.find(params);
  },
  
  // Override create method to parse and separate phone numbers
  async create(params) {
    if (params.data && params.data.phone) {
      const parsed = this.parsePhoneNumber(params.data.phone);
      params.data.countryCode = parsed.countryCode;
      params.data.phone = parsed.phone;
    }
    return await super.create(params);
  },
  
  // Override update method to parse and separate phone numbers
  async update(entityId, params) {
    if (params.data && params.data.phone) {
      const parsed = this.parsePhoneNumber(params.data.phone);
      params.data.countryCode = parsed.countryCode;
      params.data.phone = parsed.phone;
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
          
          // Check for duplicates by phone number (parse and combine before checking)
          if (row.phone) {
            const parsed = this.parsePhoneNumber(row.phone);
            const fullWhatsAppPhone = this.combinePhoneForWhatsApp(parsed.countryCode, parsed.phone);
            const existingGuest = await strapi.db.query('api::guest.guest').findOne({
              where: { phone: parsed.phone, countryCode: parsed.countryCode }
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
          const parsed = row.phone ? this.parsePhoneNumber(row.phone) : { countryCode: '521', phone: '' };
          const guestData = {
            name: row.name,
            countryCode: parsed.countryCode,
            phone: parsed.phone,
            maxGuests: parseInt(row.maxGuests) || 1,
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
