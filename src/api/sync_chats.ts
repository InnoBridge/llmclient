import { ExpoSQLiteAdapter } from "@/storage/cache/database_client";
import  { 
    initializeChatsCache, 
    getChatsByUserId as getCachedChatsByUserId,
    getChatsByChatIds,
    getAndMarkUnsyncedMessagesByUserId,
    upsertChats, 
    upsertMessages,
    clearDeletedChats, 
    clearChat, 
    clearMessage 
} from "@/api/cached_chats";
import { 
    createChatClient, 
    getChatsByUserId, 
    syncChats, 
    getMessagesByUserId, 
    addMessages 
} from "@/api/stored_chats";
import { Chat, Message } from "@/models/storage/dto";

let lastSync: number | undefined = undefined;
let isCacheInitialized = false;
let syncInterval: NodeJS.Timeout | null = null;

const getLastSync = (): number => {
    return lastSync ?? -1;
};

const setLastSync = (timestamp: number | undefined) => {
    lastSync = timestamp;
};

/**
 * Initializes the data store manager, pulls chats and messages 
 * from backend to cache and starts periodic sync on user login.
 * 
 * @param backendUrl - The backend API URL for chats and messages database
 * @param db - SQLite database instance for local caching
 * @param userId - Unique identifier for the authenticated user
 * @param syncInterval - Interval for periodic syncing between the cache and backend database (in seconds, default: 60)
 * @param pageSize - Number of items to fetch per page (default: 200)
 * @param excludeDeleted - Whether to exclude deleted chats during initialization (default: true)
 * @param jwt - Optional JWT token for authenticated API requests
 * 
 * @throws {Error} If cache initialization or data fetching fails
 * 
 * @example
 * ```typescript
 * await onLogin(
 *   'https://api.example.com',
 *   database,
 *   'user_123',
 *   900, // 15 minutes
 *   200,
 *   true,
 *   'jwt_token'
 * );
 * ```
 */
const onLogin = async (
    backendUrl: string, 
    db: any, 
    userId: string,
    syncInterval: number = 60,
    pageSize: number = 200,
    excludeDeleted: boolean = true,
    registerMigrations?: Map<number, () => Promise<void>>,
    jwt?: string,
) => {
    const lastSync = getLastSync();
    createChatClient(backendUrl);
    const dbAdapter = new ExpoSQLiteAdapter(db);
    const snapshot = Date.now();

    try {
        await initializeChatsCache(dbAdapter, registerMigrations);
        isCacheInitialized = true;
        await initializeChats(userId, pageSize, lastSync, excludeDeleted, jwt);
        await initializeMessages(userId, pageSize, lastSync, excludeDeleted, jwt);
        setLastSync(snapshot);
        periodicSync(userId, syncInterval, pageSize, jwt);
    } catch (error) {
        console.error("Error during initializing cache during login: ", error);
        throw error;
    }
};

const initializeChats = async (userId: string, pageSize: number, updatedAfter: number, excludeDeleted: boolean, jwt?: string) => {
    let hasNext = true;
    let pageNumber = 0;
    try {
        while (hasNext) {
            const response = await getChatsByUserId(userId, pageSize, pageNumber, updatedAfter, excludeDeleted, jwt);
            const chats = response.data.map((chat: any) => ({
                chatId: chat.chatId,
                title: chat.title,
                userId: chat.userId,
                updatedAt: chat.updatedAt,
                createdAt: chat.createdAt,
                deletedAt: chat.deletedAt
            } as Chat));
            await upsertChats(chats);
            hasNext = response.pagination.hasNext;
            pageNumber++;
        }
    } catch (error: any) {
        console.error("Error initializing chats:", error);
        error.message = "Error initializing chats: " + error.message;
        throw error;
    }
};

const initializeMessages = async (userId: string, pageSize: number, lastSync: number, excludeDeleted: boolean, jwt?: string) => {
    let hasNext = true;
    let pageNumber = 0;
    try {
        while (hasNext) {
            const response = await getMessagesByUserId(
                userId, 
                pageSize, 
                pageNumber, 
                lastSync, 
                excludeDeleted, 
                jwt);

            const messages = response.data.map((message: any) => ({
                messageId: message.messageId,
                chatId: message.chatId,
                content: message.content,
                role: message.role,
                createdAt: message.createdAt,
                imageUrl: message.imageUrl,
                prompt: message.prompt
            } as Message));
            await upsertMessages(messages, true);
            hasNext = response.pagination.hasNext;
            pageNumber++;
        }
    } catch (error: any) {
        console.error("Error initializing messages:", error);
        error.message = "Error initializing messages: " + error.message;
        throw error;
    }
};

