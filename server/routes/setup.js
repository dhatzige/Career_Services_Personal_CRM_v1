const express = require('express');
const router = express.Router();

// Get Calendly info
router.get('/calendly-info', async (req, res) => {
  try {
    // Check if Calendly API key is configured
    const hasApiKey = !!process.env.CALENDLY_API_KEY;
    
    const info = {
      configured: hasApiKey,
      apiKeyConfigured: hasApiKey,
      webhookConfigured: !!process.env.CALENDLY_WEBHOOK_SECRET,
      calendlyUrl: process.env.CALENDLY_URL || '',
      eventTypes: process.env.CALENDLY_EVENT_TYPES ? process.env.CALENDLY_EVENT_TYPES.split(',') : []
    };

    res.json({ 
      success: true, 
      data: info 
    });
  } catch (error) {
    console.error('Error fetching Calendly info:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch Calendly information' 
    });
  }
});

module.exports = router;