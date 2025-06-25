# Telegram Bot Setup Guide

## Step 1: Creating a Telegram Bot

1. Open the Telegram app or web client (https://web.telegram.org/).
2. Search for **@BotFather** and start a chat.
3. Send the command `/newbot` to create a new bot.
4. Follow BotFather's instructions:
   - Provide a name for your bot (e.g., "My Project Bot")
   - Provide a username ending with "bot" (e.g., "my_project_bot")
5. **Important**: BotFather will provide you with a token like `123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ`.
   - Save this token securely; you'll need it for your application.
   - Add it to your environment variables as `TELEGRAM_BOT_TOKEN`.

## Step 2: Disable Bot Privacy Mode

By default, Telegram bots cannot see group messages unless they're mentioned directly. To allow your bot to read all messages in the group:

1. Open [@BotFather](https://t.me/BotFather) in Telegram.
2. Send the command `/mybots`.
3. Select your bot from the list.
4. Click **Bot Settings** → **Group Privacy**.
5. Set Group Privacy to **Disabled**.

This allows the bot to receive all group messages.

## Step 3: Create a Group and Add Your Bot

1. In Telegram, click the pencil icon (or "New Message" button).
2. Select "New Group" and follow the prompts.
3. Add contacts to your group, and be sure to add your bot by its username (e.g., @my_project_bot).
4. Once the group is created, you can optionally:
   - Make your bot an admin (recommended for full functionality)
   - Change the group photo or description

## Step 4: Get the Telegram Group ID

There are several methods to get your group's chat ID:

### Method 1: Using the Telegram API

Once your bot is in the group:

1. Send **any message** in the group (e.g., `hello`).
2. Use this `curl` command to fetch recent updates:
   ```bash
   curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
   Replace `<YOUR_BOT_TOKEN>` with your actual bot token.
   
3. Look for the chat ID in the response:
   ```json
   {
     "chat": {
       "id": -1001234567890,
       "title": "Your Group Name",
       "type": "supergroup"
     }
   }
   ```
   The negative number (e.g., `-1001234567890`) is your group chat ID.

### Method 2: Using the Bot Command

If you've implemented the `/chatid` command in your bot (as included in the TelegramService):

1. Simply send `/chatid` in your group.
2. The bot will reply with the chat ID and type.

### Method 3: Using the Test Script

You can use the provided test script to log all incoming updates:

1. Start your application.
2. Send any message in your Telegram group.
3. Check your application logs for messages like:
   ```
   Received update from chat ID: -1001234567890, Type: supergroup
   ```

## Step 5: Configure Your Application

1. Add these environment variables to your `.env` file:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_GROUP_CHAT_ID=-1001234567890
   ```
   Replace with your actual values.

2. Test sending a message using the provided test script:
   ```bash
   cd /path/to/your/project
   pnpm ts-node src/scripts/test-telegram.ts
   ```

## Common Issues and Solutions

- **Bot not receiving messages**: Ensure Privacy Mode is disabled.
- **Permission errors**: Make sure your bot is an admin if you need admin privileges.
- **Rate limiting**: Telegram has API rate limits; implement retries for mission-critical messages.
- **Formatting errors**: When using Markdown, special characters must be escaped. Use the sendFormattedMessage method.

## Advanced Usage

- Use [Telegram Bot API documentation](https://core.telegram.org/bots/api) for advanced features.
- Consider implementing [webhooks](https://core.telegram.org/bots/api#setwebhook) instead of long polling for production.
