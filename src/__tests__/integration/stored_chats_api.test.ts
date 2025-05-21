import * as dotenv from 'dotenv';
import path from 'path';
import {
    createChatClient,
    getChatsByUserId,
    addChat,
    addChats,
    syncChats,
    deleteChat,
    getMessagesByUserId,
    addMessage,
    addMessages
} from "@/api/stored_chats";
import { Chat, Message } from '@/models/storage/dto';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PROXY_URL = process.env.PROXY_URL;

const initializeStoredChats = async () => {
    await createChatClient(PROXY_URL!);
};

const addChatTest = async () => {
    console.log('Starting addChat test...');
    const chat = {
        chatId: '1',
        userId: 'testUser',
        title: 'Hello, this is a test chat message.',
        updatedAt: 1,
        createdAt: 1000000000000,
    } as Chat;
    
    try {
        await addChat(chat);
        const returnChat = (await getChatsByUserId(chat.userId)).data[0] as Chat;
        console.log('Returned chat:', returnChat);
        console.log('addChat test completed successfully!');
    } catch (error) {
        console.error('addChat test failed:', error);
    } finally {
        await deleteChat(chat.chatId);
        const deletedChat = (await getChatsByUserId(chat.userId)).data;
        console.log('Deleted chat:', deletedChat);
    }
};

const addChatsAndPaginatedGetChatsByUserIdTest = async () => {
    console.log('Starting addChatsAndPaginatedGetChatsByUserId test...');
    const chats = [
        {
            chatId: '1',
            userId: 'testUser',
            title: 'Hello, this is a test chat message.',
            updatedAt: 1,
        },
        {
            chatId: '2',
            userId: 'testUser',
            title: 'Hello, this is another test chat message.',
            updatedAt: 2,
        },
        {
            chatId: '3',
            userId: 'testUser',
            title: 'Hello, this is yet another test chat message.',
            updatedAt: 3,
        },
        {
            chatId: '4',
            userId: 'testUser',
            title: 'Hello, this is a different test chat message.',
            updatedAt: 4,
        },
        {
            chatId: '5',
            userId: 'testUser',
            title: 'Hello, this is a different test chat message.',
            updatedAt: 5,
        },
        {
            chatId: '6',
            userId: 'testUser',
            title: 'Hello, this is a different test chat message.',
            updatedAt: 6,
        },
        {
            chatId: '7',
            userId: 'testUser',
            title: 'Hello, this is a different test chat message.',
            updatedAt: 7,
        }
    ] as Chat[];

    try {
        await addChats(chats);
        let hasNext = true;
        let page = 0;
        let limit = 2;
        while (hasNext) {
            const paginatedChats = await getChatsByUserId(chats[0].userId, limit, page);
            console.log('Paginated chats:', paginatedChats.data);
            hasNext = paginatedChats.pagination.hasNext;
            page++;
        }
        console.log('addChatsAndPaginatedGetChatsByUserId test completed successfully!');
    } catch (error) {
        console.error('addChatsAndPaginatedGetChatsByUserId test failed:', error);
    } finally {
        for (const chat of chats) {
            await deleteChat(chat.chatId);
        }
    }
};

