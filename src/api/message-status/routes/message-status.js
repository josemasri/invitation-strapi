'use strict';

/**
 * message-status router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// Create default router for CRUD operations
const defaultRouter = createCoreRouter('api::message-status.message-status');

// Define custom routes
const customRoutes = [
  {
    method: 'GET',
    path: '/message-statuses/message/:messageId',
    handler: 'message-status.findByMessageId'
  },
  {
    method: 'GET',
    path: '/message-statuses/phone/:phoneNumber',
    handler: 'message-status.findByPhoneNumber'
  },
  {
    method: 'GET',
    path: '/message-statuses/guest/:guestId',
    handler: 'message-status.findByGuest'
  },
  {
    method: 'PUT',
    path: '/message-statuses/update/:messageId',
    handler: 'message-status.updateStatus'
  },
  {
    method: 'GET',
    path: '/message-statuses/stats/event/:eventId',
    handler: 'message-status.getEventStats'
  }
];

// Export combined routes
module.exports = {
  routes: [
    // Default CRUD routes
    ...defaultRouter.routes,
    // Custom routes
    ...customRoutes
  ]
};