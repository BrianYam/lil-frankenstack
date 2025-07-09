import { Body, Controller, Post, Get, Param, Delete } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { TelegramMessageDto, TelegramBroadcastDto } from './dto/telegram.dto';
import { TelegramService } from './telegram.service';

@ApiTags('Telegram')
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  //send dummy error
  @Post('dummy-error')
  @ApiOperation({ summary: 'Send a dummy error message' })
  @ApiResponse({
    status: 200,
    description: 'Dummy error message sent successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async sendDummyError() {
    return this.telegramService.sendDummyError();
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a message to a specific chat' })
  @ApiBody({ type: TelegramMessageDto })
  @ApiResponse({ status: 200, description: 'Message successfully sent' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async sendMessage(@Body() dto: TelegramMessageDto) {
    return this.telegramService.sendMessage(dto.chatId, dto.message);
  }

  @Post('send-formatted')
  @ApiOperation({ summary: 'Send a markdown formatted message' })
  @ApiBody({ type: TelegramMessageDto })
  @ApiResponse({
    status: 200,
    description: 'Formatted message successfully sent',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (check markdown syntax)',
  })
  async sendFormattedMessage(@Body() dto: TelegramMessageDto) {
    return this.telegramService.sendFormattedMessage(dto.chatId, dto.message);
  }

  @Post('broadcast')
  @ApiOperation({ summary: 'Broadcast a message to multiple chats' })
  @ApiBody({ type: TelegramBroadcastDto })
  @ApiResponse({
    status: 200,
    description: 'Messages successfully broadcast to all chats',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async broadcastMessage(@Body() dto: TelegramBroadcastDto) {
    return this.telegramService.broadcastMessage(dto.chatIds, dto.message);
  }

  @Get('chat-id/:chatName')
  @ApiOperation({
    summary: 'Helper endpoint to find chat ID (development only)',
  })
  @ApiParam({
    name: 'chatName',
    description: 'Partial name of the chat to find',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns message with instructions',
  })
  async getChatIdHelper(@Param('chatName') chatName: string) {
    // This is a helper endpoint that doesn't actually find the chat ID,
    // but returns instructions on how to find it
    return {
      message: `To find chat IDs matching "${chatName}", follow these steps:`,
      steps: [
        '1. Send a message in the target chat',
        '2. Check your application logs for "Received update from chat ID:" messages',
        '3. Use the /chatid command in any chat with your bot',
        `4. Or use the Telegram API: curl https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates`,
      ],
    };
  }

  @Get('webhook/info')
  @ApiOperation({ summary: 'Get current webhook information' })
  @ApiResponse({ status: 200, description: 'Webhook information retrieved' })
  async getWebhookInfo() {
    return this.telegramService.getWebhookInfo();
  }

  @Delete('webhook')
  @ApiOperation({ summary: 'Remove webhook (switch to polling)' })
  @ApiResponse({ status: 200, description: 'Webhook removed successfully' })
  async removeWebhook() {
    await this.telegramService.removeWebhook();
    return { message: 'Webhook removed successfully' };
  }
}
