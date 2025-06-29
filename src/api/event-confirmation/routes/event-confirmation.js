'use strict';

/**
 * event-confirmation router
 */

module.exports = {
  routes: [
    // Core CRUD routes
    {
      method: 'GET',
      path: '/event-confirmations',
      handler: 'event-confirmation.find',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/event-confirmations/:id',
      handler: 'event-confirmation.findOne',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/event-confirmations',
      handler: 'event-confirmation.create',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/event-confirmations/:id',
      handler: 'event-confirmation.update',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/event-confirmations/:id',
      handler: 'event-confirmation.delete',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    // Custom routes
    {
      method: 'GET',
      path: '/event-confirmations/find/:guestId/:eventId',
      handler: 'event-confirmation.findByGuestAndEvent',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/event-confirmations/guest/:guestId',
      handler: 'event-confirmation.findByGuest',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/event-confirmations/event/:eventId',
      handler: 'event-confirmation.findByEvent',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/event-confirmations/confirm/:guestId/:eventId',
      handler: 'event-confirmation.confirmForEvent',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};