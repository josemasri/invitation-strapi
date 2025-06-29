'use strict';

/**
 * message-status service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::message-status.message-status');