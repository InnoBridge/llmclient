import { CachedChatsClient } from "@/storage/cache/cached_chats_client";
import { SQLiteRunResult } from "@/models/sqllite";
import { SqlLiteClient } from "@/storage/cache/database_client";
import {
    Transaction,
    CREATE_CHATS_TABLE_QUERY,
    CREATE_MESSAGES_TABLE_QUERY,
    GET_CHATS_QUERY,
    GET_CHATS_BY_USER_ID_QUERY,
    ADD_CHAT_QUERY,
    UPSERT_CHATS_QUERY,
    COUNT_CHATS_BY_USER_ID_QUERY,
    GET_MESSAGES_QUERY,
    ADD_MESSAGE_QUERY,
    UPSERT_MESSAGES_QUERY,
    DELETE_CHAT_QUERY,
    RENAME_CHAT_QUERY,
    CLEAR_CHAT_QUERY,
    CLEAR_MESSAGE_QUERY,
    UPDATE_TABLE_TIMESTAMP_QUERY,
    GET_AND_MARK_UNSYNCED_MESSAGES_BY_USER_ID_QUERY
} from "@/storage/queries";
import { Chat, Message } from "@/models/storage/dto";

class SqlLiteCachedChatsClient implements CachedChatsClient {
    private db: SqlLiteClient;
    private migrations: Map<number, () => Promise<void>> = new Map();
    