const periodicSync = async (userId: string, intervalSeconds: number, pageSize: number, jwt?: string) => {
    if (!isCacheInitialized) {
        console.log("Cache not initialized");
        return;
    }
    const lastSync = getLastSync();
    // Stop any existing interval
    stopPeriodicSync();

    syncInterval = setInterval(async () => {
        try {
            await periodicChatSync(userId, lastSync, pageSize, jwt);
            await periodicMessageSync(userId, lastSync!, pageSize, true);
            await clearDeletedChats();
            setLastSync(Date.now());
        } catch (error) {
            console.error('❌ Periodic sync failed:', error);
        }
    }, intervalSeconds * 1000);
    
};

/**
 * 1. Paginated pull of chats from the backend for chats updated after lastSync
 * 2. Fetch chats with the same chatIds from the cache
 * 3. If the chatId doesn't exist in the cache, upsert it to the cache
 * 4. If cache chat is deleted skip
 * 5. If cache chat is not deleted, if the backend chat is deleted upsert the chat to cache
 * 6. If cache chat is not deleted and backend chat is not deleted, check
 *    - If the updatedAt of the backend chat is greater than the cache chat, upsert the chat to cache
 *    - If the updatedAt of the backend chat is less than the cache chat, skip
 * 7. Keep a set of chatIds that is upserted to the cache
 * 
 * 8. Paginated fetch of chats from the cache updated after lastSync
 * 9. If the chatId doesn't exist in set of upserted chatIds, sync it to the backend
 */
const periodicChatSync = async (userId: string, lastSync: number, pageSize: number = 200, jwt?: string) => {
    const upsertedChatIds = await pullBackendChatsToCache(userId, lastSync, pageSize, jwt);
    await syncCachedChatsToBackend(userId, upsertedChatIds, lastSync, pageSize, jwt);
};

// Helper function: Steps 1-7 - Pull backend chats and sync to cache
const pullBackendChatsToCache = async (userId: string, lastSync: number, pageSize: number = 200, jwt?: string): Promise<Set<string>> => {
    const upsertedChatIds = new Set<string>();
    let hasNext = true;
    let pageNumber = 0;
        
    while (hasNext) {
        // Step 1: Get backend chats
        const backendResponse = await getChatsByUserId(
            userId, 
            pageSize, 
            pageNumber, 
            lastSync, 
            false, 
            jwt
        );

        const backendChats: Chat[] = [];
        const backendChatIds: string[] = [];
        backendResponse.data.forEach((chat: any) => {
            backendChats.push({
                chatId: chat.chatId,
                title: chat.title,
                userId: chat.userId,
                updatedAt: chat.updatedAt,
                createdAt: chat.createdAt,
                deletedAt: chat.deletedAt
            } as Chat);
            backendChatIds.push(chat.chatId);
        });

        // Get cached chats
        const cachedChats = await getChatsByChatIds(backendChatIds);
        const mappedCachedChats: Map<string, Chat> = new Map(cachedChats.map((chat: Chat) => {
            return [chat.chatId, chat];
        }));

        const chatsToUpsert: Chat[] = [];
        backendChats.forEach((backendChat: Chat) => {
            const cachedChat = mappedCachedChats.get(backendChat.chatId);
            if (cachedChat) {
                // Step 4: If cache chat is deleted, skip
                if (!cachedChat.deletedAt) {
                    if (backendChat.deletedAt) {
                        // Step 5: If backend chat is deleted, upsert the chat to cache
                        chatsToUpsert.push(backendChat);
                        upsertedChatIds.add(backendChat.chatId);
                    } else if (backendChat.updatedAt > cachedChat.updatedAt) {                 
                        // Step 6: Compare updatedAt timestamps
                        chatsToUpsert.push(backendChat);
                        upsertedChatIds.add(backendChat.chatId);
                    }
                }
            } else {
                // Step 3: If chatId doesn't exist in cache, upsert it to cache
                chatsToUpsert.push(backendChat);
                upsertedChatIds.add(backendChat.chatId);
            }
        });

        // Step 7: Upsert chats to cache
        if (chatsToUpsert.length > 0) {
            await upsertChats(chatsToUpsert);
        }

        hasNext = backendResponse.pagination.hasNext;
        pageNumber++;
    }
    
    return upsertedChatIds;
};

