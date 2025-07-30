'use strict';

/**
 * event-confirmation controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::event-confirmation.event-confirmation', ({ strapi }) => ({
  async findByGuest(ctx) {
    try {
      const { guestId } = ctx.params;
      
      console.log('findByGuest called with guestId:', guestId);
      
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

      console.log('Found confirmations for guest:', confirmations.length);
      console.log('Guest confirmations data:', JSON.stringify(confirmations, null, 2));

      return confirmations;
    } catch (error) {
      console.error('Error in findByGuest:', error);
      ctx.throw(500, error);
    }
  },

  async findByEvent(ctx) {
    try {
      const { eventId } = ctx.params;
      
      console.log('findByEvent called with eventId:', eventId);
      
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

      console.log('Found confirmations:', confirmations.length);
      console.log('Confirmations data:', JSON.stringify(confirmations, null, 2));

      return confirmations;
    } catch (error) {
      console.error('Error in findByEvent:', error);
      ctx.throw(500, error);
    }
  },

  async confirmForEvent(ctx) {
    try {
      const { guestId, eventId } = ctx.params;
      
      console.log('confirmForEvent called with:', { guestId, eventId });
      console.log('Request body:', ctx.request.body);
      
      // Check if request body exists and provide defaults
      if (!ctx.request.body) {
        console.error('Request body is missing');
        ctx.throw(400, 'Request body is required');
      }
      
      const { confirmed, confirmedGuests, notes, source = 'whatsapp' } = ctx.request.body;
      
      // Validate required fields
      if (confirmed === undefined || confirmed === null) {
        console.error('confirmed field is missing');
        ctx.throw(400, 'confirmed field is required');
      }

      console.log('Parsed data:', { confirmed, confirmedGuests, notes, source });

      // Verify that guest and event exist
      try {
        const guest = await strapi.documents('api::guest.guest').findOne({
          documentId: guestId
        });
        
        const event = await strapi.documents('api::event.event').findOne({
          documentId: eventId
        });

        if (!guest) {
          console.error('Guest not found:', guestId);
          ctx.throw(400, 'Guest not found');
        }

        if (!event) {
          console.error('Event not found:', eventId);
          ctx.throw(400, 'Event not found');
        }

        console.log('Guest and Event found:', { guest: guest.documentId, event: event.documentId });
      } catch (verifyError) {
        console.error('Error verifying guest/event:', verifyError);
        ctx.throw(400, 'Error verifying guest or event');
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

      console.log('Existing confirmation found:', existingConfirmation ? existingConfirmation.documentId : 'None');

      let result;
      if (existingConfirmation) {
        console.log('Existing confirmation status:', existingConfirmation.confirmed);
        
        // Only allow updates from the mobile app (app source)
        // Block all other sources if confirmation already exists and is not "unknown"
        if (existingConfirmation.confirmed !== 'unknown' && source !== 'app') {
          console.log('Confirmation already exists with status:', existingConfirmation.confirmed, 'Source:', source);
          ctx.throw(400, 'Esta confirmación ya ha sido procesada y solo puede ser modificada desde la aplicación móvil', {
            error: 'CONFIRMATION_ALREADY_EXISTS',
            details: {
              currentStatus: existingConfirmation.confirmed,
              confirmedAt: existingConfirmation.confirmedAt,
              source: existingConfirmation['source'] || 'unknown',
              allowedSource: 'app'
            }
          });
        }
        
        console.log('Updating existing confirmation...');
        // Update existing confirmation (only if current status is "unknown")
        result = await strapi.documents('api::event-confirmation.event-confirmation').update({
          documentId: existingConfirmation.documentId,
          data: {
            confirmed,
            confirmedGuests: confirmedGuests || 1,
            notes: notes || '',
            source,
            confirmedAt: new Date().toISOString()
          }
        });
        console.log('Confirmation updated successfully:', result.documentId);
      } else {
        console.log('Creating new confirmation...');
        // Create new confirmation
        result = await strapi.documents('api::event-confirmation.event-confirmation').create({
          data: {
            guest: guestId,
            event: eventId,
            confirmed,
            confirmedGuests: confirmedGuests || 1,
            notes: notes || '',
            source,
            confirmedAt: new Date().toISOString()
          }
        });
        console.log('Confirmation created successfully:', result.documentId);
      }

      return { data: result };
    } catch (error) {
      console.error('Error in confirmForEvent:', error);
      console.error('Error stack:', error.stack);
      ctx.throw(500, `Error processing confirmation: ${error.message}`);
    }
  },

  async findByGuestAndEvent(ctx) {
    try {
      const { guestId, eventId } = ctx.params;

      if (!guestId || !eventId) {
        ctx.throw(400, 'Guest ID and Event ID are required');
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
        ctx.throw(404, 'No confirmation found for this guest and event');
      }

      // Return the first confirmation (there should only be one per guest per event)
      return confirmations[0];
    } catch (error) {
      ctx.throw(500, error);
    }
  }
}));