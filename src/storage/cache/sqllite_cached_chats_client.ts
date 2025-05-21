import { CachedChatsClient } from "@/storage/cache/cached_chats_client";
import { SQLiteRunResult } from "@/models/sqllite";
import { SqlLiteClient } from "@/storage/cache/database_client";
import {
    Transaction,
    CREATE_CHATS_TABLE_QUERY,
    CREATE_MESSAGES_TABLE_QUERY,
    ADD_CHAT_QUERY,
    UPSERT_CHATS_QUERY,
    GET_CHATS_QUERY,
    GET_MESSAGES_QUERY,
    ADD_MESSAGE_QUERY,
    DELETE_CHAT_QUERY,
    RENAME_CHAT_QUERY,
    CLEAR_CHAT_QUERY
} from "@/storage/queries";
import { Chat } from "@/models/storage/dto";

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

    async addChat(
        chatId: string,
        userId: string, 
        title: string, 
        updateTimestamp?: number, 
        deletedTimestamp?: number): Promise<SQLiteRunResult> {
        try {
            return await this.runAsync(ADD_CHAT_QUERY, [
                chatId, 
                userId, 
                title, 
                updateTimestamp || null, 
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
        try {
            const query = UPSERT_CHATS_QUERY(chats.length);
            const params = chats.flatMap(chat => [
                chat.chatId,
                chat.userId,
                chat.title,
                chat.createdAt || null,
                chat.updatedAt || Date.now(),
                chat.deletedAt || null
            ]);
            await this.runAsync(query, params);
        } catch (error) {
            await this.rollbackTransaction();
            console.error("Error adding chats:", error);
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

    async getMessages<T>(chatId: string): Promise<T[]> {
        try {
            return await this.getAllAsync(GET_MESSAGES_QUERY, [chatId]);
        } catch (error) {
            console.error("Error fetching messages:", error);
            throw error;
        }
    };

    async addMessage(
        chatId: string, 
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

    async deleteChat(chatId: string): Promise<SQLiteRunResult> {
        try {
            return await this.runAsync(DELETE_CHAT_QUERY, [chatId]);
        } catch (error) {
            console.error("Error deleting chat:", error);
            throw error;
        }
    }

    async renameChat(chatId: string, title: string): Promise<SQLiteRunResult> {
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

    async updateTableTimestamp(tableName: string, id: string): Promise<SQLiteRunResult> {
        try {
            return await this.runAsync(`UPDATE ${tableName} SET updated_at = unixepoch() WHERE id = ?`, [id]);
        } catch (error) {
            console.error("Error updating table timestamp:", error);
            throw error;
        }
    }
};

export {
    SqlLiteCachedChatsClient
};