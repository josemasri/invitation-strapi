'use strict';

/**
 * guest controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::guest.guest', ({ strapi }) => ({
  // Keep the default controller
  async find(ctx) {
    return await super.find(ctx);
  },
  
  // Add custom controller for CSV upload
  async uploadCSV(ctx) {
    try {
      const { request } = ctx;
      const { body } = request;
      
      if (!body.data) {
        return ctx.badRequest('No CSV data provided');
      }
      
      // Parse CSV data
      const csvData = body.data;
      
      // Process the data and create guests
      const result = await strapi.service('api::guest.guest').processCSVUpload(csvData);
      
      return {
        data: result,
        meta: { success: true }
      };
    } catch (error) {
      return ctx.badRequest(`Error uploading CSV: ${error.message}`);
    }
  }
}));
