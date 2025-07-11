# Calendly MCP Server Project

## Project Overview
Create a remote MCP (Model Context Protocol) server on Cloudflare Workers that allows AI assistants to interact with Calendly's API to check availability and book meetings.

## Technology Stack
- **Platform**: Cloudflare Workers + Durable Objects
- **Framework**: Cloudflare Agents SDK (@cloudflare/agents)
- **Language**: TypeScript
- **Validation**: Zod for type safety
- **API**: Calendly REST API

## Phase 1: Minimal Working MCP Server
**Goal**: Deploy a basic MCP server with one working tool to prove the infrastructure works.

### 1. Project Initialization
```bash
npm create cloudflare@latest calendly-mcp-server
cd calendly-mcp-server
npm install @cloudflare/agents zod
```

### 2. Configure wrangler.toml
```toml
name = "calendly-mcp-server"
main = "src/index.ts"
compatibility_date = "2024-12-01"

[[durable_objects.bindings]]
name = "MCP_AGENT"
class_name = "CalendlyMcpAgent"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["CalendlyMcpAgent"]
```

### 3. Create Basic MCP Server (src/index.ts)
```typescript
import { McpAgent } from '@cloudflare/agents';
import { z } from 'zod';

interface Env {
  CALENDLY_API_KEY?: string;
}

export class CalendlyMcpAgent extends McpAgent<Env> {
  async init() {
    // Single test tool to prove MCP works
    this.server.tool(
      'ping',
      'Test if the Calendly MCP server is working',
      {
        message: z.string().describe('A test message to echo back')
      },
      async ({ message }) => {
        return {
          content: [{
            type: 'text',
            text: `✅ Calendly MCP Server is WORKING! Your message: "${message}" received at ${new Date().toISOString()}`
          }]
        };
      }
    );
  }
}

export default CalendlyMcpAgent;
```

### 4. Local Development & Testing
```bash
# Start local development server
wrangler dev

# Test with MCP Inspector (in new terminal)
npx @modelcontextprotocol/inspector@latest
# Connect to: http://localhost:8787/sse
```

### 5. Deploy to Production
```bash
wrangler deploy
# Server available at: https://calendly-mcp-server.YOUR_SUBDOMAIN.workers.dev/sse
```

### 6. Validation Steps
- [ ] Local server starts without errors
- [ ] MCP Inspector connects to `/sse` endpoint
- [ ] "ping" tool appears in tools list
- [ ] "ping" tool executes successfully
- [ ] Production deployment works
- [ ] MCP client can connect via mcp-remote

## Phase 2: Calendly API Integration (After Phase 1 Success)

### Environment Setup
```bash
# Create .dev.vars for local development
echo "CALENDLY_API_KEY=your_calendly_personal_access_token" > .dev.vars

# Set production secret
wrangler secret put CALENDLY_API_KEY
```

### Calendly Client Helper (src/calendly-client.ts)
```typescript
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

  async getCurrentUser() {
    return this.makeRequest('/users/me');
  }

  async getEventTypes(userUri?: string) {
    const params = userUri ? `?user=${encodeURIComponent(userUri)}` : '';
    return this.makeRequest(`/event_types${params}`);
  }
}

export function getCalendlyClient(env: Env): CalendlyClient {
  return new CalendlyClient({
    apiKey: env.CALENDLY_API_KEY!,
    baseUrl: 'https://api.calendly.com',
  });
}
```

### Additional Tools to Implement
1. **get_user_info** - Get current Calendly user
2. **get_event_types** - List available event types  
3. **check_availability** - Get available time slots
4. **get_scheduled_events** - List upcoming events
5. **schedule_meeting** - Book new meetings (Phase 3)

### Zod Schemas for Type Safety (src/types.ts)
```typescript
import { z } from 'zod';

export const EventTypeUuidSchema = z.string()
  .uuid()
  .describe('UUID of the Calendly event type');

export const DateTimeSchema = z.string()
  .datetime()
  .describe('ISO 8601 datetime string');

export const EmailSchema = z.string()
  .email()
  .describe('Valid email address');
```

## Development Workflow
1. **Start with minimal working version** (Phase 1)
2. **Add one tool at a time** and test immediately
3. **Use MCP Inspector** for rapid testing
4. **Deploy frequently** to catch issues early
5. **Follow Cloudflare MCP patterns** for tool registration

## Testing Strategy
- **Local Testing**: wrangler dev + MCP Inspector
- **Production Testing**: Deploy + MCP Inspector on live URL
- **Client Testing**: Connect via mcp-remote in actual MCP client
- **Error Testing**: Test with invalid inputs to verify error handling

## Key Cloudflare MCP Concepts
- **McpAgent**: Base class for MCP servers
- **Durable Objects**: Stateful sessions for each client
- **SQLite Storage**: Persistent data across requests
- **SSE Endpoint**: Server-Sent Events at `/sse`
- **Tool Registration**: Use `this.server.tool()` method
- **Zod Validation**: Type-safe parameter validation

## MCP Client Configuration
```json
{
  "mcpServers": {
    "calendly": {
      "command": "npx",
      "args": ["mcp-remote", "https://calendly-mcp-server.YOUR_SUBDOMAIN.workers.dev/sse"]
    }
  }
}
```

## Security Considerations
- Store API keys as Cloudflare secrets
- Validate all inputs with Zod schemas
- Handle API rate limits (150 requests/minute for Calendly)
- Implement proper error messages for users

## Success Metrics
- MCP server deploys successfully
- All tools work as expected
- Error handling is robust
- Rate limiting is respected
- Users can book meetings through LLMs

## Resources
- [Cloudflare Agents SDK Docs](https://developers.cloudflare.com/agents/)
- [Calendly API Docs](https://developer.calendly.com/api-docs/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [MCP Inspector Tool](https://github.com/modelcontextprotocol/inspector)

## Implementation Notes
- Start simple and build incrementally
- Test each tool independently before combining
- Use TypeScript for better error catching
- Follow Cloudflare's MCP patterns exactly
- Deploy early and often to catch issues