# API Reference

GQAI Workspace API Endpoints Documentation

---

## Authentication

All admin endpoints require Bearer token authentication.

```
Authorization: Bearer <admin_token>
```

Token is obtained via POST /api/admin/login with ADMIN_PASSWORD.

---

## Telegram Posts

### GET /api/dashboard/posts

Fetch all telegram posts with replies.

**Response:**
```json
{
  "posts": [
    {
      "id": 1,
      "timestamp": "2024-12-06T10:00:00Z",
      "channel": "Channel Name",
      "category": "News",
      "text": "Message content",
      "mediaType": "photo",
      "mediaLink": "https://...",
      "replies": []
    }
  ]
}
```

### DELETE /api/dashboard/posts

Delete a telegram post. Requires admin auth.

**Query Parameters:**
- `id` (required): Post ID to delete

---

## Pinned Posts

### GET /api/pinned-posts

Fetch all pinned posts.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "post_id": 123,
      "pinned_at": "2024-12-06T10:00:00Z",
      "custom_title": "Important Notice",
      "post": { ... }
    }
  ]
}
```

### POST /api/pinned-posts

Pin a post. Requires admin auth.

**Request Body:**
```json
{
  "postId": 123,
  "customTitle": "Optional title"
}
```

### DELETE /api/pinned-posts

Unpin a post. Requires admin auth.

**Query Parameters:**
- `postId` (required): Post ID to unpin

---

## Press Releases

### GET /api/press-releases

Fetch press releases from database.

**Query Parameters:**
- `source` (optional): "msit" or "kcc"
- `limit` (optional): Max items (default: 50)

**Response:**
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "id": 1,
      "source": "msit",
      "title": "Title",
      "published_at": "2024-12-06T09:00:00Z",
      "url": "https://..."
    }
  ]
}
```

### GET /api/crawl

Trigger press release collection.

**Query Parameters:**
- `limit` (optional): Items per source (default: 20)

**Response:**
```json
{
  "success": true,
  "totals": {
    "fetched": 40,
    "new": 8,
    "updated": 3
  }
}
```

---

## News Search

### GET /api/news

Search Naver News API.

**Query Parameters:**
- `query` (required): Search term
- `display` (optional): Items per page (default: 10)
- `start` (optional): Start index (default: 1)
- `sort` (optional): "date" or "sim" (default: date)

**Response:**
```json
{
  "success": true,
  "total": 1000,
  "items": [
    {
      "title": "News Title",
      "link": "https://...",
      "description": "...",
      "pubDate": "Sat, 07 Dec 2024 10:00:00 +0900"
    }
  ]
}
```

---

## Calendar Events

### GET /api/calendar/events

Fetch Google Calendar events.

**Query Parameters:**
- `type` (optional): "today" or "upcoming" (default: upcoming)
- `days` (optional): Days to fetch (default: 7)

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": "event_id",
      "summary": "Meeting",
      "start": { "dateTime": "2024-12-06T10:00:00+09:00" },
      "end": { "dateTime": "2024-12-06T11:00:00+09:00" }
    }
  ]
}
```

### POST /api/calendar/events

Create calendar event.

**Request Body:**
```json
{
  "summary": "Meeting",
  "description": "Team meeting",
  "start": "2024-12-06T10:00:00+09:00",
  "end": "2024-12-06T11:00:00+09:00",
  "location": "Room A"
}
```

### PATCH /api/calendar/events/[id]

Update calendar event.

### DELETE /api/calendar/events/[id]

Delete calendar event.

---

## Admin

### POST /api/admin/login

Authenticate admin user.

**Request Body:**
```json
{
  "password": "admin_password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token"
}
```

### GET /api/admin/verify

Verify admin token.

**Headers:**
- `Authorization: Bearer <token>`

### POST /api/admin/logout

Invalidate admin session.

---

## Telegram Webhook

### POST /api/telegram/webhook

Receive telegram updates. Called by Telegram servers.

**Security:**
- Validates X-Telegram-Bot-Api-Secret-Token header

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| TELEGRAM_BOT_TOKEN | Yes | Telegram Bot API token |
| TELEGRAM_WEBHOOK_SECRET | Yes | Webhook security token |
| NEXT_PUBLIC_SUPABASE_URL | Yes | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Yes | Supabase anonymous key |
| CLOUDINARY_CLOUD_NAME | Yes | Cloudinary cloud name |
| CLOUDINARY_API_KEY | Yes | Cloudinary API key |
| CLOUDINARY_API_SECRET | Yes | Cloudinary API secret |
| ADMIN_PASSWORD | Yes | Admin login password |
| GOOGLE_SERVICE_ACCOUNT_KEY | No | Google service account JSON |
| GOOGLE_CALENDAR_ID | No | Google Calendar ID |
| GOOGLE_SPREADSHEET_ID | No | Google Sheets ID |
| GOOGLE_DRIVE_FOLDER_ID | No | Google Drive folder ID |
| NAVER_CLIENT_ID | No | Naver API client ID |
| NAVER_CLIENT_SECRET | No | Naver API client secret |

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message"
}
```

**HTTP Status Codes:**
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error

---

Document Version: 1.0
Last Updated: December 2024
