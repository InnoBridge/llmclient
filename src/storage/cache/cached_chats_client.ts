import { SQLiteRunResult } from "@/models/sqllite";
import { Chat } from "@/models/storage/dto";

interface CachedChatsClient {
    execAsync(query: string): Promise<void>;
    runAsync(query: string, params?: any[]): Promise<SQLiteRunResult>;
    getAllAsync<T>(query: string, params?: any[]): Promise<T[]>;
    beginTransaction(): Promise<void>;
    commitTransaction(): Promise<void>;
    rollbackTransaction(): Promise<void>;
    initializeCache(): Promise<void>;
    registerMigration(version: number, migration: () => Promise<void>): void;
    addChat(
        chatId: string,
        userId: string, 
        title: string, 
        updateTimestamp?: number, 
        deletedTimestamp?: number): Promise<SQLiteRunResult>;
    getChats<T>(
        chats: Chat[]
    ): Promise<T[]>;
    getMessages<T>(chatId: string): Promise<T[]>;
    addMessage(
        chatId: string, 
        content: string,
        role: string, 
        imageUrl?: string, 
        prompt?: string
    ): Promise<SQLiteRunResult>;
    deleteChat(chatId: string): Promise<SQLiteRunResult>;
    renameChat(chatId: string, title: string): Promise<SQLiteRunResult>;
    clearChat(): Promise<void>;
    updateTableTimestamp(tableName: string, id: string): Promise<SQLiteRunResult>;
};

export type {
    CachedChatsClient,
};

