'use strict';

/**
 * event-confirmation router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = {
  routes: [
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