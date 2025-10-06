import axios from 'axios';

const CALENDLY_API_BASE = 'https://api.calendly.com';

export class CalendlyService {
  private static apiKey = process.env.CALENDLY_API_KEY;
  
  static {
    // Service initialized
  }

  private static getHeaders() {
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
    // Headers prepared for API call
    return headers;
  }

  // Get current user information
  static async getCurrentUser() {
    try {
      const response = await axios.get(`${CALENDLY_API_BASE}/users/me`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Calendly user:', error);
      throw error;
    }
  }

  // Get user's event types
  static async getEventTypes(userUri?: string) {
    try {
      // If no userUri provided, get current user first
      if (!userUri) {
        const user = await this.getCurrentUser() as any;
        userUri = user.resource.uri;
      }

      const response = await axios.get(`${CALENDLY_API_BASE}/event_types`, {
        headers: this.getHeaders(),
        params: {
          user: userUri,
          active: true
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching event types:', error);
      throw error;
    }
  }

  // Get scheduled events
  static async getScheduledEvents(options: {
    user?: string;
    min_start_time?: string;
    max_start_time?: string;
    status?: 'active' | 'canceled';
    sort?: string;
  } = {}) {
    try {
      const response = await axios.get(`${CALENDLY_API_BASE}/scheduled_events`, {
        headers: this.getHeaders(),
        params: options
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching scheduled events:', error);
      throw error;
    }
  }

  // Get event invitees
  static async getEventInvitees(eventUri: string) {
    try {
      const response = await axios.get(`${CALENDLY_API_BASE}/scheduled_events/${eventUri}/invitees`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching event invitees:', error);
      throw error;
    }
  }

  // Create webhook subscription
  static async createWebhookSubscription(url: string, events: string[], organizationUri?: string, scope: 'user' | 'organization' = 'organization') {
    try {
      // If no organizationUri provided, get current user first
      if (!organizationUri) {
        const user = await this.getCurrentUser() as any;
        organizationUri = user.resource.current_organization;
      }

      const requestBody: any = {
        url,
        events,
        organization: organizationUri,
        scope
      };

      // If scope is user, we need to add the user URI
      if (scope === 'user') {
        const user = await this.getCurrentUser() as any;
        requestBody.user = user.resource.uri;
      }

      const response = await axios.post(
        `${CALENDLY_API_BASE}/webhook_subscriptions`,
        requestBody,
        {
          headers: this.getHeaders()
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating webhook subscription:', error);
      throw error;
    }
  }

  // List webhook subscriptions
  static async listWebhookSubscriptions(organizationUri?: string) {
    try {
      // If no organizationUri provided, get current user first
      if (!organizationUri) {
        const user = await this.getCurrentUser() as any;
        organizationUri = user.resource.current_organization;
      }

      const response = await axios.get(`${CALENDLY_API_BASE}/webhook_subscriptions`, {
        headers: this.getHeaders(),
        params: {
          organization: organizationUri,
          scope: 'organization'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error listing webhook subscriptions:', error);
      throw error;
    }
  }

  // Delete webhook subscription
  static async deleteWebhookSubscription(webhookUri: string) {
    try {
      await axios.delete(`${CALENDLY_API_BASE}/webhook_subscriptions/${webhookUri}`, {
        headers: this.getHeaders()
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting webhook subscription:', error);
      throw error;
    }
  }

  // Get organization information
  static async getOrganization(organizationUri: string) {
    try {
      const response = await axios.get(organizationUri, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching organization:', error);
      throw error;
    }
  }
}