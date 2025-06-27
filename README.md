# MCP Google Calendar Server

A comprehensive Model Context Protocol (MCP) server implementation that enables AI assistants like Claude, Cursor, and automation tools like n8n to interact with Google Calendar.

## Features

### 8 Complete Google Calendar Tools:
- **`list_calendars`** - List all available calendars
- **`get_calendar`** - Get details of a specific calendar  
- **`list_events`** - List events with filtering options
- **`get_event`** - Get detailed event information
- **`create_event`** - Create new calendar events with timezone support
- **`update_event`** - Update existing events with timezone support
- **`delete_event`** - Delete calendar events
- **`list_colors`** - List available colors for events/calendars

### Additional Features:
- OAuth2 authentication with Google Calendar API
- **Timezone support with CST (America/Chicago) as default**
- Full MCP protocol implementation
- Comprehensive error handling and debug logging
- Support for event attendees, locations, and descriptions
- Secure environment variable configuration

### Timezone Configuration:
- **Default timezone**: CST (America/Chicago)
- Supports any valid timezone (e.g., "America/New_York", "Europe/London", "Asia/Tokyo")
- Times should be specified in ISO format (e.g., "2025-06-27T18:30:00")
- Timezone can be specified per event or defaults to CST

## Prerequisites

- Node.js v18 or later
- Google Cloud Console project with Calendar API enabled
- OAuth2 credentials (Client ID and Client Secret)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/traytonpesco/mcp-google-calendar-suite.git
cd mcp-google-calendar-suite/mcp-google-calendar/mcp-google-calendar
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with:
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REFRESH_TOKEN=your_refresh_token_here
```

4. Get your refresh token:
```bash
npm run auth
```
Follow the instructions, and copy the refresh token to your `.env` file.

## Usage

```bash
npm start
```

The server will start and listen for MCP protocol messages via stdio.

## Integration

### With Cursor AI
Add this MCP server to your Cursor configuration.

### With Claude Desktop
Configure the MCP connection in Claude Desktop settings.

### With n8n
Use this server as an MCP node in your n8n workflows.

## Security

- **No hardcoded secrets** - All sensitive data uses environment variables
- **OAuth2 refresh tokens** are securely managed
- **Push protection compatible** - Safe for version control

## Version

Current version: **2.0.0** - Complete 8-tool implementation
