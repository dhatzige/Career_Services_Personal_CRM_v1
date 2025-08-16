const express = require('express');
const router = express.Router();
const axios = require('axios');

// Get Calendly configuration
router.get('/config/calendly', async (req, res) => {
  try {
    const calendlyApiKey = process.env.CALENDLY_API_KEY;
    const calendlyUrl = process.env.CALENDLY_URL || 'https://calendly.com/your-username';
    
    if (!calendlyApiKey) {
      // Return basic config without API data
      const config = {
        url: calendlyUrl,
        user: {
          name: 'Career Services',
          email: 'career@university.edu',
          schedulingUrl: calendlyUrl,
          timezone: 'America/New_York'
        },
        eventTypes: process.env.CALENDLY_EVENT_TYPES ? process.env.CALENDLY_EVENT_TYPES.split(',') : [
          '30-minute-meeting',
          '60-minute-meeting'
        ],
        embedOptions: {
          hideEventTypeDetails: false,
          hideLandingPageDetails: false,
          primaryColor: '#2563eb',
          textColor: '#374151',
          hideGdprBanner: true
        }
      };
      
      return res.json({ 
        success: true, 
        data: config 
      });
    }

    // Fetch user data from Calendly
    const userResponse = await axios.get('https://api.calendly.com/users/me', {
      headers: {
        'Authorization': `Bearer ${calendlyApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const user = userResponse.data.resource;

    // Fetch event types
    let eventTypes = [];
    try {
      const eventTypesResponse = await axios.get(`https://api.calendly.com/event_types?user=${encodeURIComponent(user.uri)}&active=true`, {
        headers: {
          'Authorization': `Bearer ${calendlyApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      eventTypes = eventTypesResponse.data.collection || [];
    } catch (error) {
      console.error('Error fetching event types:', error);
      eventTypes = [];
    }

    const config = {
      url: user.scheduling_url || calendlyUrl,
      user: {
        name: user.name || 'Career Services',
        email: user.email || 'career@university.edu',
        schedulingUrl: user.scheduling_url || calendlyUrl,
        timezone: user.timezone || 'America/New_York',
        avatar_url: user.avatar_url
      },
      eventTypes: eventTypes.map(et => ({
        uri: et.uri,
        name: et.name,
        slug: et.slug,
        schedulingUrl: et.scheduling_url,
        duration: et.duration,
        color: et.color || '#2563eb',
        description_plain: et.description_plain || '',
        active: et.active
      })),
      embedOptions: {
        hideEventTypeDetails: false,
        hideLandingPageDetails: false,
        primaryColor: '#2563eb',
        textColor: '#374151',
        hideGdprBanner: true
      }
    };

    res.json({ 
      success: true, 
      data: config 
    });
  } catch (error) {
    console.error('Error fetching Calendly config:', error);
    
    // Return fallback config on error
    const fallbackConfig = {
      url: process.env.CALENDLY_URL || 'https://calendly.com/your-username',
      user: {
        name: 'Career Services',
        email: 'career@university.edu',
        schedulingUrl: process.env.CALENDLY_URL || 'https://calendly.com/your-username',
        timezone: 'America/New_York'
      },
      eventTypes: [],
      embedOptions: {
        hideEventTypeDetails: false,
        hideLandingPageDetails: false,
        primaryColor: '#2563eb',
        textColor: '#374151',
        hideGdprBanner: true
      }
    };
    
    res.json({ 
      success: true, 
      data: fallbackConfig 
    });
  }
});

// Get upcoming meetings from Calendly
router.get('/meetings/upcoming', async (req, res) => {
  try {
    const calendlyApiKey = process.env.CALENDLY_API_KEY;
    
    if (!calendlyApiKey) {
      console.log('No Calendly API key configured, returning empty meetings');
      return res.json({ 
        success: true, 
        data: [] 
      });
    }

    // First, get the current user to get their URI
    let userUri;
    try {
      const userResponse = await axios.get('https://api.calendly.com/users/me', {
        headers: {
          'Authorization': `Bearer ${calendlyApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      userUri = userResponse.data.resource.uri;
    } catch (error) {
      console.error('Failed to fetch Calendly user:', error.response?.status || error);
      return res.json({ 
        success: true, 
        data: [] 
      });
    }

    // Fetch scheduled events from Calendly
    const now = new Date().toISOString();
    const eventsUrl = `https://api.calendly.com/scheduled_events?user=${encodeURIComponent(userUri)}&min_start_time=${now}&status=active&sort=start_time:asc&count=20`;
    
    let events = [];
    try {
      const eventsResponse = await axios.get(eventsUrl, {
        headers: {
          'Authorization': `Bearer ${calendlyApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      events = eventsResponse.data.collection || [];
    } catch (error) {
      console.error('Failed to fetch Calendly events:', error.response?.status || error);
      return res.json({ 
        success: true, 
        data: [] 
      });
    }

    // Transform Calendly events to our meeting format
    const meetings = await Promise.all(events.map(async (event) => {
      let inviteeEmail = 'N/A';
      let inviteeName = 'Calendly User';
      
      // Try to get invitee information
      if (event.uri) {
        try {
          const inviteesUrl = `${event.uri}/invitees`;
          const inviteesResponse = await axios.get(inviteesUrl, {
            headers: {
              'Authorization': `Bearer ${calendlyApiKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (inviteesResponse.data.collection && inviteesResponse.data.collection.length > 0) {
            const invitee = inviteesResponse.data.collection[0];
            inviteeName = invitee.name || 'Calendly User';
            inviteeEmail = invitee.email || 'N/A';
          }
        } catch (error) {
          console.error('Error fetching invitee details:', error.response?.status || error);
        }
      }

      return {
        id: event.uri.split('/').pop(),
        date: event.start_time,
        duration: Math.round((new Date(event.end_time) - new Date(event.start_time)) / 60000), // Duration in minutes
        type: event.name || 'Meeting',
        location: event.location?.type === 'physical' ? event.location.location : (event.location?.join_url ? 'Online Meeting' : 'To be determined'),
        meetingLink: event.location?.join_url,
        student: {
          id: event.uri.split('/').pop(),
          name: inviteeName,
          email: inviteeEmail
        },
        status: event.status || 'scheduled',
        notes: `Event Type: ${event.event_type || 'N/A'}`
      };
    }));

    res.json({ 
      success: true, 
      data: meetings 
    });
  } catch (error) {
    console.error('Error fetching Calendly meetings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch meetings from Calendly' 
    });
  }
});

// Setup webhook with Calendly
router.post('/webhook/setup', async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    
    // In a real implementation, this would register the webhook with Calendly API
    // For now, just return success
    console.log('Setting up Calendly webhook:', webhookUrl);
    
    res.json({ 
      success: true, 
      message: 'Webhook setup initiated. Please configure CALENDLY_WEBHOOK_SECRET in your environment.' 
    });
  } catch (error) {
    console.error('Error setting up webhook:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to setup webhook' 
    });
  }
});

