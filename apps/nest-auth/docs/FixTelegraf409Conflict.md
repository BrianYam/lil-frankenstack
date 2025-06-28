# Fix Telegraf 409 Conflict Error

**Problem:**  
When using polling in production, multiple bot instances can cause a 409 Conflict error.  
**Solution:**  
Use webhooks in production to avoid multiple bot instance conflicts.

---

## Error Example

```
TelegramError: 409: Conflict: terminated by other getUpdates request; make sure that only one bot instance is running
TelegramError: 409: Conflict: can't use getUpdates method while webhook is active; use deleteWebhook to delete the webhook first
    at Telegram.callApi (/opt/render/project/src/node_modules/.pnpm/telegraf@4.16.3/node_modules/telegraf/lib/core/network/client.js:315:19)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async [Symbol.asyncIterator] (/opt/render/project/src/node_modules/.pnpm/telegraf@4.16.3/node_modules/telegraf/lib/core/network/polling.js:30:33)
    at async Polling.loop (/opt/render/project/src/node_modules/.pnpm/telegraf@4.16.3/node_modules/telegraf/lib/core/network/polling.js:73:30)
    at async Telegraf.launch (/opt/render/project/src/node_modules/.pnpm/telegraf@4.16.3/node_modules/telegraf/lib/telegraf.js:194:13) {
  response: {
    ok: false,
    error_code: 409,
    description: "Conflict: can't use getUpdates method while webhook is active; use deleteWebhook to delete the webhook first"
  },
  on: {
    method: 'getUpdates',
    payload: { timeout: 50, offset: 0, allowed_updates: [] }
  }
}
```

---

## Problem Analysis

- The **409 Conflict** error occurs because polling mode (`getUpdates`) is used in production
- When multiple instances of your app run (common on platforms like Render), they compete for the same polling connection
- Telegram only allows **one active polling connection per bot**

---

## Solution Architecture

### 1. Environment Detection
The module automatically switches between webhook and polling based on:
- **Environment type** (production-like vs development)
- **Webhook URL availability** 
- **Force polling override** (for debugging)

### 2. Configuration Factory Pattern
Extracted Telegraf configuration logic into `telegram.config.factory.ts`:
- **Separation of concerns** - Module focuses on dependency injection
- **Type safety** - Uses typed configuration objects instead of string-based lookups
- **Testability** - Pure function that's easy to unit test

---

## Environment-based Behavior

| Environment | Webhook URL | Polling Force | Result |
|-------------|-------------|---------------|---------|
| `development` | Not set | `false` | **Polling Mode** |
| `development` | Set | `false` | **Polling Mode** |
| `staging` | Not set | `false` | **Polling Mode** |
| `staging` | Set | `false` | **Webhook Mode** ✅ |
| `staging` | Set | `true` | **Polling Mode** |
| `production` | Not set | `false` | **Polling Mode** |
| `production` | Set | `false` | **Webhook Mode** ✅ |
| `production` | Set | `true` | **Polling Mode** |

---

## Environment Variables

```env
# Required
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_GROUP_CHAT_ID=your_group_chat_id
NODE_ENV=production

# Production webhook mode
TELEGRAM_WEBHOOK_URL=https://your-app.onrender.com

# Development override (optional)
TELEGRAM_FORCE_POLLING=false
```

---

## Bot Token Recommendations

### Option 1: Separate Bots (Recommended)
- **Development Bot**: For local development and testing
- **Production Bot**: For production deployments
- Eliminates all potential conflicts between environments

### Option 2: Single Bot Token
- Production automatically uses webhook mode
- Development uses polling mode
- Manual webhook management may be needed for switching
