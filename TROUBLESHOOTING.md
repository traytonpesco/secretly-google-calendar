# Troubleshooting Guide

## Environment Variable Issues

### Problem: "GOOGLE_REFRESH_TOKEN environment variable is required"

**Root Cause**: MCP server can't find environment variables.

**Solutions** (in order of preference):

1. **Use MCP Configuration (Recommended)**:
   ```json
   // In ~/.cursor/mcp.json
   {
     "mcpServers": {
       "google-calendar": {
         "command": "/usr/local/bin/node",
         "args": ["/path/to/index.js"],
         "env": {
           "GOOGLE_CLIENT_ID": "your-client-id",
           "GOOGLE_CLIENT_SECRET": "your-client-secret", 
           "GOOGLE_REFRESH_TOKEN": "your-refresh-token"
         }
       }
     }
   }
   ```

2. **Use .env File with CWD**:
   ```json
   // In ~/.cursor/mcp.json
   {
     "mcpServers": {
       "google-calendar": {
         "command": "/usr/local/bin/node",
         "args": ["index.js"],
         "cwd": "/path/to/mcp-directory"
       }
     }
   }
   ```

### Problem: Multiple .env Files

**Prevention**:
- Keep ONE authoritative source for credentials
- Use absolute paths in configurations
- Document where credentials are stored

## OAuth Token Management

### Problem: Authorization codes expiring

**Solutions**:
1. **Reuse existing tokens** when possible
2. **Complete OAuth flow quickly** (< 10 minutes)
3. **Store refresh tokens securely** for reuse

### Problem: Invalid/expired refresh tokens

**Solutions**:
1. **Test token validity**:
   ```bash
   node -e "
   const { google } = require('googleapis');
   require('dotenv').config();
   
   const oauth2Client = new google.auth.OAuth2(
     process.env.GOOGLE_CLIENT_ID,
     process.env.GOOGLE_CLIENT_SECRET,
     'http://localhost:8080'
   );
   
   oauth2Client.setCredentials({
     refresh_token: process.env.GOOGLE_REFRESH_TOKEN
   });
   
   const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
   calendar.calendarList.list()
     .then(() => console.log('✅ Token is valid'))
     .catch(error => console.log('❌ Token invalid:', error.message));
   "
   ```

2. **Regenerate tokens** if invalid:
   ```bash
   npm run auth
   ```

## Timezone Issues

### Problem: Wrong timezone in events

**Prevention**:
- Always specify timezone explicitly
- Use timezone parameter in create/update calls
- Verify timezone in API responses

**Example**:
```javascript
// Good - explicit timezone
{
  "start_time": "2025-06-27T18:30:00",
  "timezone": "America/Chicago"
}

// Bad - relies on default
{
  "start_time": "2025-06-27T18:30:00"
}
```

## Configuration Validation

### Quick Health Check Script
```bash
node -e "
require('dotenv').config();
console.log('Environment Check:');
console.log('CLIENT_ID:', !!process.env.GOOGLE_CLIENT_ID ? '✅' : '❌');
console.log('CLIENT_SECRET:', !!process.env.GOOGLE_CLIENT_SECRET ? '✅' : '❌');
console.log('REFRESH_TOKEN:', !!process.env.GOOGLE_REFRESH_TOKEN ? '✅' : '❌');
console.log('Default timezone:', process.env.DEFAULT_TIMEZONE || 'America/Chicago');
"
```

## MCP Restart Checklist

After making configuration changes:
1. ✅ Verify .env file or MCP config updated
2. ✅ Restart Cursor completely  
3. ✅ Test connection with simple tool call
4. ✅ Verify timezone in created events

## Common Gotchas

1. **Case sensitivity**: Environment variable names are case-sensitive
2. **Quotes in .env**: Don't use quotes around values in .env files
3. **Trailing spaces**: Trim whitespace from environment values
4. **File permissions**: Ensure .env files are readable
5. **Git security**: Never commit .env files to version control 