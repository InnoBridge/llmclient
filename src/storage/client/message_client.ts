interface MessageClient {
    getChats<T>(userId: string, jwt?: string): Promise<T[]>;
    getMessages<T>(chatId: number, jwt?: string): Promise<T[]>;
    // addChat(title: string, userId?: string, jwt?: string): Promise<void>;
    // addMessage(
    //     chatId: number, 
    //     content: string, 
    //     role: string, 
    //     imageUrl?: string, 
    //     prompt?: string,
    //     jwt?: string
    // ): Promise<void>;
    // deleteChat(chatId: number, jwt?: string): Promise<void>;
    // renameChat(chatId: number, title: string, jwt?: string): Promise<void>;
};

export type {
    MessageClient,
};