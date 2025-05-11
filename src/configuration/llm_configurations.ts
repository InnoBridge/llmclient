enum LlmProvider {
    OLLAMA = 'ollama',
    OPENAI = 'openai'
}

interface OllamaConfiguration {
    baseURL: string,
    provider: LlmProvider,
    apiKey?: string,
    organization?: string
}

interface OpenAIConfiguration {
    apiKey: string,
    provider: LlmProvider,
    organization?: string
}

type LlmConfiguration = OllamaConfiguration | OpenAIConfiguration;

export {
    LlmProvider,
    OllamaConfiguration,
    OpenAIConfiguration,
    LlmConfiguration
}