export class CalendlyClient {
  constructor(private config: { apiKey: string; baseUrl: string }) {}

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Calendly API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getCurrentUser(): Promise<{ resource: any }> {
    return this.makeRequest('/users/me') as Promise<{ resource: any }>;
  }

  async getEventTypes(userUri?: string): Promise<{ collection: any[] }> {
    const params = userUri ? `?user=${encodeURIComponent(userUri)}` : '';
    return this.makeRequest(`/event_types${params}`) as Promise<{ collection: any[] }>;
  }

  async getScheduledEvents(userUri: string, startTime?: string, endTime?: string) {
    const params = new URLSearchParams({ user: userUri });
    if (startTime) params.append('min_start_time', startTime);
    if (endTime) params.append('max_start_time', endTime);
    return this.makeRequest(`/scheduled_events?${params}`);
  }

  async getEventTypeAvailableTimes(eventTypeUri: string, startTime: string, endTime: string): Promise<{ collection: any[] }> {
    // Try with just the UUID from the URI instead of full URI
    const eventTypeId = eventTypeUri.split('/').pop();
    const params = new URLSearchParams({
      event_type: `https://api.calendly.com/event_types/${eventTypeId}`,
      start_time: startTime.split('.')[0] + 'Z', // Ensure proper ISO format
      end_time: endTime.split('.')[0] + 'Z'
    });
    
    console.log('Requesting:', `/event_type_available_times?${params}`);
    return this.makeRequest(`/event_type_available_times?${params}`) as Promise<{ collection: any[] }>;
  }
}

interface Env {
  CALENDLY_API_KEY?: string;
}

export function getCalendlyClient(env: Env): CalendlyClient {
  if (!env.CALENDLY_API_KEY) {
    throw new Error('CALENDLY_API_KEY environment variable is required');
  }
  
  return new CalendlyClient({
    apiKey: env.CALENDLY_API_KEY,
    baseUrl: 'https://api.calendly.com',
  });
}