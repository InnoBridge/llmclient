import { CachedChatsClient } from "@/storage/cache/cached_chats_client";
import { SqlLiteCachedChatsClient } from "@/storage/cache/sqllite_cached_chats_client";
import { SqlLiteClient } from "@/storage/cache/database_client";
import { SQLiteRunResult } from "@/models/sqllite";
import { Chat, Message } from "@/models/storage/dto";

let cacheClient: CachedChatsClient | null = null;

const initializeChatsCache = async (
    db: SqlLiteClient,
    registerMigrations?: Map<number, () => Promise<void>>
): Promise<void> => {
    cacheClient = new SqlLiteCachedChatsClient(db);
    if (registerMigrations) {
        registerMigrations.forEach((migration, version) => {
            cacheClient?.registerMigration(version, migration);
        });
    }
    await cacheClient.initializeCache();
};

const isCacheClientSet = (): boolean => {
    return cacheClient !== null;
};

const execAsync = async (query: string): Promise<void> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    return await cacheClient?.execAsync(query);
};

const runAsync = async (query: string, params?: any[]): Promise<SQLiteRunResult> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    return await cacheClient?.runAsync(query, params) as SQLiteRunResult;
};

const getAllAsync = async <T>(query: string, params?: any[]): Promise<T[]> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    return await cacheClient?.getAllAsync<T>(query, params) as T[];
}

const beginTransaction = async (): Promise<void> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    return await cacheClient?.beginTransaction();
};

const commitTransaction = async (): Promise<void> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    return await cacheClient?.commitTransaction();
};

const rollbackTransaction = async (): Promise<void> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    return await cacheClient?.rollbackTransaction();
};

const getChats = async <T>(): Promise<T[]> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    return await cacheClient?.getChats<T>() as T[];
};

const addChat = async (
    chatId: string,
    userId: string, 
    title: string, 
    updateTimestamp?: number, 
    deletedTimestamp?: number): Promise<SQLiteRunResult> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    return await cacheClient?.addChat(chatId, userId, title, updateTimestamp, deletedTimestamp) as SQLiteRunResult;
};

const upsertMessages = async (messages: Message[], isSynced?: boolean): Promise<void> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    return await cacheClient?.upsertMessages(messages, isSynced);
};

const upsertChats = async (chats: Chat[]): Promise<void> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    return await cacheClient?.upsertChats(chats);
};

const getMessages = async <T>(chatId: string): Promise<T[]> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    return await cacheClient?.getMessages<T>(chatId) as T[];
};

const addMessage = async (
    chatId: string, 
    content: string, 
    role: string,
    imageUrl?: string,  
    prompt?: string
): Promise<SQLiteRunResult> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    try {
        await cacheClient?.beginTransaction();
        const result = await cacheClient?.addMessage(chatId, content, role, imageUrl, prompt) as SQLiteRunResult;
        await cacheClient?.updateTableTimestamp("chats", chatId);
        await cacheClient?.commitTransaction();
        return result;
    } catch (error: any) {
        await cacheClient?.rollbackTransaction();
        console.error("Error adding message:", error.message);
        throw error;
    }
};

const deleteChat = async (chatId: string): Promise<SQLiteRunResult> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    return await cacheClient?.deleteChat(chatId) as SQLiteRunResult;
};

const renameChat = async (chatId: string, title: string): Promise<SQLiteRunResult> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    try {
        await cacheClient?.beginTransaction();   
        const result = await cacheClient?.renameChat(chatId, title) as SQLiteRunResult;
        await cacheClient?.updateTableTimestamp("chats", chatId);
        await cacheClient?.commitTransaction();
        return result;
    } catch (error: any) {
        await cacheClient?.rollbackTransaction();
        console.error("Error renaming chat:", error.message);
        throw error;
    }   
};

const clearChat = async (): Promise<void> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    return await cacheClient?.clearChat();
};

export {
    initializeChatsCache,
    execAsync,
    runAsync,
    getAllAsync,
    beginTransaction,
    commitTransaction,
    rollbackTransaction,
    getChats,
    addChat,
    upsertChats,
    getMessages,
    addMessage,
    upsertMessages,
    deleteChat,
    renameChat,
    clearChat,
};
