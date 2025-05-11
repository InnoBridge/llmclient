import { LlmClient } from "@/client/llm_client";
import { 
    LlmProvider,
    LlmConfiguration,
    OllamaConfiguration,
    OpenAIConfiguration
} from "@/configuration/llm_configurations";
import OpenAIClient from "@/client/openai_client";
import { Model, Models } from "@/models/response/models";
import { ChatCompletion } from "@/models/response/chat_completion";
import { ChatRequest } from "@/models/request/chat_request";
import { GenerateImageRequest } from "@/models/request/generate_image_request";
import { ImageResponse } from "@/models/response/image_response";

type FetchImplementation = typeof fetch;

let llmClient: LlmClient | null = null;

/**
 * @description Retrieves the available LLM providers
 * @returns {LlmProvider[]} - An array of available LLM providers
 */
const getLlmProviders = (): LlmProvider[] => {
    return Object.values(LlmProvider);
};

/**
 * @description Retrieves the current LLM provider
 * @returns {LlmProvider | null} - The current LLM provider or null if not set
 */
const getLlmProvider = (): LlmProvider | null => {
    if (!llmClient) {
        return null;
    }
    return llmClient.getProvider();
};

/**
 * @description Private method that validates the LLM configuration object
 * @param configuration - LLM configuration object
 * @returns {void}
 * @throws Will throw an error if the configuration is invalid
 */
const validateConfiguration = (configuration: LlmConfiguration): void => {
    // Check if provider exists first
    if (!configuration.provider) {
        throw new Error("LLM provider is required in configuration");
    }
    // Then validate provider-specific requirements
    switch (configuration.provider) {
        case LlmProvider.OPENAI:
            const openaiConfig = configuration as OpenAIConfiguration;
            if (!openaiConfig.apiKey) {
                throw new Error("OpenAI requires an API key");
            }
            break;
        case LlmProvider.OLLAMA:
            const ollamaConfig = configuration as OllamaConfiguration;
            if (!ollamaConfig.baseURL) {
                throw new Error("Ollama requires a base URL");
            }
            break;
        default:
            throw new Error(`Unsupported LLM provider: ${configuration.provider}`);
    }
};

/**
 * @description Creates an LLM client based on the provided configuration
 * @param configuration - LLM configuration object
 * @throws Will throw an error if the configuration is invalid or if the client cannot be created
 * @returns {Promise<void>} - A promise that resolves when the client is created
 */
const createLlmClient = async (configuration: LlmConfiguration) => {
    // Validate the configuration before creating the client
    validateConfiguration(configuration);

    // Create the LLM client based on the provider
    switch (configuration.provider) {
        case LlmProvider.OLLAMA:
        case LlmProvider.OPENAI:
            llmClient = new OpenAIClient(configuration);
            break;
        default:
            llmClient = null;
            throw new Error(`Unsupported LLM provider: ${configuration.provider}`);
    }

    try {
        // Direct call is fine here since we just created the client
        const models = (await llmClient.getModels()).data;
        
        if (!models || models.length === 0) {
            llmClient = null;
            throw new Error(`No models found for ${configuration.provider}`);
        }
    } catch (error: any) {
        // Handle API errors gracefully
        llmClient = null;
        throw new Error(`Failed to fetch models: ${error.message}`);
    }
};

/**
 * @description Clears the cached LLM client instance
 * This is useful for logout flows or when switching configurations
 * @param {void}
 * @returns {void}
 * @throws {void}
 */
const clearLlmClient = (): void => {
    llmClient = null;
};

/**
 * @description Retrieves the available models for the current LLM client
 * @returns {Promise<string[]>} - A promise that resolves to an array of model names
 * @throws Will throw an error if the client is not initialized or if fetching models fails
 */
const getModels = async (): Promise<Models> => {
    if (!llmClient) {
        throw new Error("LLM client not initialized. Call createLlmClient first.");
    }
    return (await llmClient.getModels());
};
/**
 * @description Retrieves the cached models from the LLM client
 * @returns {Model[] | null} - An array of cached models or null if not set
 * @throws Will throw an error if the client is not initialized 
*/
const getCachedModels = (): Model[] | null => {
    if (!llmClient) {
        throw new Error("LLM client not initialized. Call createLlmClient first.");
    }
    return llmClient.getCachedModels();
}

/**
 * @description Retrieves the current model from the LLM client
 * @returns {Model | null} - The current model or null if not set
 * @throws Will throw an error if the client is not initialized 
*/
const getModel = (): Model | null => {
    if (!llmClient) {
        throw new Error("LLM client not initialized. Call createLlmClient first.");
    }
    return llmClient.getModel();
}

/**
 * @description Sets the current model in the LLM client
 * @param {Model} model - The model to set
 * @returns {Promise<void>} - A promise that resolves when the model is set
 * @throws Will throw an error if the client is not initialized or if the model is not found
 */
const setModel = async (model: Model): Promise<void> => {
    if (!llmClient) {
        throw new Error("LLM client not initialized. Call createLlmClient first.");
    };

    let models = getCachedModels() ?? [];
    for (const cachedModel of models) {
        if (cachedModel.id === model.id) {
            llmClient.setModel(cachedModel);
            return;
        }
    }

    // If the model is not found in the cache, fetch models again
    await getModels();
    models = getCachedModels() ?? [];
 
    for (const cachedModel of models) {
        if (cachedModel.id === model.id) {
            llmClient.setModel(cachedModel);
            return;
        }
    }
    throw new Error(`Model ${model.id} not found`);
};


const createCompletion = async (request: ChatRequest, chatListener?: (completions: Array<ChatCompletion>) => void): Promise<ChatCompletion> => {
    if (!llmClient) {
        throw new Error("LLM client not initialized. Call createLlmClient first.");
    }

    // If the caller didn't supply a model, use the one already set in the client
    if (!request.model) {
        const current = getModel();
        if (!current) {
        throw new Error("No model set. Please set the model before calling createCompletion.");
        }
        request.model = current.id;
    }

    return llmClient.createCompletion(request, chatListener);
};

const reactNativeStreamingCompletion = async (
    request: ChatRequest,
    customFetch: FetchImplementation,
    chatListener?: (completions: Array<ChatCompletion>) => void): Promise<ChatCompletion> => {

    if (!llmClient) {
        throw new Error("LLM client not initialized. Call createLlmClient first.");
    }

    // If the caller didn't supply a model, use the one already set in the client
    if (!request.model) {
        const current = getModel();
        if (!current) {
        throw new Error("No model set. Please set the model before calling createCompletion.");
        }
        request.model = current.id;
    }

    return llmClient.reactNativeStreamingCompletion(request, customFetch, chatListener);
};

/**
 * Generates an image based on the provided request.
 * Note: This method currently supports only the OPENAI provider.
 * If the provider is not OPENAI, an error will be thrown.
 * 
 */
const generateImage = async (request: GenerateImageRequest): Promise<ImageResponse> => {
    if (!llmClient) {
        throw new Error("LLM client not initialized. Call createLlmClient first.");
    }

    if (!request.model) {
        const current = getModel();
        if (!current) {
        throw new Error("No model set. Please set the model before calling generateImage.");
        }
        request.model = current.id;
    }

    return llmClient.generateImage(request);
}

export {
    getLlmProviders,
    getLlmProvider,
    createLlmClient,
    clearLlmClient,
    getModels,
    getCachedModels,
    getModel,
    setModel,
    createCompletion,
    reactNativeStreamingCompletion,
    generateImage
};