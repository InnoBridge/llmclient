import { LlmClient } from "@/client/llm_client";
import { 
    OllamaConfiguration, 
    OpenAIConfiguration,
    LlmProvider
} from "@/configuration/llm_configurations";
import { sseDecoder } from "@/utils/decoder";
import { Model, Models } from "@/models/response/models";
import { ChatRequest } from "@/models/request/chat_request";
import { ChatCompletion } from "@/models/response/chat_completion";
import { GenerateImageRequest } from "@/models/request/generate_image_request";
import { ImageResponse } from "@/models/response/image_response";
import { ServerSentEvent } from "@/models/server_sent_event";

type FetchImplementation = typeof fetch;

class OpenAIClient implements LlmClient {
    private model: Model | null = null;
    private models: Model[] | null = null;
    private provider: LlmProvider;
    protected apiKey: string;
    protected baseUrl: string = 'https://api.openai.com';

    constructor( 
        configuration: OllamaConfiguration | OpenAIConfiguration,
    ) {
        if (!configuration.provider) {
            throw new Error("Provider is required in configuration");
        }
        this.provider = configuration.provider;
        if (this.provider === LlmProvider.OLLAMA) {
            const ollamaConfig = configuration as OllamaConfiguration;
            this.baseUrl = ollamaConfig.baseURL || 'http://localhost:11434';
        }
        this.apiKey = configuration.apiKey || '';
    }

    getProvider(): LlmProvider {
        return this.provider;
    }

    getCachedModels(): Model[] | null {
        return this.models;
    }

    async getModels(): Promise<Models> {
        try {
            const response = await fetch(`${this.baseUrl}/v1/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(`HTTP error! status: ${errJson.error.message}`);            }
            
            const data = await response.json();
            this.models = data.data;
            return data as Models;
        } catch (error) {
            console.error('Error fetching models:', error);
            throw error;
        }
    }

    getModel(): Model | null {
        return this.model;
    }

    setModel(model: Model): void {  
        this.model = model;
    }
    
    async createCompletion(request: ChatRequest, chatListener?: (completions: Array<ChatCompletion>) => void): Promise<ChatCompletion> {
        if (request.stream) {
            return this.createCompletionStreaming(request, chatListener);
        } else {
            return this.createCompletionNonStreaming(request);
        }
    }

    async createCompletionNonStreaming(request: ChatRequest): Promise<ChatCompletion> {
        try {
            const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            });
            
            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(`HTTP error! status: ${errJson.error.message}`);
            }
            
            const data = await response.json();
            return data as ChatCompletion;
        } catch (error) {
            console.error('Error creating completion:', error);
            throw error;
        }
    }

    async createCompletionStreaming(
        request: ChatRequest, 
        chatListener?: (completions: Array<ChatCompletion>) => void): Promise<ChatCompletion> {
        try {
            const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(`HTTP error! status: ${errJson.error.message}`);
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
    }

    async reactNativeStreamingCompletion(
        request: ChatRequest, 
        customFetch: FetchImplementation,
        chatListener?: (completions: Array<ChatCompletion>) => void    
    ): Promise<ChatCompletion> {
        try {
            const response = await customFetch(`${this.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(`HTTP error! status: ${errJson.error.message}`);
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
    }


   /**
     * Generates an image based on the provided request.
     * 
     * Note: This method currently supports only the OPENAI provider.
     * If the provider is not OPENAI, an error will be thrown.
     */
    async generateImage(request: GenerateImageRequest): Promise<ImageResponse> {
        if (this.provider !== LlmProvider.OPENAI) {
            throw new Error(`${this.provider} is the only provider that supports image generation.`);
        }
        try {
            const response = await fetch(`${this.baseUrl}/v1/images/generations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            });
            
            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(`HTTP error! status: ${errJson.error.message}`);
            }
            
            const data = await response.json();
            return data as ImageResponse;
        } catch (error: any) {
            console.error('Error generating image:', error.message);
            throw error;
        }
    };

}

export default OpenAIClient;