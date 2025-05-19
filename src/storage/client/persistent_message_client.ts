import { PaginatedResult } from '@/models/pagination';
import { Chat, Message } from '@/models/storage/dto';
import { MessageClient } from '@/storage/client/message_client';

class PersistentMessageClient implements MessageClient {
    protected baseUrl: string;
    protected headers: Record<string, string> = { 'Content-Type': 'application/json' };

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async getChatsByUserId<T>(
        userId: string, 
        limit?: number, 
        page?: number, 
        updatedAfter?: number, 
        jwt?: string): Promise<PaginatedResult<T>> {
        const headers = { ...this.headers };
        if (jwt) {
            headers['Authorization'] = `Bearer ${jwt}`;
        }

        // Build query string with optional parameters
        const params = new URLSearchParams();
        params.append('userId', userId);
        
        if (limit !== undefined) {
            params.append('limit', limit.toString());
        }
        
        if (page !== undefined) {
            params.append('page', page.toString());
        }
        
        if (updatedAfter !== undefined) {
            params.append('updatedAfter', updatedAfter.toString());
        }

        try {
            const response = await fetch(`${this.baseUrl}/chats/userId?${params.toString()}`, {
                method: 'GET',
                headers: headers
            });
            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(`HTTP error! status: ${errJson.error}`);
            }
            const data = await response.json();
            return data as PaginatedResult<T>;
        } catch (error) {
            console.error('Error fetching chats:', error);
            throw error;
        }
    }

    async addChat(payload: Chat, jwt?: string): Promise<void> {
        const headers = { ...this.headers };
        if (jwt) {
            headers['Authorization'] = `Bearer ${jwt}`;
        }
        try {
            const response = await fetch(`${this.baseUrl}/chat`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(`HTTP error! status: ${errJson.error}`);
            }
        } catch (error) {
            console.error('Error adding chat:', error);
            throw error;
        }
    }

    async addChats(payload: Chat[], jwt?: string): Promise<void> {
        const headers = { ...this.headers };
        if (jwt) {
            headers['Authorization'] = `Bearer ${jwt}`;
        }
        try {
            const response = await fetch(`${this.baseUrl}/chats`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ chats: payload })
            });
            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(`HTTP error! status: ${errJson.error}`);
            }
        } catch (error) {
            console.error('Error adding chat:', error);
            throw error;
        }
    }

    async syncChats(userId: string, payload: Chat[], lastSync?: number, jwt?: string): Promise<void> {
        const headers = { ...this.headers };
        if (jwt) {
            headers['Authorization'] = `Bearer ${jwt}`;
        }
        
        // Build query string with userId and lastSync
        const params = new URLSearchParams();
        params.append('userId', userId);
        if (lastSync !== undefined) {
            params.append('lastSync', lastSync.toString());
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/sync/chats?${params.toString()}`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ chats: payload })
            });
            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(`HTTP error! status: ${errJson.error}`);
            }
        } catch (error) {
            console.error('Error syncing chats:', error);
            throw error;
        }
    }

    async deleteChat(chatId: number, jwt?: string): Promise<void> {
        const headers = { ...this.headers };
        if (jwt) {
            headers['Authorization'] = `Bearer ${jwt}`;
        }

        const params = new URLSearchParams();
        params.append('chatId', chatId.toString());

        try {
            const response = await fetch(`${this.baseUrl}/chat?${params.toString()}`, {
                method: 'DELETE',
                headers: headers
            });
            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(`HTTP error! status: ${errJson.error}`);
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
            throw error;
        }
    }

    async getMessagesByUserId<T>(
        userId: string, 
        limit?: number, 
        page?: number, 
        updatedAfter?: number, 
        jwt?: string): Promise<PaginatedResult<T>> {

        const headers = { ...this.headers };
        if (jwt) {
            headers['Authorization'] = `Bearer ${jwt}`;
        }

        // Build query string with optional parameters
        const params = new URLSearchParams();
        params.append('userId', userId);
        
        if (limit !== undefined) {
            params.append('limit', limit.toString());
        }
        
        if (page !== undefined) {
            params.append('page', page.toString());
        }
        
        if (updatedAfter !== undefined) {
            params.append('updatedAfter', updatedAfter.toString());
        }

        try {
            const response = await fetch(`${this.baseUrl}/messages/userId?${params.toString()}`, {
                method: 'GET',
                headers: headers
            });
            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(`HTTP error! status: ${errJson.error}`);
            }
            const data = await response.json();
            return data as PaginatedResult<T>;
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    }

    async addMessage(payload: Message, jwt?: string): Promise<void> {
        const headers = { ...this.headers };
        if (jwt) {
            headers['Authorization'] = `Bearer ${jwt}`;
        }
        try {
            const response = await fetch(`${this.baseUrl}/message`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(`HTTP error! status: ${errJson.error}`);
            }
        } catch (error) {
            console.error('Error adding message:', error);
            throw error;
        }
    }

    async addMessages(payload: Message[], jwt?: string): Promise<void> {
        const headers = { ...this.headers };
        if (jwt) {
            headers['Authorization'] = `Bearer ${jwt}`;
        }
        try {
            const response = await fetch(`${this.baseUrl}/messages`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ messages: payload })
            });
            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(`HTTP error! status: ${errJson.error}`);
            }
        } catch (error) {
            console.error('Error adding messages:', error);
            throw error;
        }
    }

}

export {
    PersistentMessageClient
}

