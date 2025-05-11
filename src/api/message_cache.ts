import { MessageCacheClient } from "@/storage/cache/message_cache_client";
import { SqlLiteMessageCacheClient } from "@/storage/cache/sqllite_message_cache_client";
import { SqlLiteClient } from "@/storage/cache/database_client";
import { SQLiteRunResult } from "@/models/sqllite";

let cacheClient: MessageCacheClient | null = null;

const initializeMessageCache = async (db: SqlLiteClient): Promise<void> => {
    cacheClient = new SqlLiteMessageCacheClient(db);
    await cacheClient.initializeCache();
};

const isCacheClientSet = (): boolean => {
    return cacheClient !== null;
}

const execAsync = async (query: string): Promise<void> => {
    if (!isCacheClientSet()) {
        throw new Error("Message cache not initialized. Call initializeMessageCache first.");
    }
    return await cacheClient?.execAsync(query);
};

const runAsync = async (query: string, params?: any[]): Promise<SQLiteRunResult> => {
    if (!isCacheClientSet()) {
        throw new Error("Message cache not initialized. Call initializeMessageCache first.");
    }
    return await cacheClient?.runAsync(query, params) as SQLiteRunResult;
};

const getAllAsync = async <T>(query: string, params?: any[]): Promise<T[]> => {
    if (!isCacheClientSet()) {
        throw new Error("Message cache not initialized. Call initializeMessageCache first.");
    }
    return await cacheClient?.getAllAsync<T>(query, params) as T[];
}

const beginTransaction = async (): Promise<void> => {
    if (!isCacheClientSet()) {
        throw new Error("Message cache not initialized. Call initializeMessageCache first.");
    }
    return await cacheClient?.beginTransaction();
};

const commitTransaction = async (): Promise<void> => {
    if (!isCacheClientSet()) {
        throw new Error("Message cache not initialized. Call initializeMessageCache first.");
    }
    return await cacheClient?.commitTransaction();
};

const rollbackTransaction = async (): Promise<void> => {
    if (!isCacheClientSet()) {
        throw new Error("Message cache not initialized. Call initializeMessageCache first.");
    }
    return await cacheClient?.rollbackTransaction();
};

const getChats = async <T>(): Promise<T[]> => {
    if (!isCacheClientSet()) {
        throw new Error("Message cache not initialized. Call initializeMessageCache first.");
    }
    return await cacheClient?.getChats<T>() as T[];
};

const addChat = async (title: string, userId?: string): Promise<SQLiteRunResult> => {
    if (!isCacheClientSet()) {
        throw new Error("Message cache not initialized. Call initializeMessageCache first.");
    }
    return await cacheClient?.addChat(title, userId) as SQLiteRunResult;
};

const getMessages = async <T>(chatId: number): Promise<T[]> => {
    if (!isCacheClientSet()) {
        throw new Error("Message cache not initialized. Call initializeMessageCache first.");
    }
    return await cacheClient?.getMessages<T>(chatId) as T[];
};

const addMessage = async (
    chatId: number, 
    content: string, 
    role: string,
    imageUrl?: string,  
    prompt?: string
): Promise<SQLiteRunResult> => {
    if (!isCacheClientSet()) {
        throw new Error("Message cache not initialized. Call initializeMessageCache first.");
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

const deleteChat = async (chatId: number): Promise<SQLiteRunResult> => {
    if (!isCacheClientSet()) {
        throw new Error("Message cache not initialized. Call initializeMessageCache first.");
    }
    return await cacheClient?.deleteChat(chatId) as SQLiteRunResult;
};

const renameChat = async (chatId: number, title: string): Promise<SQLiteRunResult> => {
    if (!isCacheClientSet()) {
        throw new Error("Message cache not initialized. Call initializeMessageCache first.");
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
        throw new Error("Message cache not initialized. Call initializeMessageCache first.");
    }
    return await cacheClient?.clearChat();
};

export {
    initializeMessageCache,
    execAsync,
    runAsync,
    getAllAsync,
    beginTransaction,
    commitTransaction,
    rollbackTransaction,
    getChats,
    addChat,
    getMessages,
    addMessage,
    deleteChat,
    renameChat,
    clearChat,
};
