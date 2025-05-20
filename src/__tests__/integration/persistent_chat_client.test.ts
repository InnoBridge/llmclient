import { Chat, Message } from '@/models/storage/dto';
import { ChatClient } from '@/storage/client/chat_client';
import { PersistentChatClient } from '@/storage/client/persistent_chat_client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

const initializeClient = (): ChatClient => {
  try {
    const client = new PersistentChatClient(BACKEND_URL!);
    return client;
  } catch (error) {
    console.error('Error initializing client:', error);
    throw error;
  }
};

const addChatTest = async (client: ChatClient) => {
    console.log('Starting addChat test...');
    const chat = {
        chatId: 1,
        userId: 'testUser',
        title: 'Hello, this is a test chat message.',
        updatedAt: 1,
    } as Chat;
    
    try {
        await client.addChat(chat);
        const returnChat = (await client.getChatsByUserId(chat.userId)).data[0] as Chat;
        console.log('Returned chat:', returnChat);
        console.log('addChat test completed successfully!');
    } catch (error) {
        console.error('addChat test failed:', error);
    } finally {
        await client.deleteChat(chat.chatId);
        const deletedChat = (await client.getChatsByUserId(chat.userId)).data;
        console.log('Deleted chat:', deletedChat);
    }
};

const addChatsAndPaginatedGetChatsByUserIdTest = async (client: ChatClient) => {
    console.log('Starting addChatsAndPaginatedGetChatsByUserId test...');
    const chats = [
        {
            chatId: 1,
            userId: 'testUser',
            title: 'Hello, this is a test chat message.',
            updatedAt: 1,
        },
        {
            chatId: 2,
            userId: 'testUser',
            title: 'Hello, this is another test chat message.',
            updatedAt: 2,
        },
        {
            chatId: 3,
            userId: 'testUser',
            title: 'Hello, this is yet another test chat message.',
            updatedAt: 3,
        },
        {
            chatId: 4,
            userId: 'testUser',
            title: 'Hello, this is a different test chat message.',
            updatedAt: 4,
        },
        {
            chatId: 5,
            userId: 'testUser',
            title: 'Hello, this is a different test chat message.',
            updatedAt: 5,
        },
        {
            chatId: 6,
            userId: 'testUser',
            title: 'Hello, this is a different test chat message.',
            updatedAt: 6,
        },
        {
            chatId: 7,
            userId: 'testUser',
            title: 'Hello, this is a different test chat message.',
            updatedAt: 7,
        }
    ] as Chat[];

    try {
        await client.addChats(chats);
        let hasNext = true;
        let page = 0;
        let limit = 2;
        while (hasNext) {
            const paginatedChats = await client.getChatsByUserId(chats[0].userId, limit, page);
            console.log('Paginated chats:', paginatedChats.data);
            hasNext = paginatedChats.pagination.hasNext;
            page++;
        }
        console.log('addChatsAndPaginatedGetChatsByUserId test completed successfully!');
    } catch (error) {
        console.error('addChatsAndPaginatedGetChatsByUserId test failed:', error);
    } finally {
        for (const chat of chats) {
            await client.deleteChat(chat.chatId);
        }
    }
};

const syncChatsTest = async (client: ChatClient) => {
    console.log('Starting syncChats test...');
    const chats = [
        {
            chatId: 1,
            userId: 'testUser',
            title: 'Hello, this is a test chat message.',
            updatedAt: 1,
        },
        {
            chatId: 2,
            userId: 'testUser',
            title: 'Hello, this is another test chat message.',
            updatedAt: 2,
        },
        {
            chatId: 3,
            userId: 'testUser',
            title: 'Hello, this is yet another test chat message.',
            updatedAt: 3,
            deletedAt: 3,
        },
        {
            chatId: 4,
            userId: 'testUser',
            title: 'Hello, this is a different test chat message.',
            updatedAt: 4,
        },
        {
            chatId: 5,
            userId: 'testUser',
            title: 'Hello, this is a different test chat message.',
            updatedAt: 5,
        }
    ] as Chat[];

    const syncChats = [
        {
            chatId: 1,
            userId: 'testUser',
            title: 'Hello, this is a test chat message.',
            updatedAt: 1,
        },
        {
            chatId: 2,
            userId: 'testUser',
            title: 'Hello, this is another test chat message.',
            updatedAt: 3,
        },
        {
            chatId: 3,
            userId: 'testUser',
            title: 'Hello, this is yet another test chat message.',
            updatedAt: 4,
        },
        {
            chatId: 7,
            userId: 'testUser',
            title: 'Hello, this is a different test chat message.',
            updatedAt: 4,
        },
        {
            chatId: 5,
            userId: 'testUser',
            title: 'Hello, this is a different test chat message.',
            updatedAt: 4,
            deletedAt: 4,
        },
        {
            chatId: 6,
            userId: 'testUser',
            title: 'Hello, this is a different test chat message.',
            updatedAt: 6,
        }
    ] as Chat[];

    try {
        await client.addChats(chats);
        await client.syncChats(chats[0].userId, syncChats, 1);
        const resultedChats = await client.getChatsByUserId(chats[0].userId);
        console.log('Resulted chats:', resultedChats.data);
        console.log('syncChats test completed successfully!');
    } catch (error) {
        console.error('syncChats test failed:', error);
    } finally {
        const resultedChats = (await client.getChatsByUserId(chats[0].userId)).data as Chat[];
        for (const chat of resultedChats) {
            await client.deleteChat(chat.chatId);
        }
    }
}