// Create a new meeting (webhook from Calendly)
router.post('/meetings/webhook', async (req, res) => {
  try {
    // Handle Calendly webhook events
    const { event, payload } = req.body;
    
    console.log('Calendly webhook received:', event);
    
    // Process different event types
    switch (event) {
      case 'invitee.created':
        // Handle new meeting scheduled
        console.log('New meeting scheduled:', payload);
        break;
      case 'invitee.canceled':
        // Handle meeting cancellation
        console.log('Meeting canceled:', payload);
        break;
      default:
        console.log('Unhandled event type:', event);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process webhook' 
    });
  }
});

// Calendly webhook endpoint (public endpoint)
router.post('/webhook/calendly', async (req, res) => {
  try {
    // Verify webhook signature if secret is configured
    const secret = process.env.CALENDLY_WEBHOOK_SECRET;
    if (secret) {
      // In production, verify the webhook signature here
      // const signature = req.headers['calendly-webhook-signature'];
      // Verify signature...
    }
    
    const { event, payload } = req.body;
    console.log('Calendly webhook event:', event);
    
    // Handle different event types
    switch (event) {
      case 'invitee.created':
        // New appointment scheduled
        console.log('New appointment:', payload);
        // TODO: Save to database, send notifications, etc.
        break;
        
      case 'invitee.canceled':
        // Appointment canceled
        console.log('Appointment canceled:', payload);
        // TODO: Update database, send notifications, etc.
        break;
        
      default:
        console.log('Unknown event type:', event);
    }
    
    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent retries
    res.status(200).json({ received: true, error: true });
  }
});

module.exports = router;