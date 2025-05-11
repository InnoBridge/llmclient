# LLM Client
A multiplatform library (supports node and react native) for integrating LLM (Large Language Model) functionality into your applications. This library provides tools for managing chat conversations, caching messages, and communicating with LLM APIs.
## Features
- Message caching with SQLite storage
- Chat management (create, rename, delete)
- Integration with LLM APIs
- Support for React Native applications

## Installation
```
npm install @innobridge/llmclient
```

# LLMClient
LLMClient is a SDK that allows your application to communicate with your LLM. 
Currently supported LLM providers:
- [x] [OpenAI](https://platform.openai.com/docs/api-reference/)
- [x] [Ollama](https://ollama.com/)

LLMClient employs module-level caching (singleton pattern), which means once your LLM client is configured, it remains available throughout your application without requiring re-initialization. This approach improves performance and ensures consistent state management across different parts of your application.

LLMClient provides the following set of APIs:
- `getLlmProviders`: Returns a list of all available LLM providers supported by the library.
- `getLlmProvider`: Returns the provider that you configure for your llm client, returns null when your llm client is not configured.
- `createLlmClient`: Initializes and configures your LLM client.
- `clearLlmClient`: Clears the cached LLM client instance, useful when you need to change provider or cleanup the client on logout.
- `getModels`: Fetches the list of available models from the configured LLM provider.
- `getCachedModels`: Returns previously fetched models from cache without making a new API call.
- `getModel`: Gets the currently selected model that will be used for completions or image generation.
- `setModel`: Sets the model to be used for subsequent completion or image generation requests.
- `createCompletion`: Generates a text completion based on provided messages or prompts.
- `reactNativeStreamingCompletion`: Performs streaming completion specifically optimized for React Native environments.
- `generateImage`: Creates an image based on a text prompt (available with providers that support image generation).

## Setup
First we need to configure your llm client

```
import { configuration as config, api } from "@innobridge/llmclient";

const { createLlmClient } = api;

// If using ollama
// const llmConfiguration = 
// {
//  baseUrl: 'http://localhost:11434',
//  provider: config.LlmProvider.OLLAMA
// } as config.OllamaConfiguration;

const llmConfiguration = 
{
  apiKey: 'openai-api-key',
  provider: config.LlmProvider.OPENAI,
} as config.OpenAIConfiguration;

await createLlmClient(llmConfiguration);
```

## Usage
```
import { api, enums } from "@innobridge/llmclient";

const { getModels, setModel, reactNativeStreamingCompletion } = api;
const { Role } = enums;
```

Geting a list of models and set the model that you want to use.
```
const models = await getModels();
await setModel({id: "gpt-3.5-turbo"});
```

Creating a completion
```
const completion = createCompletion({
  messages: [{
    content: "Hello, how can I help you?",
    role: Role.USER
  }],
});
```

## Streaming
The official OpenAI JavaScript SDK supports streaming completions using Server-Sent Events (SSE), but this approach is not compatible with React Native environments because the network client used by OpenAI's SDK is not available in React Native.

Challenge: React Native doesn't natively support the SSE network clients that are available in Node.js environments.

Solution: Our reactNativeStreamingCompletion API addresses this compatibility issue by:

- Accepting the expo-fetch client as a parameter
- Handling the SSE protocol implementation internally
- Providing a callback mechanism to receive streaming tokens

[Streaming Implementation](https://github.com/InnoBridge/reactnativegpt/blob/main/components/ChatPage.tsx#L123C1-L139C12)
```
import { fetch } from 'expo/fetch';
const { chatRequest, chatCompletion } = api;


        const chatRequest: chatRequest.ChatRequest = {
            messages: [{
              content: "Hello, how can I help you?",
              role: Role.USER
              }],
            stream: true   
        };

        try {
            // Track streaming response outside React state
            let streamedContent = '';

            const listener = (completions: Array<chatCompletion.ChatCompletion>) => {
                const chunk = (completions[0].choices[0] as chatCompletion.CompletionChunk).delta.content;
                if (chunk === null) return;
                streamedContent += chunk;
                console.log(streamedContent);
            };

            await reactNativeStreamingCompletion(chatRequest, fetch as unknown as typeof globalThis.fetch, listener);
        } catch (error) {
            Alert.alert('Error', 'Failed to get completion: ' + error);
        } 
```


# Message Cache
Is implemented by passing in `expo-sqllite` from react native;

Initialize Message Cache
```
import { messageCache, databaseClient } from "@innobridge/llmclient";
import * as SQLite from 'expo-sqlite';

const { ExpoSQLiteAdapter } = databaseClient;
const { initializeMessageCache } = messageCache;

...

const db = await SQLite.openDatabaseAsync('chats.db');
const dbAdapter = new ExpoSQLiteAdapter(db);
await initializeMessageCache(dbAdapter);
```

usage
```
import { messageCache } from "@innobridge/llmclient";
const { getChats, renameChat, deleteChat } = messageCache;
...
const result = (await getChats()) as Chat[];
await renameChat(chatId, newName);
await deleteChat(chatId);
```

# Local development
In current repo(llmclient) run
```
npm run build
npm pack
```

In consuming repo run to consume the tar package
```
npm install {relative path}/llmclient/innobridge-llmclient-0.0.0.tgz
```

## Integration test
To run integration test, put your integration test file in the `integration` folder
```
src
├── __tests__
│   ├── dummy.test.ts
│   └── integration
│       ├── llm_api.test.ts
│       └── ollama_client.test.ts
```

and run 
```bash
npm run test:integration --file=<file-name>
```

eg
```bash
npm run test:integration --file=llm_api.test.ts
```