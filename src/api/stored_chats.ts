import { ChatClient } from '@/storage/client/chat_client';
import { PersistentChatClient } from '@/storage/client/persistent_chat_client';
import { PaginatedResult } from '@/models/pagination';
import { Chat, Message } from '@/models/storage/dto';

let chatClient: ChatClient | null = null;

const createChatClient = (backendUrl: string) => {
    chatClient = new PersistentChatClient(backendUrl);
};

const getChatsByUserId = async <T>(
    userId: string, 
    limit?: number, 
    page?: number, 
    updatedAfter?: number, 
    jwt?: string
): Promise<PaginatedResult<T>> => {
    if (!chatClient) {
        throw new Error("Chat client not initialized. Call createChatClient first.");
    }
    return await chatClient.getChatsByUserId(userId, limit, page, updatedAfter, jwt);
};

const addChat = async (payload: Chat, jwt?: string): Promise<void> => {
    if (!chatClient) {
        throw new Error("Chat client not initialized. Call createChatClient first.");
    }
    await chatClient.addChat(payload, jwt);
};

const addChats = async (payload: Chat[], jwt?: string): Promise<void> => {
    if (!chatClient) {
        throw new Error("Chat client not initialized. Call createChatClient first.");
    }
    await chatClient.addChats(payload, jwt);
};

const syncChats = async (userId: string, chats: Chat[], lastSync?: number, jwt?: string): Promise<void> => {
    if (!chatClient) {
        throw new Error("Chat client not initialized. Call createChatClient first.");
    }
    await chatClient.syncChats(userId, chats, lastSync, jwt);
};

const deleteChat = async (chatId: number, jwt?: string): Promise<void> => {
    if (!chatClient) {
        throw new Error("Chat client not initialized. Call createChatClient first.");
    }
    await chatClient.deleteChat(chatId, jwt);
};

const getMessagesByUserId = async <T>(
    userId: string, 
    limit?: number, 
    page?: number, 
    updatedAfter?: number, 
    jwt?: string
): Promise<PaginatedResult<T>> => {    
    if (!chatClient) {
        throw new Error("Chat client not initialized. Call createChatClient first.");
    }
    return await chatClient.getMessagesByUserId(userId, limit, page, updatedAfter, jwt);
};

const addMessage = async (payload: Message, jwt?: string): Promise<void> => {
    if (!chatClient) {
        throw new Error("Chat client not initialized. Call createChatClient first.");
    }
    await chatClient.addMessage(payload, jwt);
};

const addMessages = async (payload: Message[], jwt?: string): Promise<void> => {
    if (!chatClient) {
        throw new Error("Chat client not initialized. Call createChatClient first.");
    }
    await chatClient.addMessages(payload, jwt);
};

export {
    createChatClient,
    getChatsByUserId,
    addChat,
    addChats,
    syncChats,
    deleteChat,
    getMessagesByUserId,
    addMessage,
    addMessages
};