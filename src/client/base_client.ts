import { Models } from "@/models/response/models";
import { ChatRequest } from "@/models/request/chat_request";
import { ChatCompletion } from "@/models/response/chat_completion";
import { ServerSentEvent } from "@/models/server_sent_event";
import { sseDecoder } from "@/utils/decoder";
import { GenerateImageRequest } from "@/models/request/generate_image_request";
import { ImageResponse } from "@/models/response/image_response";

type FetchImplementation = typeof fetch;

const getModels = async (baseUrl: string, headers:  Record<string, string>): Promise<Models> => {
    try {
        const response = await fetch(`${baseUrl}/v1/models`, {
            method: 'GET',
            headers: headers
        });
        if (!response.ok) {
            const errJson = await response.json();
            throw new Error(`HTTP error! status: ${errJson.error}`);            }
        
        const data = await response.json();
        return data as Models;
    } catch (error) {
        console.error('Error fetching models:', error);
        throw error;
    }
};

const createCompletionNonStreaming = async (
    baseUrl: string, 
    headers:  Record<string, string>, 
    request: ChatRequest): Promise<ChatCompletion> => {
        try {
            const response = await fetch(`${baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(request)
            });
                        
            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(`HTTP error! status: ${errJson.error}`);
            }
            
            const data = await response.json();
            return data as ChatCompletion;
        } catch (error) {
            console.error('Error creating completion:', error);
            throw error;
        }
};

const createCompletionStreaming = async (
    baseUrl: string, 
    headers:  Record<string, string>, 
    request: ChatRequest,
    chatListener?: (completions: Array<ChatCompletion>) => void): Promise<ChatCompletion> => {
        try {
            const response = await fetch(`${baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(`HTTP error! status: ${errJson.error}`);
            }

            const body = response.body as ReadableStream<Uint8Array>;
            const reader = body.getReader();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
        
                let chunk = new TextDecoder().decode(value);
                const sses: Array<ServerSentEvent> = sseDecoder(chunk);

                const completions = sses
                    .filter(sse => !sse.finished)
                    .map(sse => JSON.parse(sse.data) as ChatCompletion);
                if (chatListener && completions.length > 0) {
                    chatListener(completions);
                }
            }
            return {} as ChatCompletion; // Return an empty object or handle the completion as needed 
        } catch (error) {
            console.error('Error streaming completion:', error);
            throw error;
        }
};

const reactNativeStreamingCompletion = async (
    baseUrl: string, 
    headers:  Record<string, string>, 
    request: ChatRequest,
    customFetch: FetchImplementation,
    chatListener?: (completions: Array<ChatCompletion>) => void
): Promise<ChatCompletion> => {
    try {
        const response = await customFetch(`${baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            const errJson = await response.json();
            throw new Error(`HTTP error! status: ${errJson}`);
        }

        const body = response.body as ReadableStream<Uint8Array>;
        const reader = body.getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
    
            let chunk = new TextDecoder().decode(value);
            const sses: Array<ServerSentEvent> = sseDecoder(chunk);

            const completions = sses
                .filter(sse => !sse.finished)
                .map(sse => JSON.parse(sse.data) as ChatCompletion);
            if (chatListener && completions.length > 0) {
                chatListener(completions);
            }
        }
        return {} as ChatCompletion; // Return an empty object or handle the completion as needed 
    } catch (error) {
        console.error('Error streaming completion:', error);
        throw error;
    }
};

const generateImage = async (
    baseUrl: string, 
    headers:  Record<string, string>,
    request: GenerateImageRequest): Promise<ImageResponse> => {
    try {
        const response = await fetch(`${baseUrl}/v1/images/generations`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(request)
        });
        
        if (!response.ok) {
            const errJson = await response.json();
            throw new Error(`HTTP error! status: ${errJson.error}`);
        }
        
        const data = await response.json();
        return data as ImageResponse;
    } catch (error: any) {
        console.error('Error generating image:', error);
        throw error;
    }
}


export {
    getModels,
    createCompletionNonStreaming,
    createCompletionStreaming,
    reactNativeStreamingCompletion,
    generateImage
};