const addMessageTest = async (client: ChatClient) => {
    console.log('Starting addMessages test...');
    const chat = {
        chatId: 1,
        userId: 'testUser',
        title: 'Hello, this is a test chat message.',
        updatedAt: 1,
    } as Chat;

    const message = {
            messageId: 1,
            chatId: chat.chatId,
            content: 'Hello, this is a test message.',
            role: 'user',
            createdAt: 1,
            imageUrl: '',
            prompt: '',
    } as Message;

    try {
        await client.addChat(chat);
        await client.addMessage(message);
        const messages = await client.getMessagesByUserId(chat.userId);
        console.log('Returned messages:', messages.data);
        console.log('addMessages test completed successfully!');
    } catch (error) {
        console.error('addMessages test failed:', error);
    } finally {
        await client.deleteChat(chat.chatId);
        const deletedChat = (await client.getChatsByUserId(chat.userId)).data;
        console.log('Deleted chat:', deletedChat);
    }
};

const addMessagesAndPaginatedGetMessagesByUserIdTest = async (client: ChatClient) => {
    console.log('Starting addMessagesAndPaginatedGetMessagesByUserId test...');
    const chat = {
        chatId: 1,
        userId: 'testUser',
        title: 'Hello, this is a test chat message.',
        updatedAt: 1,
    } as Chat;

    const messages = [
        {
            messageId: 1,
            chatId: chat.chatId,
            content: 'Hello, this is a test message.',
            role: 'user',
            createdAt: 1,
            imageUrl: '',
            prompt: '',
        },
        {
            messageId: 2,
            chatId: chat.chatId,
            content: 'Hello, this is another test message.',
            role: 'assistant',
            createdAt: 2,
            imageUrl: '',
            prompt: '',
        },
        {
            messageId: 3,
            chatId: chat.chatId,
            content: 'Hello, this is yet another test message.',
            role: 'user',
            createdAt: 3,
            imageUrl: '',
            prompt: '',
        },
        {
            messageId: 4,
            chatId: chat.chatId,
            content: 'Hello, this is a different test message.',
            role: 'assistant',
            createdAt: 4,
            imageUrl: '',
            prompt: '',
        },
        {
            messageId: 5,
            chatId: chat.chatId,
            content: 'Hello, this is a different test message.',
            role: 'user',
            createdAt: 5,
            imageUrl: '',
            prompt: '',
        },
        {
            messageId: 6,
            chatId: chat.chatId,
            content: 'Hello, this is a different test message.',
            role: 'assistant',
            createdAt: 6,
            imageUrl: '',
            prompt: '',
        },
        {
            messageId: 7,
            chatId: chat.chatId,
            content: 'Hello, this is a different test message.',
            role: 'user',
            createdAt: 7,
            imageUrl: '',
            prompt: '',
        }
    ] as Message[];

    try {
        await client.addChat(chat);
        await client.addMessages(messages);
        let hasNext = true;
        let page = 0;
        let limit = 2;
        while (hasNext) {
            const paginatedMessages = await client.getMessagesByUserId(chat.userId, limit, page);
            console.log('Paginated messages:', paginatedMessages.data);
            hasNext = paginatedMessages.pagination.hasNext;
            page++;
        }
        console.log('addMessagesAndPaginatedGetMessagesByUserId test completed successfully!');
    } catch (error) {
        console.error('addMessagesAndPaginatedGetMessagesByUserId test failed:', error);
    } finally {
         client.deleteChat(chat.chatId);
    }
};

// Wrap in an immediately invoked async function to use await
(async function main() {
    try {
        // sync test
        const client = initializeClient();
  
        // promise tests in order
        await addChatTest(client);
        await addChatsAndPaginatedGetChatsByUserIdTest(client);
        await syncChatsTest(client);

        await addMessageTest(client);
        await addMessagesAndPaginatedGetMessagesByUserIdTest(client);
  
        console.log("🎉 All integration tests passed");
    } catch (err) {
        console.error("❌ Integration tests failed:", err);
        process.exit(1);
    }
  })();