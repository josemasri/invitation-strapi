'use strict';

/**
 * Custom guest routes
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/guests/export-csv',
      handler: 'guest.exportCSV',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
        middlewares: [],
      },
    },
  ],
};