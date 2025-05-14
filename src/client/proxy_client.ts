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
import { LlmProxyClient } from "./llm_proxy_client";

type FetchImplementation = typeof fetch;

class ProxyClient implements LlmProxyClient {
    private model: Model | null = null;
    private models: Model[] | null = null;
    private provider: LlmProvider;
    protected apiKey: string;
    protected baseUrl: string = 'https://api.openai.com';
    protected proxyUrl: string;
    protected headers: Record<string, string> = { 'Content-Type': 'application/json' };

    constructor(
        proxyUrl: string,
        configuration: OllamaConfiguration | OpenAIConfiguration
    ) {
        if (!configuration.provider) {
            throw new Error("Provider is required in configuration");
        }
        this.provider = configuration.provider;
        this.proxyUrl = proxyUrl;
        if (this.provider === LlmProvider.OLLAMA) {
            const ollamaConfig = configuration as OllamaConfiguration;
            this.baseUrl = ollamaConfig.baseURL || 'http://localhost:11434';
        }
        this.apiKey = configuration.apiKey || '';
        this.headers['x-llm-api-key'] = this.apiKey;
        this.headers['x-llm-base-url'] = this.baseUrl;
    }

    getProvider(): LlmProvider {
        return this.provider;
    }

    getCachedModels(): Model[] | null {
        return this.models;
    }

    async getModels(jwt?: string): Promise<Models> {
        const headers = { ...this.headers };
        if (jwt) {
            headers['Authorization'] = `Bearer ${jwt}`;
        }
        const models = await getModels(this.proxyUrl, headers);
        this.models = models.data;
        return models;
    }

    getModel(): Model | null {
        return this.model;
    }

    setModel(model: Model): void {  
        this.model = model;
    }

    async createCompletion(
        request: ChatRequest, 
        chatListener?: (completions: Array<ChatCompletion>) => void,
        jwt?: string
    ): Promise<ChatCompletion> {
        if (request.stream) {
            return this.createCompletionStreaming(request, chatListener, jwt);
        } else {
            return this.createCompletionNonStreaming(request, jwt);
        }
    }

    async createCompletionNonStreaming(request: ChatRequest, jwt?: string): Promise<ChatCompletion> {
        const headers = { ...this.headers };
        if (jwt) {
            headers['Authorization'] = `Bearer ${jwt}`;
        }
        return createCompletionNonStreaming(this.proxyUrl, headers, request);
    }

    async createCompletionStreaming(
        request: ChatRequest, 
        chatListener?: (completions: Array<ChatCompletion>) => void,
        jwt?: string
    ): Promise<ChatCompletion> {
        const headers = { ...this.headers };
        if (jwt) {
            headers['Authorization'] = `Bearer ${jwt}`;
        }
        return createCompletionStreaming(this.proxyUrl, headers, request, chatListener);
    }

    async reactNativeStreamingCompletion(
        request: ChatRequest, 
        customFetch: FetchImplementation,
        chatListener?: (completions: Array<ChatCompletion>) => void,
        jwt?: string
    ): Promise<ChatCompletion> {
        const headers = { ...this.headers };
        if (jwt) {
            headers['Authorization'] = `Bearer ${jwt}`;
        }
        return reactNativeStreamingCompletion(this.proxyUrl, headers, request, customFetch, chatListener);
    }

    /**
     * Generates an image based on the provided request.
     * 
     * Note: This method currently supports only the OPENAI provider.
     * If the provider is not OPENAI, an error will be thrown.
     */
    async generateImage(request: GenerateImageRequest, jwt?: string): Promise<ImageResponse> {
        if (this.provider !== LlmProvider.OPENAI) {
            throw new Error(`${this.provider} is the only provider that supports image generation.`);
        }
        const headers = { ...this.headers };
        if (jwt) {
            headers['Authorization'] = `Bearer ${jwt}`;
        }
        return generateImage(this.proxyUrl, headers, request);
    };
}

export default ProxyClient;