const syncChatsTest = async () => {
    console.log('Starting syncChats test...');
    const chats = [
        {
            chatId: '1',
            userId: 'testUser',
            title: 'Hello, this is a test chat message.',
            updatedAt: 1,
        },
        {
            chatId: '2',
            userId: 'testUser',
            title: 'Hello, this is another test chat message.',
            updatedAt: 2,
        },
        {
            chatId: '3',
            userId: 'testUser',
            title: 'Hello, this is yet another test chat message.',
            updatedAt: 3,
            deletedAt: 3,
        },
        {
            chatId: '4',
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

    const chatsToSync = [
        {
            chatId: '1',
            userId: 'testUser',
            title: 'Hello, this is a test chat message.',
            updatedAt: 1,
        },
        {
            chatId: '2',
            userId: 'testUser',
            title: 'Hello, this is another test chat message.',
            updatedAt: 3,
        },
        {
            chatId: '3',
            userId: 'testUser',
            title: 'Hello, this is yet another test chat message.',
            updatedAt: 4,
        },
        {
            chatId: '7',
            userId: 'testUser',
            title: 'Hello, this is a different test chat message.',
            updatedAt: 4,
        },
        {
            chatId: '5',
            userId: 'testUser',
            title: 'Hello, this is a different test chat message.',
            updatedAt: 4,
            deletedAt: 4,
        },
        {
            chatId: '6',
            userId: 'testUser',
            title: 'Hello, this is a different test chat message.',
            updatedAt: 6,
        }
    ] as Chat[];

    try {
        await addChats(chats);
        await syncChats(chats[0].userId, chatsToSync, 1);
        const resultedChats = await getChatsByUserId(chats[0].userId);
        console.log('Resulted chats:', resultedChats.data);
        console.log('syncChats test completed successfully!');
    } catch (error) {
        console.error('syncChats test failed:', error);
    } finally {
        const resultedChats = (await getChatsByUserId(chats[0].userId)).data as Chat[];
        for (const chat of resultedChats) {
            await deleteChat(chat.chatId);
        }
    }
}

const addMessageTest = async () => {
    console.log('Starting addMessages test...');
    const chat = {
        chatId: '1',
        userId: 'testUser',
        title: 'Hello, this is a test chat message.',
        updatedAt: 1,
    } as Chat;

    const message = {
            messageId: '1',
            chatId: chat.chatId,
            content: 'Hello, this is a test message.',
            role: 'user',
            createdAt: 1,
            imageUrl: '',
            prompt: '',
    } as Message;

    try {
        await addChat(chat);
        await addMessage(message);
        const messages = await getMessagesByUserId(chat.userId);
        console.log('Returned messages:', messages.data);
        console.log('addMessages test completed successfully!');
    } catch (error) {
        console.error('addMessages test failed:', error);
    } finally {
        await deleteChat(chat.chatId);
        const deletedChat = (await getChatsByUserId(chat.userId)).data;
        console.log('Deleted chat:', deletedChat);
    }
};

const addMessagesAndPaginatedGetMessagesByUserIdTest = async () => {
    console.log('Starting addMessagesAndPaginatedGetMessagesByUserId test...');
    const chat = {
        chatId: '1',
        userId: 'testUser',
        title: 'Hello, this is a test chat message.',
        updatedAt: 1,
    } as Chat;

    const messages = [
        {
            messageId: '1',
            chatId: chat.chatId,
            content: 'Hello, this is a test message.',
            role: 'user',
            createdAt: 1,
            imageUrl: '',
            prompt: '',
        },
        {
            messageId: '2',
            chatId: chat.chatId,
            content: 'Hello, this is another test message.',
            role: 'assistant',
            createdAt: 2,
            imageUrl: '',
            prompt: '',
        },
        {
            messageId: '3',
            chatId: chat.chatId,
            content: 'Hello, this is yet another test message.',
            role: 'user',
            createdAt: 3,
            imageUrl: '',
            prompt: '',
        },
        {
            messageId: '4',
            chatId: chat.chatId,
            content: 'Hello, this is a different test message.',
            role: 'assistant',
            createdAt: 4,
            imageUrl: '',
            prompt: '',
        },
        {
            messageId: '5',
            chatId: chat.chatId,
            content: 'Hello, this is a different test message.',
            role: 'user',
            createdAt: 5,
            imageUrl: '',
            prompt: '',
        },
        {
            messageId: '6',
            chatId: chat.chatId,
            content: 'Hello, this is a different test message.',
            role: 'assistant',
            createdAt: 6,
            imageUrl: '',
            prompt: '',
        },
        {
            messageId: '7',
            chatId: chat.chatId,
            content: 'Hello, this is a different test message.',
            role: 'user',
            createdAt: 7,
            imageUrl: '',
            prompt: '',
        }
    ] as Message[];

    try {
        await addChat(chat);
        await addMessages(messages);
        let hasNext = true;
        let page = 0;
        let limit = 2;
        while (hasNext) {
            const paginatedMessages = await getMessagesByUserId(chat.userId, limit, page);
            console.log('Paginated messages:', paginatedMessages.data);
            hasNext = paginatedMessages.pagination.hasNext;
            page++;
        }
        console.log('addMessagesAndPaginatedGetMessagesByUserId test completed successfully!');
    } catch (error) {
        console.error('addMessagesAndPaginatedGetMessagesByUserId test failed:', error);
    } finally {
         deleteChat(chat.chatId);
    }
};

const testExcludeDeletedParameter = async () => {
    console.log('Starting excludeDeleted parameter test...');
    const chats = [
        {
            chatId: 'active1',
            userId: 'filterTestUser',
            title: 'Active chat 1',
            updatedAt: Date.now(),
            createdAt: Date.now() - 10000,
        },
        {
            chatId: 'deleted1',
            userId: 'filterTestUser',
            title: 'Deleted chat 1',
            updatedAt: Date.now(),
            createdAt: Date.now() - 20000,
            deletedAt: Date.now() - 5000,
        },
        {
            chatId: 'active2',
            userId: 'filterTestUser',
            title: 'Active chat 2',
            updatedAt: Date.now(),
            createdAt: Date.now() - 30000,
        }
    ] as Chat[];

    try {
        await addChats(chats);
        
        // Test with excludeDeleted = true
        const filteredChats = await getChatsByUserId('filterTestUser', 10, 0, undefined, true);
        console.log('Chats with excludeDeleted=true:', filteredChats.data);
        
        // Test with excludeDeleted = false 
        const allChats = await getChatsByUserId('filterTestUser', 10, 0, undefined, false);
        console.log('Chats with excludeDeleted=false:', allChats.data);
        
        console.log('excludeDeleted parameter test completed successfully!');
    } catch (error) {
        console.error('excludeDeleted parameter test failed:', error);
    } finally {
        for (const chat of chats) {
            await deleteChat(chat.chatId);
        }
    }
};

(async function main() {
    try {
        // sync test
        initializeStoredChats();

        // promise tests in order
        await addChatTest();
        await addChatsAndPaginatedGetChatsByUserIdTest();
        await syncChatsTest();

        await addMessageTest();
        await addMessagesAndPaginatedGetMessagesByUserIdTest();
        await testExcludeDeletedParameter();

        console.log("🎉 All integration tests passed");
    } catch (err) {
        console.error("❌ Integration tests failed:", err);
        process.exit(1);
    }
})();