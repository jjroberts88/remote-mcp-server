import app from "./app";
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { getCalendlyClient } from "./calendly-client";
import { UserUriSchema } from "./types";

interface Env {
  CALENDLY_API_KEY?: string;
}

export class MyMCP extends McpAgent<Env> {
	server = new McpServer({
		name: "Calendly MCP Server",
		version: "1.0.0",
	});

	async init() {
		// Get available times for Introduction Meeting
		this.server.tool(
			'get_meeting_times',
			'Get available time slots for Introduction Meeting bookings',
			{},
			async () => {
				try {
					const calendly = getCalendlyClient(this.env);
					
					// First get current user
					const userResponse = await calendly.getCurrentUser();
					const userUri = userResponse.resource.uri;
					
					// Get event types for this user
					const eventTypesResponse = await calendly.getEventTypes(userUri);
					const eventTypes = eventTypesResponse.collection;
					
					// Find the "Introduction Meeting" event type
					const introMeeting = eventTypes.find((et: any) => 
						et.name.toLowerCase().includes('introduction') && et.active
					);
					
					if (!introMeeting) {
						return {
							content: [{
								type: 'text',
								text: '📅 No active "Introduction Meeting" event type found. Available event types:\n' +
									eventTypes.map((et: any) => `• ${et.name} (${et.active ? 'Active' : 'Inactive'})`).join('\n')
							}]
						};
					}
					
					const introMeetingUri = introMeeting.uri;
					
					// Start tomorrow to ensure it's in the future, and only go 7 days out (API limit)
					const tomorrow = new Date();
					tomorrow.setDate(tomorrow.getDate() + 1);
					tomorrow.setHours(0, 0, 0, 0); // Start at beginning of day
					
					const oneWeekLater = new Date(tomorrow);
					oneWeekLater.setDate(oneWeekLater.getDate() + 7);
					
					const availableResponse = await calendly.getEventTypeAvailableTimes(
						introMeetingUri,
						tomorrow.toISOString(),
						oneWeekLater.toISOString()
					);
					
					const availableSlots = availableResponse.collection;
					
					if (availableSlots.length === 0) {
						return {
							content: [{
								type: 'text',
								text: `📅 No available times found for "${introMeeting.name}" in the next 7 days.`
							}]
						};
					}

					const slotsList = availableSlots.slice(0, 15).map((slot: any) => 
						`• ${new Date(slot.start_time).toLocaleString()}`
					).join('\n');

					return {
						content: [{
							type: 'text',
							text: `📅 **Available Times for "${introMeeting.name}"** (Next ${Math.min(15, availableSlots.length)} slots):\n\n${slotsList}`
						}]
					};
				} catch (error) {
					return {
						content: [{
							type: 'text',
							text: `❌ Error fetching available times: ${error instanceof Error ? error.message : 'Unknown error'}`
						}]
					};
				}
			}
		);
	}
}

// Export the OAuth handler as the default
export default new OAuthProvider({
	apiRoute: "/sse",
	// TODO: fix these types
	// @ts-expect-error
	apiHandler: MyMCP.mount("/sse"),
	// @ts-expect-error
	defaultHandler: app,
	authorizeEndpoint: "/authorize",
	tokenEndpoint: "/token",
	clientRegistrationEndpoint: "/register",
});