const syncCachedChatsToBackend = async (userId: string, upsertedChatIds: Set<string>, lastSync: number, pageSize: number, jwt?: string) => {
    let hasNext = true;
    let pageNumber = 0;
    try { 
        while (hasNext) {
            const result = await getCachedChatsByUserId(userId, lastSync, pageSize, pageNumber, false);
            /**  
             * 8. Paginated fetch of chats from the cache updated after lastSync
             * 9. If the chatId doesn't exist in set of upserted chatIds, sync it to the backend
             */
            const chatsToSync = result.data.filter((chat: Chat) => {
                return !upsertedChatIds.has(chat.chatId);
            });
            await syncChats(userId, chatsToSync, lastSync, jwt);
            hasNext = result.pagination.hasNext;
            pageNumber++;
        }
    } catch (error: any) {
        console.error("Error fetching cached chats:", error);
        error.message = "Error fetching cached chats: " + error.message;
        throw error;
    }   
};

const periodicMessageSync = async (userId: string, lastSync: number, pageSize: number, excludeDeleted: boolean, jwt?: string) => {
    await fetchMessages(userId, pageSize, lastSync, excludeDeleted, jwt);
    await offLoadCachedMessagesToBackend(userId, pageSize);
};

const fetchMessages = async (userId: string, pageSize: number, lastSync: number, excludeDeleted: boolean, jwt?: string) => {
    let hasNext = true;
    let pageNumber = 0;
    try {
        while (hasNext) {
            const response = await getMessagesByUserId(
                userId, 
                pageSize, 
                pageNumber, 
                lastSync, 
                excludeDeleted, 
                jwt);
            const messages = response.data.map((message: any) => ({
                messageId: message.messageId,
                chatId: message.chatId,
                content: message.content,
                role: message.role,
                createdAt: message.createdAt,
                imageUrl: message.imageUrl,
                prompt: message.prompt
            } as Message));
            await upsertMessages(messages, true);
            hasNext = response.pagination.hasNext;
            pageNumber++;
        }
    } catch (error: any) {
        console.error("Error initializing messages:", error);
        error.message = "Error initializing messages: " + error.message;
        throw error;
    }
};


const stopPeriodicSync = () => {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
        console.log('⏹️ Stopped periodic sync');
    }
};

/**
 * Cleans up the data store manager on user logout by uploading remaining 
 * cached data to backend, stopping periodic sync, and clearing local cache.
 * 
 * @param userId - Unique identifier for the authenticated user
 * @param pageSize - Number of items to process per batch during upload (default: 200)
 * @param jwt - Optional JWT token for authenticated API requests
 * 
 * @throws {Error} If cache upload or cleanup operations fail
 * 
 * @example
 * ```typescript
 * await onLogout(
 *   'user_123',
 *   200,
 *   'jwt_token'
 * );
 * ```
 */
const onLogout = async (userId: string, pageSize: number = 200, jwt?: string) => {
    if (isCacheInitialized) {
        const lastSync = getLastSync();
        stopPeriodicSync();
        await offLoadCachedChatsToBackend(userId, pageSize, lastSync, jwt)
        await offLoadCachedMessagesToBackend(userId, pageSize, jwt);
        await clearChat();
        await clearMessage();
        setLastSync(undefined);
    }
}

const offLoadCachedChatsToBackend = async (userId: string, pageSize: number, lastSync: number, jwt?: string) => {
    if (!isCacheInitialized) {
        throw new Error("Cache not initialized. Call onLogin first.");
    }
    let hasNext = true;
    let pageNumber = 0;
    try { 
        while (hasNext) {
            const result = await getCachedChatsByUserId(userId, lastSync, pageSize, pageNumber, false);
            await syncChats(userId, result.data, lastSync, jwt);
            hasNext = result.pagination.hasNext;
            pageNumber++;
        }
    } catch (error: any) {
        console.error("Error fetching cached chats:", error);
        error.message = "Error fetching cached chats: " + error.message;
        throw error;
    }   
};

const offLoadCachedMessagesToBackend = async (userId: string, pageSize: number, jwt?: string) => {
    let unsyncedMessages: Message[] = [];
    try {
        do {
            unsyncedMessages = await getAndMarkUnsyncedMessagesByUserId(userId, pageSize);
            await addMessages(unsyncedMessages, jwt);
        } while (unsyncedMessages.length > 0);
    } catch (error: any) {
        console.error("Error fetching and syncing cached messages:", error);
        error.message = "Error fetching and syncing cached messages: " + error.message;
        throw error;
    }
};

export {
    onLogin,
    onLogout
};