    constructor(db: SqlLiteClient) {
        this.db = db;

        this.registerMigration(0, async () => {
            // Create chats table with timestamp
            await this.createChatsTable();
            
            // Create messages table with timestamp
            await this.createMessagesTable();
            
            // Create indexes for better performance
            await this.execAsync('CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);');
            await this.execAsync('CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);');
        });
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

    async getFirstAsync<T>(query: string, params: any[] = []): Promise<T | null> {
        return await this.db.getFirstAsync<T>(query, params);
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

    // Public method to register migrations
    registerMigration(fromVersion: number, migrationFn: () => Promise<void>): void {
        this.migrations.set(fromVersion, migrationFn);
    }

    async initializeCache(): Promise<void> {
        let result = await this.db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
        let currentDbVersion = result?.user_version ?? 0;

        if (currentDbVersion < this.getHighestMigrationVersion()) {
            try {            
                // Set SQLite mode and enable foreign keys
                await this.execAsync('PRAGMA journal_mode = "wal";');
                await this.execAsync('PRAGMA foreign_keys = ON;');
                
                // THEN begin transaction for schema creation
                await this.beginTransaction();

                try {
                    // Apply migrations in order
                    while (this.migrations.has(currentDbVersion)) {
                        console.log(`Upgrading from version ${currentDbVersion} to ${currentDbVersion + 1}`);
                        const migration = this.migrations.get(currentDbVersion);
                        await migration!();
                        currentDbVersion++;
                        
                        // Update the version after each successful migration
                        await this.execAsync(`PRAGMA user_version = ${currentDbVersion}`);
                    }
                    
                    console.log(`Database schema is at version ${currentDbVersion}`);
                    
                    // Commit all migrations
                    await this.commitTransaction();
                    console.log("Database migrations completed successfully");
                    
                } catch (error) {
                    // Rollback on any error
                    await this.rollbackTransaction();
                    console.error("Database migration failed:", error);
                    throw error;
                }
            } catch (error) {
                console.error("Database initialization failed:", error);
                throw error;
            }
        }
    }

    // Helper method to get the highest migration version
    private getHighestMigrationVersion(): number {
        return Math.max(-1, ...Array.from(this.migrations.keys())) + 1;
    }

    async getChats<T>(): Promise<T[]> {
        try {
            return await this.getAllAsync(GET_CHATS_QUERY);
        } catch (error) {
            console.error("Error fetching chats:", error);
            throw error;
        }
    };

    async countChatsByUserId(userId: string, updatedAfter: number = -1, excludeDeleted: boolean = false): Promise<number> {
        try {
            const result: any = await this.getFirstAsync(COUNT_CHATS_BY_USER_ID_QUERY(excludeDeleted), [userId, updatedAfter]);
            return result?.total || 0;
        } catch (error) {
            console.error("Error counting chats by user ID:", error);
            throw error;
        }
    };

    async getChatsByUserId(
        userId: string, 
        updatedAfter: number = -1, 
        limit: number = 20, 
        page: number = 0, 
        excludeDeleted: boolean = false): Promise<Chat[]> {
        const offset = page * limit;
        try {
            const result = await this.getAllAsync(GET_CHATS_BY_USER_ID_QUERY(excludeDeleted), [
                userId,
                updatedAfter,
                limit,
                offset,
            ]);
            return result.map((chat: any) => {
                const chatObject: any = {
                    chatId: chat.id,
                    userId: chat.user_id,
                    title: chat.title,
                    createdAt: chat.created_at,
                    updatedAt: chat.updated_at,
                };

                if (chat.deleted_at) {
                    chatObject.deletedAt = chat.deleted_at;
                }

                return chatObject as Chat;
            });
        } catch (error) {
            console.error("Error fetching chats by user ID:", error);
            throw error;
        }
    }


    async addChat(
        chatId: string,
        userId: string, 
        title: string, 
        updateTimestamp?: number, 
        deletedTimestamp?: number): Promise<SQLiteRunResult> {
        const now = Date.now();
        try {
            return await this.runAsync(ADD_CHAT_QUERY, [
                chatId, 
                userId, 
                title,
                now,
                updateTimestamp || now, 
                deletedTimestamp || null]);
        } catch (error) {
            console.error("Error adding chat:", error);
            throw error;
        }
    };

    async upsertChats(chats: Chat[]): Promise<void> {
        if (!chats || chats.length === 0) {
            return;
        }
        const now = Date.now();
        try {
            const query = UPSERT_CHATS_QUERY(chats.length);
            const params = chats.flatMap(chat => [
                chat.chatId,
                chat.userId,
                chat.title,
                chat.createdAt || now,
                chat.updatedAt || now,
                chat.deletedAt || null
            ]);
            await this.runAsync(query, params);
        } catch (error) {
            console.error("Error upserting chats:", error);
            throw error;
        }
    };

    async getMessages(chatId: string): Promise<Message[]> {
        try {
            const result = await this.getAllAsync(GET_MESSAGES_QUERY, [chatId]);
            return result.map((message: any) => {
                return {
                    messageId: message.id,
                    chatId: message.chat_id,
                    content: message.content,
                    role: message.role,
                    createdAt: message.created_at,
                    imageUrl: message.image_url,
                    prompt: message.prompt
                } as Message;
            });
        } catch (error) {
            console.error("Error fetching messages:", error);
            throw error;
        }
    };

    async addMessage(
        messageId: string,
        chatId: string, 
        content: string, 
        role: string, 
        imageUrl?: string, 
        prompt?: string,
        isSynced: boolean = false
    ): Promise<SQLiteRunResult> {
        try {
            const now = Date.now();
            return await this.runAsync(ADD_MESSAGE_QUERY, [
                messageId, 
                chatId, 
                content, 
                role, 
                imageUrl || null, 
                prompt || null,
                now,
                isSynced]);
        } catch (error) {
            console.error("Error adding message:", error);
            throw error;
        }
    };

    async upsertMessages(messages: Message[], isSynced: boolean = false): Promise<void> {
        if (!messages || messages.length === 0) {
            return;
        }

        try {
            const now = Date.now();
            const query = UPSERT_MESSAGES_QUERY(messages.length);
            const params = messages.flatMap(message => [
                message.messageId,
                message.chatId,
                message.content,
                message.role,
                message.imageUrl || null,
                message.prompt || null,
                message.createdAt || now,
                isSynced
            ]);
            await this.runAsync(query, params);
        } catch (error) {
            console.error("Error adding messages:", error);
            throw error;
        }
    };

    // async countUnsyncedMessagesByUserId(userId: string): Promise<number> {


    async getAndMarkUnsyncedMessagesByUserId(userId: string, limit: number = 20): Promise<Message[]> {
        try {
            if (limit <= 0) {
                const errorMsg = `Invalid limit: ${limit}. Limit must be greater than 0.`;
                console.error(errorMsg);
                throw new Error(errorMsg);
            }
            const result = await this.getAllAsync(GET_AND_MARK_UNSYNCED_MESSAGES_BY_USER_ID_QUERY, [
                userId,
                limit]);
            return result.map((message: any) => {
                return {
                    messageId: message.id,
                    chatId: message.chat_id,
                    content: message.content,
                    role: message.role,
                    createdAt: message.created_at,
                    imageUrl: message.image_url,
                    prompt: message.prompt
                } as Message;
            });
        } catch (error) {
            console.error("Error fetching unsynced messages by user ID:", error);
            throw error;
        }
    };

    async deleteChat(chatId: string): Promise<SQLiteRunResult> {
        try {
            return await this.runAsync(DELETE_CHAT_QUERY, [chatId]);
        } catch (error) {
            console.error("Error deleting chat:", error);
            throw error;
        }
    };

    async renameChat(chatId: string, title: string): Promise<SQLiteRunResult> {
        try {
            return await this.runAsync(RENAME_CHAT_QUERY, [title, chatId]);
        } catch (error) {
            console.error("Error renaming chat:", error);
            throw error;
        }
    };

    async clearChat(): Promise<void> {
        try {
            return await this.execAsync(CLEAR_CHAT_QUERY);
        } catch (error) {
            console.error("Error clearing chat:", error);
            throw error;
        }
    };

    async clearMessage(): Promise<void> {
        try {
            return await this.execAsync(CLEAR_MESSAGE_QUERY);
        } catch (error) {
            console.error("Error clearing messages:", error);
            throw error;
        }
    };

    async updateTableTimestamp(tableName: string, id: string): Promise<SQLiteRunResult> {
        try {
            const now = Date.now();
            return await this.runAsync(UPDATE_TABLE_TIMESTAMP_QUERY(tableName), [now, id]);
        } catch (error) {
            console.error("Error updating table timestamp:", error);
            throw error;
        }
    };
};

export {
    SqlLiteCachedChatsClient
};