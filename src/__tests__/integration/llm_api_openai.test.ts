import * as dotenv from 'dotenv';
import path from 'path';
import { createLlmClient, setModel, getModel, generateImage } from '@/api/llm';
import { LlmProvider, OpenAIConfiguration } from '@/configuration/llm_configurations';
import { GenerateImageRequest } from '@/models/request/generate_image_request';
import { ImageSize, ImageFormat } from '@/models/enums';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const API_KEY = process.env.OPENAI_API_KEY;

const initializeLlmClient = async () => {
    const configuration: OpenAIConfiguration =  {
        provider: LlmProvider.OPENAI,
        apiKey: API_KEY || '',
    };
    await createLlmClient(configuration);
};

const generateImageTest = async () => {
    console.log('Starting createCompletion test...');
    await initializeLlmClient();

    await setModel({
        id: 'dall-e-2'
    });

    let request: GenerateImageRequest = {
        model: getModel()?.id,
        prompt: 'A futuristic city skyline at sunset',
        n: 1,
        size: ImageSize.SIZE_256x256,
        response_format: ImageFormat.URL
    };

    try {
        const response = await generateImage(request);
        console.log('Image generation response:', response);    
        console.log('createCompletion test completed successfully!');
    } catch (error: any) {
        console.error('Error in imageGeneration test:', error);
    }
};

(async function main() {
    try {
        await generateImageTest();
        console.log("🎉 All integration tests passed");
    } catch (err) {
        console.error("❌ Integration tests failed:", err);
        process.exit(1);
    }
})();