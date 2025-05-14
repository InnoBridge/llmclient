import { LlmProvider } from "@/configuration/llm_configurations";
import { Models, Model } from "@/models/response/models";
import { ChatRequest } from "@/models/request/chat_request";
import { ChatCompletion } from "@/models/response/chat_completion";
import { GenerateImageRequest } from "@/models/request/generate_image_request";
import { ImageResponse } from "@/models/response/image_response";

type FetchImplementation = typeof fetch;

export interface LlmProxyClient {
    getProvider(): LlmProvider;
    getCachedModels(): Model[] | null;
    getModels(jwt?: string): Promise<Models>;
    getModel(): Model | null;
    setModel(model: Model): void;
    createCompletion(
        request: ChatRequest, 
        chatListener?: (completions: Array<ChatCompletion>) => void,
        jwt?: string): Promise<ChatCompletion>;
    reactNativeStreamingCompletion(
        request: ChatRequest, 
        customFetch: FetchImplementation,
        chatListener?: (completions: Array<ChatCompletion>) => void,
        jwt?: string): Promise<ChatCompletion>;
    generateImage(request: GenerateImageRequest, jwt?: string): Promise<ImageResponse>;
}