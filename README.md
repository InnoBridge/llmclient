# LLM Client
A multiplatform library (supports node and react native) for integrating LLM (Large Language Model) functionality into your applications. This library provides tools for managing chat conversations, caching messages, and communicating with LLM APIs.

## Change Log
| Version | Changes |
|---------|---------|
| 0.1.1 | Feature: Added proxy client and API for secure backend communication<ul><li>JWT authentication support for all API methods</li><li>Custom header forwarding (x-llm-api-key, x-llm-base-url)</li><li>Server-side API key protection</li><li>Transparent request routing through backend proxy</li></ul>|
| 0.0.1 | Initial Release: Core functionality<ul><li>Chat management API (create, rename, delete conversations)</li><li>Message caching with SQLite storage</li><li>Direct OpenAI and Ollama provider integration</li><li>React Native streaming compatibility</li></ul> |


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

```typescript
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
```typescript
import { api, enums } from "@innobridge/llmclient";

const { getModels, setModel, reactNativeStreamingCompletion } = api;
const { Role } = enums;
```

Geting a list of models and set the model that you want to use.
```typescript
const models = await getModels();
await setModel({id: "gpt-3.5-turbo"});
```

Creating a completion
```typescript
const completion = createCompletion({
  messages: [{
    content: "Hello, how can I help you?",
    role: Role.USER
  }],
});
```

## Streaming


https://github.com/user-attachments/assets/0177ff2d-fa81-4a7a-9c1d-2f5f4e3b383e


The official OpenAI JavaScript SDK supports streaming completions using Server-Sent Events (SSE), but this approach is not compatible with React Native environments because the network client used by OpenAI's SDK is not available in React Native.

Challenge: React Native doesn't natively support the SSE network clients that are available in Node.js environments.

Solution: Our reactNativeStreamingCompletion API addresses this compatibility issue by:

- Accepting the expo-fetch client as a parameter
- Handling the SSE protocol implementation internally
- Providing a callback mechanism to receive streaming tokens

[Streaming Implementation](https://github.com/InnoBridge/reactnativegpt/blob/main/components/ChatPage.tsx#L123C1-L139C12)
```typescript
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

# Proxy LLM API
The Proxy LLM API allows you to route LLM requests through your own backend proxy server instead of connecting directly to LLM providers. 

Your backend proxy server serves your LLM endpoint, perform authentication, or your computation then routes the client request to provider/your LLM servers.

The Proxy LLM API has the same functionality as the LLM API above. The difference is that you need to provide the url of your backend proxy server.

## Setup
```typescript
import { configuration as config, proxyApi } from "@innobridge/llmclient";

const { createLlmClient } = proxyApi;

// Configure your LLM client to use a proxy
const llmConfiguration = {
  apiKey: 'your-api-key',  // Will be sent as x-llm-api-key header
  baseUrl: 'url-of-your-llm-server',
  provider: config.LlmProvider.OLLAMA
} as config.OpenAIConfiguration;

// Initialize with proxy URL
const PROXY_URL = 'https://your-proxy-server.com/';
await createLlmClient(PROXY_URL, llmConfiguration);
```

For example if you are making a call for chat completion.

```typescript
import { proxyApi } from "@innobridge/llmclient";

const { getModels, createCompletion } = proxyApi;

// Pass JWT token in API calls
const jwt = 'your-jwt-token';
const models = await getModels(jwt);

// Use JWT for completions
const completion = await createCompletion({
  messages: [{
    content: "Hello, how can you help me?",
    role: Role.USER
  }]
}, undefined, jwt);
```

The client will send a get request to
`https://your-proxy-server.com/v1/chat/completions`
with header

| Header | Description |
|--------|-------------|
| `Content-Type` | Standard JSON content type |
| `Authorization` | JWT authentication token (optional) |
| `x-llm-api-key` | API key for the LLM provider |
| `x-llm-base-url` | Base URL of the LLM provider's API |

The jwt token is optional, and you define the logic of how you route client request to your llm server based on `x-llm-api-key` and `x-llm-base-url`.

# Message Cache
Is implemented by passing in `expo-sqllite` from react native;

Initialize Message Cache
```typescript
import { cachedChatsApi, databaseClient } from "@innobridge/llmclient";
import * as SQLite from 'expo-sqlite';

const { ExpoSQLiteAdapter } = databaseClient;
const { initializeChatsCache } = cachedChatsApi;

...

const db = await SQLite.openDatabaseAsync('chats.db');
const dbAdapter = new ExpoSQLiteAdapter(db);
await initializeChatsCache(dbAdapter);
```

usage
```typescript
import { cachedChatsApi } from "@innobridge/llmclient";
const { getChats, renameChat, deleteChat } = cachedChatsApi;
...
const result = (await getChats()) as Chat[];
await renameChat(chatId, newName);
await deleteChat(chatId);
```

# Local development
In current repo(llmclient) run
```bash
npm run build
npm pack
```

In consuming repo run to consume the tar package
```bash
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
