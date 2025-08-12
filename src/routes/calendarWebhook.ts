import { Router } from 'express';
import * as calendarController from '../controllers/calendarController';
import { CalendlyService } from '../services/calendlyService';
import crypto from 'crypto';

const router = Router();

// Public webhook endpoints (no auth required)
router.post('/calendly', calendarController.handleCalendlyWebhook);

// Simple webhook setup endpoint (no CSRF/auth for easier setup)
router.post('/setup', async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    
    if (!webhookUrl) {
      res.status(400).json({
        success: false,
        message: 'Webhook URL is required'
      });
      return;
    }
    
    // Generate a webhook secret
    const webhookSecret = crypto.randomBytes(32).toString('hex');
    
    // Get current user
    const userInfo = await CalendlyService.getCurrentUser() as any;
    const organizationUri = userInfo.resource.current_organization;
    
    // Check if webhook already exists
    const existingWebhooks = await CalendlyService.listWebhookSubscriptions(organizationUri);
    
    // Remove existing webhooks for this URL
    for (const webhook of (existingWebhooks as any).collection) {
      if (webhook.callback_url === webhookUrl) {
        await CalendlyService.deleteWebhookSubscription(webhook.uri);
      }
    }
    
    // Create new webhook subscription
    const webhookData = await CalendlyService.createWebhookSubscription(
      webhookUrl,
      ['invitee.created', 'invitee.canceled', 'invitee_no_show.created'],
      organizationUri,
      'organization'
    );
    
    res.json({
      success: true,
      message: 'Calendly webhook configured successfully',
      data: {
        webhookUri: (webhookData as any).resource.uri,
        webhookSecret,
        callbackUrl: webhookUrl,
        events: (webhookData as any).resource.events
      }
    });
  } catch (error) {
    console.error('Error setting up Calendly webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup Calendly webhook',
      error: error.response?.data || error.message
    });
  }
});

export default router;