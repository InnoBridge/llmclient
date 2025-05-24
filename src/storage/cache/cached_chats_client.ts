import { SQLiteRunResult } from "@/models/sqllite";
import { Chat, Message } from "@/models/storage/dto";

interface CachedChatsClient {
    execAsync(query: string): Promise<void>;
    runAsync(query: string, params?: any[]): Promise<SQLiteRunResult>;
    getAllAsync<T>(query: string, params?: any[]): Promise<T[]>;
    beginTransaction(): Promise<void>;
    commitTransaction(): Promise<void>;
    rollbackTransaction(): Promise<void>;
    initializeCache(): Promise<void>;
    registerMigration(version: number, migration: () => Promise<void>): void;
    getChats<T>(excludeDeleted?: boolean): Promise<T[]>;
    countChatsByUserId(userId: string, updatedAfter?: number): Promise<number>;
    getChatsByUserId(
        userId: string, 
        updatedAfter?: number, 
        limit?: number, 
        page?: number, 
        excludeDeleted?: boolean): Promise<Chat[]>;
    getChatsByChatIds(chatIds: string[]): Promise<Chat[]>;
    addChat(
        chatId: string,
        userId: string, 
        title: string, 
        updateTimestamp?: number, 
        deletedTimestamp?: number): Promise<SQLiteRunResult>;
    upsertChats(chats: Chat[]): Promise<void>;
    getMessages(chatId: string): Promise<Message[]>;
    addMessage(
        messageId: string,
        chatId: string, 
        content: string,
        role: string, 
        imageUrl?: string, 
        prompt?: string,
        isSynced?: boolean
    ): Promise<SQLiteRunResult>;
    getAndMarkUnsyncedMessagesByUserId(
        chatId: string, 
        limit?: number, 
        page?: number): Promise<Message[]>;
    upsertMessages(messages: Message[], isSynced?: boolean): Promise<void>;
    deleteChat(chatId: string): Promise<SQLiteRunResult>;
    markChatAsDeleted(chatId: string): Promise<SQLiteRunResult>;
    renameChat(chatId: string, title: string): Promise<SQLiteRunResult>;
    clearChat(): Promise<void>;
    clearMessage(): Promise<void>;
    updateTableTimestamp(tableName: string, id: string): Promise<SQLiteRunResult>;
};

export type {
    CachedChatsClient,
};

