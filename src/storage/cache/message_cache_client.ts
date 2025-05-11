import { SQLiteRunResult } from "@/models/sqllite";

interface MessageCacheClient {
    execAsync(query: string): Promise<void>;
    runAsync(query: string, params?: any[]): Promise<SQLiteRunResult>;
    getAllAsync<T>(query: string, params?: any[]): Promise<T[]>;
    beginTransaction(): Promise<void>;
    commitTransaction(): Promise<void>;
    rollbackTransaction(): Promise<void>;
    initializeCache(): Promise<void>;
    addChat(title: string, userId?: string): Promise<SQLiteRunResult>;
    getChats<T>(): Promise<T[]>;
    getMessages<T>(chatId: number): Promise<T[]>;
    addMessage(
        chatId: number, 
        content: string,
        role: string, 
        imageUrl?: string, 
        prompt?: string
    ): Promise<SQLiteRunResult>;
    deleteChat(chatId: number): Promise<SQLiteRunResult>;
    renameChat(chatId: number, title: string): Promise<SQLiteRunResult>;
    clearChat(): Promise<void>;
    updateTableTimestamp(tableName: string, table: number): Promise<SQLiteRunResult>;
};

export type {
    MessageCacheClient,
};

