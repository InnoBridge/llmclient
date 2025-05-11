import { LlmClient } from '@/client/llm_client';
import OpenAIClient from '@/client/openai_client';
import { LlmProvider, OllamaConfiguration } from '@/configuration/llm_configurations';
import { chatCompletion } from '@/index';
import { Role, ResponseObject } from '@/models/enums';
import { ChatCompletion, CompletionMessage, CompletionChunk } from '@/models/response/chat_completion';
import { Model } from '@/models/response/models';

const initializeClient = (): LlmClient => {
  try {
    const configuration: OllamaConfiguration =  {
      provider: LlmProvider.OLLAMA,
      baseURL: 'http://localhost:11434',
    };
    const client = new OpenAIClient(configuration);
    return client;
  } catch (error) {
    console.error('Error initializing client:', error);
    throw error;
  }
}

const getProviderTest = async (client: LlmClient) => {
  console.log('Starting getProvider test...');
  try {
    const provider = client.getProvider();
    console.log(`Provider: ${provider}`);
    
    if (provider !== LlmProvider.OLLAMA) {
      throw new Error(`Expected provider to be OPENAI, but got ${provider}`);
    }
    
    console.log('getProvider completed successfully!');
  } catch (error) {
    console.error('getProvider test failed:', error);
    process.exit(1);
  }
}

const getModelsTest = async (client: LlmClient) => {
  console.log('Starting getModels test...');
  
  try {    
    let cachedModels = client.getCachedModels();
    if (cachedModels !== null) {
      throw new Error('Cached model should be null before fetching models');
    }
    const models = await client.getModels();
    console.log(`Found models`);
    models.data.forEach(model => {
      console.log(`Model ID: ${model.id}`);
    });
    cachedModels = client.getCachedModels();
    if (cachedModels !== models.data) {
      throw new Error('Cached model should be equal to fetched models');
    }
    console.log("Cached models ", cachedModels);
    console.log('getModel test completed successfully!');
  } catch (error) {
    console.error('getModel test failed:', error);
    process.exit(1);
  }
}

const getModelTest = async (client: LlmClient) => {
  console.log('Starting getModel test...');
  let model = client.getModel();
  if (model !== null) {
    throw new Error('Model should be null before setting a model');
  }
  const qwen3Model: Model = {
    id: 'qwen3:8b',
    created: 1699999999999,
    object: ResponseObject.MODEL,
    owned_by: 'ollama',
  }
  client.setModel(qwen3Model);
  model = client.getModel();
  if (model !== qwen3Model) {
    throw new Error('Model should be equal to the set model');
  }
  console.log('model', model);
  console.log('getModel test completed successfully!');
}


const createCompletionTest = async (client: LlmClient) => {
  console.log('Creating completion test...');
  
  try {    
    const response = await client.createCompletion({
      model: "qwen3:8b",
      messages: [
        {
          role: Role.USER,
          content: 'Hello, how are you today?'
        }
      ]
    });
    
    console.log('Response:', response);
    console.log('Message ', (response.choices[0] as CompletionMessage).message);

    console.log('Completion test completed successfully!');
  } catch (error) {
    console.error('Completion test failed:', error);
    process.exit(1);
  }
}

const createCompletionStreamingTest = async (client: LlmClient) => {
  console.log('Creating completion streaming test...');
  const listener = (completions: Array<ChatCompletion>) => {
    let streamedResponse = '';
    completions.forEach((completion) => {
      if (completion.choices && completion.choices.length > 0) {
        streamedResponse += (completion.choices[0] as CompletionChunk).delta.content;
      }
    });
    console.log('Streamed response:', streamedResponse);
  };
  try {    
    const response = await client.createCompletion({
      model: "qwen3:8b",
      messages: [
        {
          role: Role.USER,
          content: 'Hello, how are you today?'
        }
      ],
      stream: true,
    }, listener);
  
    console.log("chatCompletionStreaming test completed successfully!");
  } catch (error) {
    console.error('Completion test failed:', error);
    process.exit(1);
  }
}

// Wrap in an immediately invoked async function to use await
(async function main() {
  try {
      // sync test
      const client = initializeClient();

      // promise tests in order
      await getProviderTest(client);
      await getModelsTest(client);
      await getModelTest(client);
      await createCompletionTest(client);
      await createCompletionStreamingTest(client);

      console.log("🎉 All integration tests passed");
  } catch (err) {
      console.error("❌ Integration tests failed:", err);
      process.exit(1);
  }
})();