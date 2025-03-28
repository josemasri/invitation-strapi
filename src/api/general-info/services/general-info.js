'use strict';

/**
 * general-info service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::general-info.general-info');
