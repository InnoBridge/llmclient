import { Models } from "@/models/response/models";
import { ChatRequest } from "@/models/request/chat_request";
import { ChatCompletion } from "@/models/response/chat_completion";
import { GenerateImageRequest } from "@/models/request/generate_image_request";
import { ImageResponse } from "@/models/response/image_response";
import { LlmClient } from "@/client/llm_client";

type FetchImplementation = typeof fetch;

export interface LlmProxyClient extends LlmClient {
    getModels(jwt?: string): Promise<Models>;
    createCompletion(
        request: ChatRequest, 
        chatListener?: (completions: Array<ChatCompletion>,
        jwt?: string
        ) => void): Promise<ChatCompletion>;
    reactNativeStreamingCompletion(
        request: ChatRequest, 
        customFetch: FetchImplementation,
        chatListener?: (completions: Array<ChatCompletion>,
        jwt?: string
        ) => void): Promise<ChatCompletion>;
    generateImage(request: GenerateImageRequest, jwt?: string): Promise<ImageResponse>;
}