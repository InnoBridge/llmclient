import { PaginatedResult } from '@/models/pagination';
import { Chat, Message } from '@/models/storage/dto';

interface ChatClient {
    // Chat operations
    getChatsByUserId<T>(
        userId: string, 
        limit?: number, 
        page?: number, 
        updatedAfter?: number, 
        excludeDeleted?: boolean,
        jwt?: string): Promise<PaginatedResult<T>>;
    addChat(payload: Chat, jwt?: string): Promise<void>;
    addChats(chats: Chat[], jwt?: string): Promise<void>;
    syncChats(userId: string, chats: Chat[], lastSync?: number, jwt?: string): Promise<void>;
    deleteChat(chatId: string, jwt?: string): Promise<void>;
    
    // Message operations
    getMessagesByUserId<T>(
        userId: string, 
        limit?: number, 
        page?: number, 
        createdAfter?: number,
        excludeDeleted?: boolean,
        jwt?: string): Promise<PaginatedResult<T>>;
    addMessage(payload: Message, jwt?: string): Promise<void>;
    addMessages(payload: Message[], jwt?: string): Promise<void>;
};

export type {
    ChatClient,
};