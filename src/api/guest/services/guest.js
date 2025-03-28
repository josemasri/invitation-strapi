'use strict';

/**
 * guest service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::guest.guest', ({ strapi }) => ({
  // Keep the default service
  async find(params) {
    return await super.find(params);
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
          
          // Check for duplicates by phone number
          if (row.phone) {
            const existingGuest = await strapi.db.query('api::guest.guest').findOne({
              where: { phone: row.phone }
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
            phone: row.phone || null,
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
