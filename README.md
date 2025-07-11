# Calendly MCP Server

A remote MCP (Model Context Protocol) server that integrates with Calendly to check available meeting times.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .dev.vars
   # Edit .dev.vars and add your Calendly Personal Access Token
   ```

3. **Get your Calendly API key:**
   - Go to https://calendly.com/integrations/api_webhooks
   - Create a Personal Access Token
   - Add it to `.dev.vars`

## Development

```bash
# Start local development server
npm run dev

# Test with MCP Inspector
npx @modelcontextprotocol/inspector@latest
# Connect to: http://localhost:8787/sse
```

## Tools

- `get_meeting_times` - Get available time slots for Introduction Meeting bookings

## Deployment

```bash
# Set production API key
wrangler secret put CALENDLY_API_KEY

# Deploy to Cloudflare Workers
npm run deploy
```

## MCP Client Configuration

```json
{
  "mcpServers": {
    "calendly": {
      "command": "npx",
      "args": ["mcp-remote", "https://your-worker.workers.dev/sse"]
    }
  }
}
```