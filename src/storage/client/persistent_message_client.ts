import { MessageClient } from './Message_client';

class PersistentMessageClient implements MessageClient {
    protected baseUrl: string;
    protected headers: Record<string, string> = { 'Content-Type': 'application/json' };

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async getChats<T>(userId: string, jwt?: string): Promise<T[]> {
        const headers = { ...this.headers };
        if (jwt) {
            headers['Authorization'] = `Bearer ${jwt}`;
        }
        try {
            const response = await fetch(`${this.baseUrl}/chats/${userId}`, {
                method: 'GET',
                headers: headers
            });
            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(`HTTP error! status: ${errJson.error}`);
            }
            const data = await response.json();
            return data as T[];
        } catch (error) {
            console.error('Error fetching chats:', error);
            throw error;
        }
    }

    async getMessages<T>(chatId: number, jwt?: string): Promise<T[]> {
        const headers = { ...this.headers };
        if (jwt) {
            headers['Authorization'] = `Bearer ${jwt}`;
        }
        try {
            const response = await fetch(`${this.baseUrl}/messages/${chatId}`, {
                method: 'GET',
                headers: headers
            });
            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(`HTTP error! status: ${errJson.error}`);
            }
            const data = await response.json();
            return data as T[];
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    }

}

export {
    PersistentMessageClient
}

