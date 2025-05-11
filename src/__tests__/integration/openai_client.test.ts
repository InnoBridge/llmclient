import * as dotenv from 'dotenv';
import path from 'path';
import { OpenAIConfiguration, LlmProvider, OllamaConfiguration } from '@/configuration/llm_configurations';
import { LlmClient } from '@/client/llm_client';
import OpenAIClient from '@/client/openai_client';
import { GenerateImageRequest } from '@/models/request/generate_image_request';
import { ImageSize, ImageQuality, ImageFormat } from '@/models/enums';
import { Model } from '@/models/response/models';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const API_KEY = process.env.OPENAI_API_KEY;

const initializeClient = (): LlmClient => {
    try {
        const configuration: OpenAIConfiguration =  {
            provider: LlmProvider.OPENAI,
            apiKey: API_KEY || '',
        };
        const client = new OpenAIClient(configuration);
        return client;
    } catch (error) {
        console.error('Error initializing client:', error);
        throw error;
    }
};

const imageGenerationProviderValidation = async (): Promise<void> => {
    const configuration: OllamaConfiguration =  {
        provider: LlmProvider.OLLAMA,
        baseURL: 'http://localhost:11434'
    };
    const ollamaClient = new OpenAIClient(configuration);

    try {
        const models = await ollamaClient.getModels();
        const model = models.data.find(m => m.id === 'dall-e-2') as Model;
    
        const request: GenerateImageRequest = {
            model: ollamaClient.getModel()?.id,
            prompt: 'A futuristic city skyline at sunset',
            n: 1,
            size: ImageSize.SIZE_256x256,
            response_format: ImageFormat.URL
        };
        const response = await ollamaClient.generateImage(request);
    } catch (error: any) {
        console.log('Error in imageGenerationProviderValidation:', error.message);
    }
}

const generateImageTest = async (client: LlmClient): Promise<void> => {
    console.log('Starting generateImage test...');
    const models = await client.getModels();
    const model = models.data.find(m => m.id === 'dall-e-2') as Model;
    client.setModel(model);

    const request: GenerateImageRequest = {
        model: client.getModel()?.id,
        prompt: 'A futuristic city skyline at sunset',
        n: 1,
        size: ImageSize.SIZE_256x256,
        response_format: ImageFormat.URL
    };
    try {
        const response = await client.generateImage(request);
        console.log('Image generation response:', response);
        console.log('generateImage test completed successfully!');
    } catch (error: any) {
        console.error('Error in generateImage test:', error);
    }
};

(async function main() {
    try {
        // sync test
        const client = initializeClient();

        // promise tests in order
        await imageGenerationProviderValidation();
        await generateImageTest(client);

        console.log("🎉 All integration tests passed");
    } catch (err) {
        console.error("❌ Integration tests failed:", err);
        process.exit(1);
    }
})();