import { CachedChatsClient } from "@/storage/cache/cached_chats_client";
import { SqlLiteCachedChatsClient } from "@/storage/cache/sqllite_cached_chats_client";
import { SqlLiteClient } from "@/storage/cache/database_client";
import { SQLiteRunResult } from "@/models/sqllite";
import { Chat, Message } from "@/models/storage/dto";
import { PaginatedResult } from "@/models/pagination";

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
};

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

const getChats = async <T>(excludeDeleted?: boolean): Promise<T[]> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    return await cacheClient?.getChats<T>(excludeDeleted) as T[];
};

const getChatsByUserId = async (
    userId: string, 
    updatedAfter?: number, 
    limit: number = 20, 
    page: number = 0, 
    excludeDeleted?: boolean): Promise<PaginatedResult<Chat>> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    if (page < 0) {
        throw new Error("Page number cannot be negative.");
    }
    if (limit <= 0) {
        throw new Error("Limit must be greater than zero.");
    }
    const chats = await cacheClient?.getChatsByUserId(userId, updatedAfter, limit, page, excludeDeleted) as Chat[];
    const total = await cacheClient?.countChatsByUserId(userId, updatedAfter);
    const totalPages = Math.ceil((total || 0) / limit); 
    const currentPage = page;
    return {
        data: chats,
        pagination: {
            totalCount: total,
            totalPages: totalPages,
            currentPage: page,
            hasNext: currentPage < totalPages - 1
        }
    } as PaginatedResult<Chat>;
};

const getChatsByChatIds = async (chatIds: string[]): Promise<Chat[]> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    return await cacheClient?.getChatsByChatIds(chatIds) as Chat[];
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

const getMessages = async (chatId: string): Promise<Message[]> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    return await cacheClient!.getMessages(chatId);
};

const addMessage = async (
    messageId: string,
    chatId: string, 
    content: string, 
    role: string,
    imageUrl?: string,  
    prompt?: string,
    isSynced?: boolean
): Promise<SQLiteRunResult> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    try {
        await cacheClient?.beginTransaction();
        const result = await cacheClient?.addMessage(messageId, chatId, content, role, imageUrl, prompt, isSynced) as SQLiteRunResult;
        await cacheClient?.updateTableTimestamp("chats", chatId);
        await cacheClient?.commitTransaction();
        return result;
    } catch (error: any) {
        await cacheClient?.rollbackTransaction();
        console.error("Error adding message:", error.message);
        throw error;
    }
};

const getAndMarkUnsyncedMessagesByUserId = async (
    chatId: string, 
    limit?: number): Promise<Message[]> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    return await cacheClient?.getAndMarkUnsyncedMessagesByUserId(chatId, limit) as Message[];
};

const deleteChat = async (chatId: string): Promise<SQLiteRunResult> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    return await cacheClient?.deleteChat(chatId) as SQLiteRunResult;
};

const markChatAsDeleted = async (chatId: string): Promise<SQLiteRunResult> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    return await cacheClient?.markChatAsDeleted(chatId) as SQLiteRunResult;
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

const clearMessage = async (): Promise<void> => {
    if (!isCacheClientSet()) {
        throw new Error("Chat cache not initialized. Call initializeChatsCache first.");
    }
    return await cacheClient?.clearMessage();
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
    getChatsByUserId,
    getChatsByChatIds,
    addChat,
    upsertChats,
    getMessages,
    addMessage,
    getAndMarkUnsyncedMessagesByUserId,
    upsertMessages,
    deleteChat,
    markChatAsDeleted,
    renameChat,
    clearChat,
    clearMessage
};
