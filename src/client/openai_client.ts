import { LlmClient } from "@/client/llm_client";
import { 
    OllamaConfiguration, 
    OpenAIConfiguration,
    LlmProvider
} from "@/configuration/llm_configurations";
import { Model, Models } from "@/models/response/models";
import { ChatRequest } from "@/models/request/chat_request";
import { ChatCompletion } from "@/models/response/chat_completion";
import { GenerateImageRequest } from "@/models/request/generate_image_request";
import { ImageResponse } from "@/models/response/image_response";
import { 
    getModels, 
    createCompletionNonStreaming,
    createCompletionStreaming,
    reactNativeStreamingCompletion,
    generateImage
} from "@/client/base_client";

type FetchImplementation = typeof fetch;

class OpenAIClient implements LlmClient {
    private model: Model | null = null;
    private models: Model[] | null = null;
    private provider: LlmProvider;
    protected apiKey: string;
    protected baseUrl: string = 'https://api.openai.com';
    protected headers: Record<string, string> = { 'Content-Type': 'application/json' };

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
        this.headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    getProvider(): LlmProvider {
        return this.provider;
    }

    getCachedModels(): Model[] | null {
        return this.models;
    }

    async getModels(): Promise<Models> {
        const models = await getModels(this.baseUrl, this.headers);
        this.models = models.data;
        return models;
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
        return createCompletionNonStreaming(this.baseUrl, this.headers, request);
    }

    async createCompletionStreaming(
        request: ChatRequest, 
        chatListener?: (completions: Array<ChatCompletion>) => void): Promise<ChatCompletion> {
        return createCompletionStreaming(this.baseUrl, this.headers, request, chatListener);
    }

    async reactNativeStreamingCompletion(
        request: ChatRequest, 
        customFetch: FetchImplementation,
        chatListener?: (completions: Array<ChatCompletion>) => void    
    ): Promise<ChatCompletion> {
        return reactNativeStreamingCompletion(this.baseUrl, this.headers, request, customFetch, chatListener);
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
        return generateImage(this.baseUrl, this.headers, request);
    };

}

export default OpenAIClient;