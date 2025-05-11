import { MessageCacheClient } from "@/storage/cache/message_cache_client";
import { SQLiteRunResult } from "@/models/sqllite";
import { SqlLiteClient } from "@/storage/cache/database_client";
import {
    Transaction,
    CREATE_CHATS_TABLE_QUERY,
    CREATE_MESSAGES_TABLE_QUERY,
    ADD_CHAT_QUERY,
    GET_CHATS_QUERY,
    GET_MESSAGES_QUERY,
    ADD_MESSAGE_QUERY,
    DELETE_CHAT_QUERY,
    RENAME_CHAT_QUERY,
    CLEAR_CHAT_QUERY
} from "@/storage/queries";

class SqlLiteMessageCacheClient implements MessageCacheClient {
    private db: SqlLiteClient;
    
    constructor(db: SqlLiteClient) {
        this.db = db;
    }

    async execAsync(query: string): Promise<void> {
        return await this.db.execAsync(query);
    }

    async runAsync(query: string, params: any[] = []): Promise<SQLiteRunResult> {
        return await this.db.runAsync(query, params);
    };

    async getAllAsync<T>(query: string, params: any[] = []): Promise<T[]> {
        return await this.db.getAllAsync<T>(query, params);
    };

    async beginTransaction(): Promise<void> {
        return await this.execAsync(`${Transaction.BEGIN};`);
    };

    async commitTransaction(): Promise<void> {
        return await this.execAsync(`${Transaction.COMMIT};`);
    };

    async rollbackTransaction(): Promise<void> {
        return await this.execAsync(`${Transaction.ROLLBACK};`);
    };

    async createChatsTable(): Promise<void> {
        return await this.execAsync(CREATE_CHATS_TABLE_QUERY);
    };

    async createMessagesTable(): Promise<void> {
        return await this.execAsync(CREATE_MESSAGES_TABLE_QUERY);
    };

    async initializeCache(): Promise<void> {
        const DATABASE_VERSION = 1;
        let result = await this.db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
        let currentDbVersion = result?.user_version ?? 0;


        if (currentDbVersion === 0) {
            try {            
                // Set SQLite mode and enable foreign keys
                await this.execAsync('PRAGMA journal_mode = "wal";');
                await this.execAsync('PRAGMA foreign_keys = ON;');
                
                // THEN begin transaction for schema creation
                await this.beginTransaction();

                // Create chats table with timestamp
                await this.createChatsTable();
                
                // Create messages table with timestamp
                await this.createMessagesTable();
                
                // Create indexes for better performance
                await this.execAsync('CREATE INDEX idx_messages_chat_id ON messages(chat_id);');
                await this.execAsync('CREATE INDEX idx_messages_role ON messages(role);');
                
                // Commit the transaction
                await this.commitTransaction();
                console.log("Database schema created successfully");
                
                currentDbVersion = 1;
            } catch (error) {
                // Rollback on any error
                await this.rollbackTransaction();
                console.error("Database migration failed:", error);
                throw error;
            }
        }

        await this.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    }

    async addChat(title: string, userId?: string): Promise<SQLiteRunResult> {
        try {
            return await this.runAsync(ADD_CHAT_QUERY, [title, userId || null]);
        } catch (error) {
            console.error("Error adding chat:", error);
            throw error;
        }
    };

    async getChats<T>(): Promise<T[]> {
        try {
            return await this.getAllAsync(GET_CHATS_QUERY);
        } catch (error) {
            console.error("Error fetching chats:", error);
            throw error;
        }
    };

    async getMessages<T>(chatId: number): Promise<T[]> {
        try {
            return await this.getAllAsync(GET_MESSAGES_QUERY, [chatId]);
        } catch (error) {
            console.error("Error fetching messages:", error);
            throw error;
        }
    };

    async addMessage(
        chatId: number, 
        content: string, 
        role: string, 
        imageUrl?: string, 
        prompt?: string): Promise<SQLiteRunResult> {
        try {
            return await this.runAsync(ADD_MESSAGE_QUERY, [chatId, content, role, imageUrl, prompt]);
        } catch (error) {
            console.error("Error adding message:", error);
            throw error;
        }
    }

    async deleteChat(chatId: number): Promise<SQLiteRunResult> {
        try {
            return await this.runAsync(DELETE_CHAT_QUERY, [chatId]);
        } catch (error) {
            console.error("Error deleting chat:", error);
            throw error;
        }
    }

    async renameChat(chatId: number, title: string): Promise<SQLiteRunResult> {
        try {
            return await this.runAsync(RENAME_CHAT_QUERY, [title, chatId]);
        } catch (error) {
            console.error("Error renaming chat:", error);
            throw error;
        }
    }

    async clearChat(): Promise<void> {
        try {
            return await this.execAsync(CLEAR_CHAT_QUERY);
        } catch (error) {
            console.error("Error clearing chat:", error);
            throw error;
        }
    }

    async updateTableTimestamp(tableName: string, id: number): Promise<SQLiteRunResult> {
        try {
            return await this.runAsync(`UPDATE ${tableName} SET updated_at = unixepoch() WHERE id = ?`, [id]);
        } catch (error) {
            console.error("Error updating table timestamp:", error);
            throw error;
        }
    }
};

export {
    SqlLiteMessageCacheClient
};