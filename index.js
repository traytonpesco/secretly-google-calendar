#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { google } from 'googleapis';

// Default timezone configuration (CST)
const DEFAULT_TIMEZONE = 'America/Chicago';

// Debug log utility
function debugLog(...args) {
    console.error('DEBUG:', new Date().toISOString(), ...args);
}

// Define all calendar tools
const CALENDAR_TOOLS = [
    {
        name: "list_calendars",
        description: "List all available calendars",
        inputSchema: {
            type: "object",
            properties: {},
            required: []
        }
    },
    {
        name: "get_calendar",
        description: "Get details of a specific calendar",
        inputSchema: {
            type: "object",
            properties: {
                calendarId: {
                    type: "string",
                    description: "Calendar ID (use 'primary' for main calendar)"
                }
            },
            required: ["calendarId"]
        }
    },
    {
        name: "list_events",
        description: "List events from a calendar with filtering options",
        inputSchema: {
            type: "object",
            properties: {
                calendarId: {
                    type: "string",
                    description: "Calendar ID (use 'primary' for main calendar)"
                },
                timeMin: {
                    type: "string",
                    description: "Start time (ISO format, optional)"
                },
                timeMax: {
                    type: "string",
                    description: "End time (ISO format, optional)"
                },
                maxResults: {
                    type: "number",
                    description: "Maximum number of events to return (default: 10)"
                }
            },
            required: ["calendarId"]
        }
    },
    {
        name: "get_event",
        description: "Get detailed information about a specific event",
        inputSchema: {
            type: "object",
            properties: {
                calendarId: {
                    type: "string",
                    description: "Calendar ID (use 'primary' for main calendar)"
                },
                eventId: {
                    type: "string",
                    description: "Event ID"
                }
            },
            required: ["calendarId", "eventId"]
        }
    },
    {
        name: "create_event",
        description: "Create a calendar event with specified details. Times should be specified in ISO format. Default timezone is CST (America/Chicago).",
        inputSchema: {
            type: "object",
            properties: {
                calendarId: {
                    type: "string",
                    description: "Calendar ID (use 'primary' for main calendar)",
                    default: "primary"
                },
                summary: {
                    type: "string",
                    description: "Event title"
                },
                start_time: {
                    type: "string",
                    description: "Start time (ISO format)"
                },
                end_time: {
                    type: "string",
                    description: "End time (ISO format)"
                },
                description: {
                    type: "string",
                    description: "Event description"
                },
                attendees: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of attendee emails"
                },
                location: {
                    type: "string",
                    description: "Event location"
                },
                timezone: {
                    type: "string",
                    description: "Timezone for the event (default: America/Chicago for CST)",
                    default: "America/Chicago"
                }
            },
            required: ["summary", "start_time", "end_time"]
        }
    },
    {
        name: "update_event",
        description: "Update an existing calendar event. Default timezone is CST (America/Chicago).",
        inputSchema: {
            type: "object",
            properties: {
                calendarId: {
                    type: "string",
                    description: "Calendar ID (use 'primary' for main calendar)"
                },
                eventId: {
                    type: "string",
                    description: "Event ID to update"
                },
                summary: {
                    type: "string",
                    description: "Event title"
                },
                start_time: {
                    type: "string",
                    description: "Start time (ISO format)"
                },
                end_time: {
                    type: "string",
                    description: "End time (ISO format)"
                },
                description: {
                    type: "string",
                    description: "Event description"
                },
                attendees: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of attendee emails"
                },
                location: {
                    type: "string",
                    description: "Event location"
                },
                timezone: {
                    type: "string",
                    description: "Timezone for the event (default: America/Chicago for CST)",
                    default: "America/Chicago"
                }
            },
            required: ["calendarId", "eventId"]
        }
    },
    {
        name: "delete_event",
        description: "Delete a calendar event",
        inputSchema: {
            type: "object",
            properties: {
                calendarId: {
                    type: "string",
                    description: "Calendar ID (use 'primary' for main calendar)"
                },
                eventId: {
                    type: "string",
                    description: "Event ID to delete"
                },
                sendUpdates: {
                    type: "string",
                    description: "Send updates to attendees (all, externalOnly, none)",
                    enum: ["all", "externalOnly", "none"],
                    default: "all"
                }
            },
            required: ["calendarId", "eventId"]
        }
    },
    {
        name: "list_colors",
        description: "List available colors for events and calendars",
        inputSchema: {
            type: "object",
            properties: {},
            required: []
        }
    }
];

// Server implementation
const server = new Server({
    name: "mcp_google_calendar",
    version: "2.0.0",
}, {
    capabilities: {
        tools: {},
    },
});

debugLog('Server initialized with', CALENDAR_TOOLS.length, 'tools');

// Check for required environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error("Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required");
    process.exit(1);
}

// Create authenticated Google Calendar service
async function getCalendarService() {
    const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        'http://localhost:3001/oauth/callback'
    );
    
    // Load refresh token from environment variable
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    if (!refreshToken) {
        throw new Error('GOOGLE_REFRESH_TOKEN environment variable is required. Run the auth.js script first to obtain your refresh token.');
    }
    
    oauth2Client.setCredentials({
        refresh_token: refreshToken,
        token_uri: "https://oauth2.googleapis.com/token"
    });

    return google.calendar({ 
        version: 'v3',
        auth: oauth2Client
    });
}

