'use strict';

/**
 * message-status router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;
const defaultRouter = createCoreRouter('api::message-status.message-status');

const customRouter = (innerRouter, extraRoutes = []) => {
  let routes;
  return {
    get prefix() {
      return innerRouter.prefix;
    },
    get routes() {
      if (!routes) routes = innerRouter.routes.concat(extraRoutes);
      return routes;
    },
  };
};

const myExtraRoutes = [
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

module.exports = customRouter(defaultRouter, myExtraRoutes);