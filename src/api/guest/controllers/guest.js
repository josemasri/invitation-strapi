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
  },

  // Add custom controller for CSV export
  async exportCSV(ctx) {
    try {
      const { query } = ctx;
      const { eventId, status } = query;

      if (!eventId) {
        return ctx.badRequest('Event ID is required');
      }

      // Fetch guests for the specific event with their confirmations
      const guests = await strapi.entityService.findMany('api::guest.guest', {
        filters: {
          event: {
            id: eventId
          }
        },
        populate: {
          eventConfirmations: true,
          event: true
        }
      });

      // Fetch confirmations for this event
      let confirmations = [];
      try {
        confirmations = await strapi.entityService.findMany('api::event-confirmation.event-confirmation', {
          filters: {
            event: {
              id: eventId
            }
          },
          populate: {
            guest: true
          }
        });
      } catch (confirmationError) {
        console.log('No event confirmations found for this event');
        confirmations = [];
      }

      // Merge guest data with confirmation data
      const guestsWithConfirmations = guests.map(guest => {
        const confirmation = confirmations.find(c => c.guest && c.guest.id === guest.id);
        return {
          ...guest,
          confirmed: confirmation?.confirmed || 'unknown',
          confirmedGuests: confirmation?.confirmedGuests || null,
          confirmedAt: confirmation?.confirmedAt || null,
          notes: confirmation?.notes || ''
        };
      });

      // Filter guests based on status if provided
      let filteredGuests = guestsWithConfirmations;
      if (status === 'confirmed') {
        filteredGuests = guestsWithConfirmations.filter(guest => guest.confirmed === 'yes');
      } else if (status === 'pending') {
        filteredGuests = guestsWithConfirmations.filter(guest =>
          guest.timesSended > 0 && (guest.confirmed === 'unknown' || !guest.confirmed)
        );
      } else if (status === 'no-invitation') {
        filteredGuests = guestsWithConfirmations.filter(guest => guest.timesSended === 0);
      }

      // Generate CSV content
      const csvHeaders = [
        'Nombre',
        'Nombre en Invitación',
        'Teléfono',
        'Máximo de Invitados',
        'Invitados Confirmados',
        'Estado de Confirmación',
        'Invitado por',
        'Veces Enviado',
        'Fecha de Confirmación',
        'Notas'
      ];

      const csvRows = filteredGuests.map(guest => [
        guest.name || '',
        guest.invitationName || '',
        guest.phone || '',
        guest.maxGuests || 0,
        guest.confirmedGuests || '',
        guest.confirmed === 'yes' ? 'Confirmado' :
        guest.confirmed === 'no' ? 'Rechazado' : 'Pendiente',
        guest.invitedBy || '',
        guest.timesSended || 0,
        guest.confirmedAt ? new Date(guest.confirmedAt).toLocaleDateString('es-MX') : '',
        guest.notes || ''
      ]);

      // Create CSV content
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      // Set appropriate headers for file download
      ctx.set('Content-Type', 'text/csv; charset=utf-8');
      ctx.set('Content-Disposition', `attachment; filename="invitados_${status || 'todos'}_${new Date().toISOString().split('T')[0]}.csv"`);

      return csvContent;
    } catch (error) {
      console.error('Error exporting CSV:', error);
      return ctx.badRequest(`Error exporting CSV: ${error.message}`);
    }
  }
}));
