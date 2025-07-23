import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ChatRole, ChatMessage } from '@/types';

interface MessageWithMetadata extends ChatMessage {
  id: string;
  createdAt: string;
  sessionId: string;
}

interface ChatSession {
  sessionId: string;
  messages: MessageWithMetadata[];
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class MemoryService {
  private readonly sessions: Map<string, ChatSession> = new Map();

  private addMetadata(
    message: ChatMessage,
    sessionId: string,
  ): MessageWithMetadata {
    return {
      ...message,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      sessionId,
    };
  }

  private removeMetadata(message: MessageWithMetadata): ChatMessage {
    // TypeScript's Omit utility type removes specified properties
    return message as Omit<
      MessageWithMetadata,
      'id' | 'createdAt' | 'sessionId'
    >;
  }

  private getSession(sessionId: string): ChatSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    return session;
  }

  createSession(): string {
    const sessionId = uuidv4();
    this.sessions.set(sessionId, {
      sessionId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return sessionId;
  }

  addMessages(sessionId: string, messages: ChatMessage[]): void {
    const session = this.getSession(sessionId);
    const messagesWithMetadata = messages.map((msg) =>
      this.addMetadata(msg, sessionId),
    );
    session.messages.push(...messagesWithMetadata);
    session.updatedAt = new Date().toISOString();
  }

  getMessages(sessionId: string): ChatMessage[] {
    const session = this.getSession(sessionId);
    // same as return session.messages.map((message) => this.removeMetadata(message));
    return session.messages.map(this.removeMetadata);
  }

  saveToolResponse(
    sessionId: string,
    toolCallId: string,
    toolResponse: string,
  ): void {
    this.addMessages(sessionId, [
      {
        role: ChatRole.TOOL,
        content: toolResponse,
        tool_call_id: toolCallId,
      },
    ]);
  }

  getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values());
  }
}