// Calendar operations
async function listCalendars() {
    debugLog('Listing calendars');
    const calendar = await getCalendarService();
    const response = await calendar.calendarList.list();
    return response.data.items || [];
}

async function getCalendar(calendarId) {
    debugLog('Getting calendar:', calendarId);
    const calendar = await getCalendarService();
    const response = await calendar.calendars.get({ calendarId });
    return response.data;
}

async function listEvents(args) {
    debugLog('Listing events for calendar:', args.calendarId);
    const calendar = await getCalendarService();
    const params = {
        calendarId: args.calendarId,
        maxResults: args.maxResults || 10,
        singleEvents: true,
        orderBy: 'startTime'
    };
    
    if (args.timeMin) params.timeMin = args.timeMin;
    if (args.timeMax) params.timeMax = args.timeMax;
    
    const response = await calendar.events.list(params);
    return response.data.items || [];
}

async function getEvent(calendarId, eventId) {
    debugLog('Getting event:', eventId, 'from calendar:', calendarId);
    const calendar = await getCalendarService();
    const response = await calendar.events.get({ calendarId, eventId });
    return response.data;
}

async function createCalendarEvent(args) {
    debugLog('Creating calendar event with args:', JSON.stringify(args, null, 2));
    
    const calendar = await getCalendarService();
    const calendarId = args.calendarId || 'primary';
    const timezone = args.timezone || DEFAULT_TIMEZONE;
    
    const event = {
        summary: args.summary,
        description: args.description,
        start: {
            dateTime: args.start_time,
            timeZone: timezone,
        },
        end: {
            dateTime: args.end_time,
            timeZone: timezone,
        }
    };

    if (args.location) event.location = args.location;
    if (args.attendees) {
        event.attendees = args.attendees.map(email => ({ email }));
    }

    debugLog('Creating event with timezone:', timezone);
    const response = await calendar.events.insert({
        calendarId,
        requestBody: event,
    });
    
    return response.data;
}

async function updateEvent(args) {
    debugLog('Updating event:', args.eventId);
    const calendar = await getCalendarService();
    const timezone = args.timezone || DEFAULT_TIMEZONE;
    
    const updateData = {};
    if (args.summary) updateData.summary = args.summary;
    if (args.description) updateData.description = args.description;
    if (args.location) updateData.location = args.location;
    if (args.start_time) {
        updateData.start = {
            dateTime: args.start_time,
            timeZone: timezone
        };
    }
    if (args.end_time) {
        updateData.end = {
            dateTime: args.end_time,
            timeZone: timezone
        };
    }
    if (args.attendees) {
        updateData.attendees = args.attendees.map(email => ({ email }));
    }

    debugLog('Updating event with timezone:', timezone);
    const response = await calendar.events.update({
        calendarId: args.calendarId,
        eventId: args.eventId,
        requestBody: updateData
    });
    
    return response.data;
}

async function deleteEvent(calendarId, eventId, sendUpdates = 'all') {
    debugLog('Deleting event:', eventId, 'from calendar:', calendarId);
    const calendar = await getCalendarService();
    
    await calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates
    });
    
    return { success: true, message: `Event ${eventId} deleted successfully` };
}

async function listColors() {
    debugLog('Listing colors');
    const calendar = await getCalendarService();
    const response = await calendar.colors.get();
    return response.data;
}

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
    debugLog('List tools request received - returning', CALENDAR_TOOLS.length, 'tools');
    return { tools: CALENDAR_TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    debugLog('Call tool request received:', JSON.stringify(request, null, 2));
    
    try {
        const { name, arguments: args } = request.params;
        if (!args && name !== 'list_calendars' && name !== 'list_colors') {
            throw new Error("No arguments provided");
        }

        let result;
        switch (name) {
            case "list_calendars":
                result = await listCalendars();
                break;
            case "get_calendar":
                result = await getCalendar(args.calendarId);
                break;
            case "list_events":
                result = await listEvents(args);
                break;
            case "get_event":
                result = await getEvent(args.calendarId, args.eventId);
                break;
            case "create_event":
                result = await createCalendarEvent(args);
                break;
            case "update_event":
                result = await updateEvent(args);
                break;
            case "delete_event":
                result = await deleteEvent(args.calendarId, args.eventId, args.sendUpdates);
                break;
            case "list_colors":
                result = await listColors();
                break;
            default:
                debugLog('Unknown tool requested:', name);
                return {
                    content: [{ type: "text", text: `Unknown tool: ${name}` }],
                    isError: true,
                };
        }

        debugLog('Tool execution successful for:', name);
        return {
            content: [{ 
                type: "text", 
                text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
            }],
            isError: false,
        };
    } catch (error) {
        debugLog('Error in call tool handler:', error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
});

// Server startup function
async function runServer() {
    debugLog('Starting server with', CALENDAR_TOOLS.length, 'tools');
    const transport = new StdioServerTransport();
    await server.connect(transport);
    debugLog('Server connected to transport');
    console.error(`Google Calendar MCP Server running on stdio with ${CALENDAR_TOOLS.length} tools`);
}

// Start the server
runServer().catch((error) => {
    debugLog('Fatal server error:', error);
    console.error("Fatal error running server:", error);
    process.exit(1);
});