'use strict';

/**
 * event-confirmation controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::event-confirmation.event-confirmation', ({ strapi }) => ({
  async findByGuest(ctx) {
    try {
      const { guestId } = ctx.params;
      
      const confirmations = await strapi.documents('api::event-confirmation.event-confirmation').findMany({
        filters: {
          guest: {
            documentId: guestId
          }
        },
        populate: {
          event: true,
          guest: true
        }
      });

      return confirmations;
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  async findByEvent(ctx) {
    try {
      const { eventId } = ctx.params;
      
      const confirmations = await strapi.documents('api::event-confirmation.event-confirmation').findMany({
        filters: {
          event: {
            documentId: eventId
          }
        },
        populate: {
          event: true,
          guest: true
        }
      });

      return confirmations;
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  async confirmForEvent(ctx) {
    try {
      const { guestId, eventId } = ctx.params;
      
      // Check if request body exists and provide defaults
      if (!ctx.request.body) {
        return ctx.badRequest('Request body is required');
      }
      
      const { confirmed, confirmedGuests, notes } = ctx.request.body;
      
      // Validate required fields
      if (confirmed === undefined || confirmed === null) {
        return ctx.badRequest('confirmed field is required');
      }

      // Check if confirmation already exists
      const existingConfirmation = await strapi.documents('api::event-confirmation.event-confirmation').findFirst({
        filters: {
          guest: {
            documentId: guestId
          },
          event: {
            documentId: eventId
          }
        }
      });

      let result;
      if (existingConfirmation) {
        // Update existing confirmation
        result = await strapi.documents('api::event-confirmation.event-confirmation').update({
          documentId: existingConfirmation.documentId,
          data: {
            confirmed,
            confirmedGuests,
            notes,
            confirmedAt: new Date().toISOString()
          }
        });
      } else {
        // Create new confirmation
        result = await strapi.documents('api::event-confirmation.event-confirmation').create({
          data: {
            guest: guestId,
            event: eventId,
            confirmed,
            confirmedGuests,
            notes,
            confirmedAt: new Date().toISOString()
          }
        });
      }

      return result;
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  async findByGuestAndEvent(ctx) {
    try {
      const { guestId, eventId } = ctx.params;

      if (!guestId || !eventId) {
        return ctx.badRequest('Guest ID and Event ID are required');
      }

      const confirmations = await strapi.documents('api::event-confirmation.event-confirmation').findMany({
        filters: {
          guest: {
            documentId: guestId
          },
          event: {
            documentId: eventId
          }
        },
        populate: {
          event: true,
          guest: true
        }
      });

      if (confirmations.length === 0) {
        return ctx.notFound('No confirmation found for this guest and event');
      }

      // Return the first confirmation (there should only be one per guest per event)
      return confirmations[0];
    } catch (error) {
      ctx.throw(500, error);
    }
  }
}));