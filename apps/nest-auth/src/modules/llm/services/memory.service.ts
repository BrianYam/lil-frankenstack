import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AIMessage } from '../types/ai.types';

export interface MessageWithMetadata extends AIMessage {
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
  private sessions: Map<string, ChatSession> = new Map();

  private addMetadata(
    message: AIMessage,
    sessionId: string,
  ): MessageWithMetadata {
    return {
      ...message,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      sessionId,
    };
  }

  private removeMetadata(message: MessageWithMetadata): AIMessage {
    const { id, createdAt, sessionId, ...rest } = message;
    return rest;
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

  addMessages(sessionId: string, messages: AIMessage[]): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const messagesWithMetadata = messages.map((msg) =>
      this.addMetadata(msg, sessionId),
    );
    session.messages.push(...messagesWithMetadata);
    session.updatedAt = new Date().toISOString();
  }

  getMessages(sessionId: string): AIMessage[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    return session.messages.map(this.removeMetadata);
  }

  saveToolResponse(
    sessionId: string,
    toolCallId: string,
    toolResponse: string,
  ): void {
    this.addMessages(sessionId, [
      {
        role: 'tool',
        content: toolResponse,
        tool_call_id: toolCallId,
      },
    ]);
  }

  getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values());
  }
}
