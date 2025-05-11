import {
    getLlmProviders,
    getLlmProvider,
    createLlmClient,
    getModels,
    getModel,
    getCachedModels,
    clearLlmClient,
    setModel,
    createCompletion
} from "@/api/llm";
import { 
    LlmProvider, 
    OllamaConfiguration 
} from "@/configuration/llm_configurations";
import { Role } from "@/models/enums";
import { ChatRequest } from "@/models/request/chat_request";
import { CompletionMessage, ChatCompletion, CompletionChunk } from "@/models/response/chat_completion";

const initializeLlmClient = async () => {
    const configuration: OllamaConfiguration =  {
        provider: LlmProvider.OLLAMA,
        baseURL: 'http://localhost:11434',
    };
    await createLlmClient(configuration);
}

const getLlmProvidersTest = () => {
    console.log('Starting getLlmProviders test...');
    const providers = getLlmProviders();
 
    if (JSON.stringify(providers) !== JSON.stringify(Object.values(LlmProvider))) {
        throw new Error('Expected providers to be LlmProvider, but got ' + providers);
    }

    console.log('Available LLM Providers:', providers);
    console.log('getLlmProviders test completed successfully!');
};

const getLlmProviderTest = async () => {
    console.log('Starting getLlmProvider test...');
    let provider = getLlmProvider();
    if (provider !== null) {
        throw new Error('Expected provider to be null, but got ' + provider);
    }
    console.log("Provider ", provider);
    await initializeLlmClient();
    provider = getLlmProvider();
    if (provider !== LlmProvider.OLLAMA) {
        throw new Error('Expected provider to be OLLAMA, but got ' + provider);
    }
    console.log('Provider:', provider);
    console.log('getLlmProvider test completed successfully!');
    clearLlmClient();
};

const createLlmClientText = async () => {
    console.log('Starting createLlmClient test...');
    let models;
    try {
        models = await getModels();
    } catch (error: any) {
        console.log('Error fetching models:', error.message);
    }
    await initializeLlmClient();
    models = await getModels();
    console.log('Found models', models);
    console.log("createLlmClient test completed successfully!");
    clearLlmClient();
};

const getModelsTest = async () => {
    console.log('Starting getModels test...');
    let models
    try {
        models = await getModels();
        console.log('Found models', models);        
    } catch (error: any) {
        console.log('Error fetching models:', error.message);
    };
    await initializeLlmClient();
    models = await getModels();
    console.log('Found models', models);
    console.log('getModels test completed successfully!');
    clearLlmClient();
};

const getCachedModelsTest = async () => {
    console.log('Starting getCachedModels test...');
    let models;
    try {
        models = getCachedModels();
    } catch (error: any) {
        console.log('Error fetching cached models:', error.message);
    };
    await initializeLlmClient();
    models = getCachedModels();
    console.log('Cached models', models);
    console.log('getCachedModels test completed successfully!');
    clearLlmClient();
}

const getModelTest = async () => {
    console.log('Starting getModel test...');
    let model = null;
    try {
        model = getModel();
    } catch (error: any) {
        console.log('Error fetching model:', error.message);
    };
    await initializeLlmClient();
    model = getModel();
    if (model !== null) {
        throw new Error('Expected model to be null, but got ' + model);
    }
    console.log('Model', model);
    const models = await getModels();
    await setModel(models.data[0]);
    model = getModel();
    if (model !== models.data[0]) {
        throw new Error('Expected model to be ' + models.data[0] + ', but got ' + model);
    };
    console.log('getModel test completed successfully!');
    clearLlmClient();
};

const setModelTest = async () => {
    console.log('Starting setModel test...');
    await initializeLlmClient();
    console.log("Get model before setting the model: ", getModel());
    await setModel({
        id: 'qwen3:8b'
    });
    console.log("Get model after setting the model: ", getModel());
    
    try {
        await setModel({
            id: 'non-existing-model'
        });
    } catch (error: any) {
        console.log('Error setting model:', error.message);
    };
    clearLlmClient();
};

const createCompletionTest = async () => {
    console.log('Starting createCompletion test...');
    await initializeLlmClient();
    let request:ChatRequest = {
        messages: [
            {
                role: Role.USER,
                content: 'Hello, how are you today?'
            }
        ]
    };

    // 1) should throw if no model set
    try {
        await createCompletion(request);
    } catch (error: any) {
        console.log('Error creating completion:', error.message);
    }

    // 2) explicit model override in request
    request.model = 'qwen3:8b';
    let response = await createCompletion(request);
    if (response.model === request.model) {
        console.log(`response with ${request.model}: ${(response.choices[0] as CompletionMessage).message.content}`);
    } else {
        throw new Error(`Expected model to be ${request.model} but got ${response.model}`);
    }
    request = {
        messages: [
            {
                role: Role.USER,
                content: 'Hello, how are you today?'
            }
        ]
    };

    // 3) default‐to‐client‐model after setModel
    setModel({ id: 'qwen2.5-coder:7b' });
    response = await createCompletion(request);
    if (response.model === getModel()?.id) {
        console.log(`response with ${getModel()?.id}}: ${(response.choices[0] as CompletionMessage).message.content}`);
    } else {
        throw new Error(`Expected model to be ${getModel()?.id} but got ${response.model}`);
    }
    
    // 4) override again in request
    request.model = 'qwen3:8b';
    response = await createCompletion(request);
    if (response.model === request.model) {
        console.log(`response with ${request.model}: ${(response.choices[0] as CompletionMessage).message.content}`);
    } else {
        throw new Error(`Expected model to be ${request.model} but got ${response.model}`);
    }

    console.log('createCompletion test completed successfully!');
    clearLlmClient();
}

const createCompletionStreamTest = async () => {
    console.log('Starting createCompletionStream test...');
    await initializeLlmClient();
    let request:ChatRequest = {
        messages: [
            {
                role: Role.USER,
                content: 'Hello, how are you today?'
            }
        ]
    };


    request.model = 'qwen3:8b';
    request.stream = true;

    const listener = (completions: Array<ChatCompletion>) => {
        let streamedResponse = '';
        completions.forEach((completion) => {
          if (completion.choices && completion.choices.length > 0) {
            streamedResponse += (completion.choices[0] as CompletionChunk).delta.content;
          }
        });
        console.log('Streamed response:', streamedResponse);
    };

    await createCompletion(request, listener)

    console.log('createCompletionStream test completed successfully!');
    clearLlmClient();
}

(async function main() {
    try {
        // sync test
        getLlmProvidersTest();

        // promise tests in order
        await getLlmProviderTest();
        await createLlmClientText();
        await getModelsTest();
        await getCachedModelsTest();
        await getModelTest();
        await setModelTest();
        await createCompletionTest();
        await createCompletionStreamTest();
        console.log("🎉 All integration tests passed");
    } catch (err) {
        console.error("❌ Integration tests failed:", err);
        process.exit(1);
    }
})();