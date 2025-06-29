'use strict';

/**
 * message-status controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::message-status.message-status', ({ strapi }) => ({
  
  /**
   * Get message status by message ID
   */
  async findByMessageId(ctx) {
    try {
      const { messageId } = ctx.params;
      
      const entity = await strapi.entityService.findMany('api::message-status.message-status', {
        filters: { messageId },
        populate: ['guest', 'event']
      });
      
      if (!entity || entity.length === 0) {
        return ctx.notFound('Message not found');
      }
      
      const sanitizedEntity = await this.sanitizeOutput(entity[0], ctx);
      return this.transformResponse(sanitizedEntity);
      
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  /**
   * Get message status history for a phone number
   */
  async findByPhoneNumber(ctx) {
    try {
      const { phoneNumber } = ctx.params;
      const { limit = 20 } = ctx.query;
      
      const entities = await strapi.entityService.findMany('api::message-status.message-status', {
        filters: { phoneNumber },
        sort: { createdAt: 'desc' },
        limit: parseInt(limit),
        populate: ['guest', 'event']
      });
      
      const sanitizedEntities = await this.sanitizeOutput(entities, ctx);
      return this.transformResponse(sanitizedEntities);
      
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  /**
   * Get message status for a guest
   */
  async findByGuest(ctx) {
    try {
      const { guestId } = ctx.params;
      const { eventId } = ctx.query;
      
      const filters = { guest: guestId };
      if (eventId) {
        filters.event = eventId;
      }
      
      const entities = await strapi.entityService.findMany('api::message-status.message-status', {
        filters,
        sort: { createdAt: 'desc' },
        populate: ['guest', 'event']
      });
      
      const sanitizedEntities = await this.sanitizeOutput(entities, ctx);
      return this.transformResponse(sanitizedEntities);
      
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  /**
   * Update message status (for webhooks)
   */
  async updateStatus(ctx) {
    try {
      const { messageId } = ctx.params;
      const { status, errorDetails, deliveredAt, readAt, failedAt } = ctx.request.body;
      
      // Find existing message status
      const existing = await strapi.entityService.findMany('api::message-status.message-status', {
        filters: { messageId }
      });
      
      if (!existing || existing.length === 0) {
        return ctx.notFound('Message not found');
      }
      
      const updateData = { status };
      
      if (status === 'delivered' && deliveredAt) {
        updateData.deliveredAt = deliveredAt;
      } else if (status === 'read' && readAt) {
        updateData.readAt = readAt;
      } else if (status === 'failed') {
        updateData.failedAt = failedAt || new Date();
        if (errorDetails) {
          updateData.errorDetails = errorDetails;
        }
      }
      
      const entity = await strapi.entityService.update('api::message-status.message-status', existing[0].id, {
        data: updateData
      });
      
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      return this.transformResponse(sanitizedEntity);
      
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  /**
   * Get message delivery statistics for an event
   */
  async getEventStats(ctx) {
    try {
      const { eventId } = ctx.params;
      
      const messages = await strapi.entityService.findMany('api::message-status.message-status', {
        filters: { event: eventId },
        populate: ['guest']
      });
      
      const stats = {
        total: messages.length,
        sent: messages.filter(m => m.status === 'sent').length,
        delivered: messages.filter(m => m.status === 'delivered').length,
        read: messages.filter(m => m.status === 'read').length,
        failed: messages.filter(m => m.status === 'failed').length,
        deliveryRate: 0,
        readRate: 0
      };
      
      if (stats.total > 0) {
        stats.deliveryRate = ((stats.delivered + stats.read) / stats.total * 100).toFixed(2);
        stats.readRate = (stats.read / stats.total * 100).toFixed(2);
      }
      
      return { data: stats };
      
    } catch (error) {
      ctx.throw(500, error);
    }
  }

}));