/**
 * Venice AI Client for Embeddings and Chat Completion
 * Handles API communication with Venice AI services with optimized model selection
 */

const VENICE_API_BASE = 'https://api.venice.ai/api/v1';
const VENICE_API_KEY = process.env.NEXT_PUBLIC_VENICE_API_KEY;

// Debug logging for development
if (process.env.NODE_ENV === 'development') {
  console.log('🔑 Venice API Key (NEXT_PUBLIC_VENICE_API_KEY) configured:', VENICE_API_KEY ? `${VENICE_API_KEY.slice(0, 8)}...` : 'NOT SET');
}

if (!VENICE_API_KEY) {
  console.warn('NEXT_PUBLIC_VENICE_API_KEY not found in environment variables');
}

// Venice AI Model Configuration based on actual API response
export const VENICE_MODELS = {
  // Most cost-effective for high-frequency tasks (embeddings, simple operations)
  FASTEST: {
    id: 'llama-3.2-3b',
    name: 'Llama 3.2 3B',
    pricing: { input: 0.15, output: 0.6, diem: 0.15 }, // USD per 1M tokens
    context: 131072,
    capabilities: ['function_calling', 'web_search'],
    traits: ['fastest'],
    bestFor: ['embeddings', 'simple_chat', 'sentiment_analysis', 'keyword_extraction']
  },
  // Cost-optimized with reasoning for complex tasks
  SMALL: {
    id: 'qwen3-4b',
    name: 'Venice Small',
    pricing: { input: 0.15, output: 0.6, diem: 0.15 },
    context: 32768,
    capabilities: ['function_calling', 'reasoning', 'web_search'],
    traits: [],
    bestFor: ['simple_reasoning', 'basic_analysis', 'embeddings_fallback']
  },
  // Balanced performance with vision capabilities
  MEDIUM: {
    id: 'mistral-31-24b',
    name: 'Venice Medium',
    pricing: { input: 0.5, output: 2.0, diem: 0.5 },
    context: 131072,
    capabilities: ['function_calling', 'vision', 'web_search'],
    traits: ['default_vision'],
    bestFor: ['vision_tasks', 'image_analysis', 'large_context']
  },
  // Specialized reasoning model for DeFi analysis
  REASONING: {
    id: 'qwen-2.5-qwq-32b',
    name: 'Venice Reasoning',
    pricing: { input: 0.5, output: 2.0, diem: 0.5 },
    context: 32768,
    capabilities: ['reasoning', 'web_search'],
    traits: [],
    bestFor: ['defi_recommendations', 'complex_analysis', 'market_research']
  },
  // Default balanced option with function calling
  DEFAULT: {
    id: 'llama-3.3-70b',
    name: 'Llama 3.3 70B',
    pricing: { input: 0.7, output: 2.8, diem: 0.7 },
    context: 65536,
    capabilities: ['function_calling', 'web_search'],
    traits: ['function_calling_default', 'default'],
    bestFor: ['general_purpose', 'function_calling']
  },
  // High-performance for complex reasoning tasks
  LARGE: {
    id: 'qwen3-235b',
    name: 'Venice Large',
    pricing: { input: 1.5, output: 6.0, diem: 1.5 },
    context: 131072,
    capabilities: ['function_calling', 'reasoning', 'web_search'],
    traits: [],
    bestFor: ['complex_reasoning', 'high_accuracy', 'detailed_analysis']
  },
  // Premium reasoning model for advanced analysis
  PREMIUM_REASONING: {
    id: 'deepseek-r1-671b',
    name: 'DeepSeek R1 671B',
    pricing: { input: 3.5, output: 14.0, diem: 3.5 },
    context: 131072,
    capabilities: ['reasoning', 'web_search'],
    traits: ['default_reasoning'],
    bestFor: ['advanced_reasoning', 'research', 'complex_problem_solving']
  },
  // Vision-specialized model for image tasks
  VISION: {
    id: 'qwen-2.5-vl',
    name: 'Qwen 2.5 VL 72B',
    pricing: { input: 0.7, output: 2.8, diem: 0.7 },
    context: 32768,
    capabilities: ['vision', 'web_search'],
    traits: [],
    bestFor: ['image_analysis', 'visual_content', 'chart_analysis']
  },
  // Code-optimized model
  CODER: {
    id: 'qwen-2.5-coder-32b',
    name: 'Qwen 2.5 Coder 32B',
    pricing: { input: 0.5, output: 2.0, diem: 0.5 },
    context: 32768,
    capabilities: ['code_optimization'],
    traits: ['default_code'],
    bestFor: ['code_generation', 'code_analysis', 'technical_documentation']
  },
  // Most intelligent model for complex tasks
  PREMIUM: {
    id: 'llama-3.1-405b',
    name: 'Llama 3.1 405B',
    pricing: { input: 1.5, output: 6.0, diem: 1.5 },
    context: 65536,
    capabilities: ['web_search'],
    traits: ['most_intelligent'],
    bestFor: ['highest_accuracy', 'complex_understanding']
  },
  // Uncensored model for creative tasks
  UNCENSORED: {
    id: 'venice-uncensored',
    name: 'Venice Uncensored 1.1',
    pricing: { input: 0.5, output: 2.0, diem: 0.5 },
    context: 32768,
    capabilities: ['web_search'],
    traits: [],
    bestFor: ['creative_content', 'social_posts', 'uncensored_responses']
  },
  // Lightweight coder model
  CODER_LITE: {
    id: 'deepseek-coder-v2-lite',
    name: 'DeepSeek Coder V2 Lite',
    pricing: { input: 0.5, output: 2.0, diem: 0.5 },
    context: 131072,
    capabilities: ['code_optimization'],
    traits: [],
    bestFor: ['lightweight_coding', 'code_review', 'simple_code_tasks']
  }
} as const;

// Task-based model selection with cost optimization
// NOTE: This is ONLY for chat completions. Embeddings always use text-embedding-bge-m3
export type TaskType = 
  | 'embeddings' // Note: Ignored for embeddings - always uses text-embedding-bge-m3
  | 'simple_chat' 
  | 'defi_recommendations' 
  | 'sentiment_analysis'
  | 'vision_tasks'
  | 'image_generation'
  | 'image_analysis'
  | 'complex_reasoning'
  | 'general_purpose'
  | 'code_tasks'
  | 'keyword_extraction'
  | 'social_posts'
  | 'market_research'
  | 'creative_content';

export function selectOptimalModel(taskType: TaskType, prioritizeCost: boolean = true) {
  // Cost-optimized model selection based on Diem pricing and capabilities
  // NOTE: This function is ONLY used for chat completions, NOT embeddings
  const costOptimizedMap: Record<TaskType, keyof typeof VENICE_MODELS> = {
    embeddings: 'FASTEST', // NOTE: This is never used - embeddings always use text-embedding-bge-m3
    keyword_extraction: 'FASTEST', // Simple extraction task (0.15 Diem)
    sentiment_analysis: 'FASTEST', // Simple classification (0.15 Diem)
    simple_chat: 'SMALL', // Basic interactions with reasoning (0.15 Diem)
    defi_recommendations: 'REASONING', // Complex analysis with web search (0.5 Diem)
    market_research: 'REASONING', // Market analysis with web search (0.5 Diem)
    vision_tasks: 'MEDIUM', // Vision capabilities required (0.5 Diem)
    image_generation: 'VISION', // Specialized vision model (0.7 Diem)
    image_analysis: 'VISION', // Image understanding (0.7 Diem)
    code_tasks: 'CODER_LITE', // Lightweight coding tasks (0.5 Diem)
    complex_reasoning: 'REASONING', // Reasoning-optimized (0.5 Diem)
    social_posts: 'UNCENSORED', // Creative content generation (0.5 Diem)
    creative_content: 'UNCENSORED', // Creative writing (0.5 Diem)
    general_purpose: 'DEFAULT' // Balanced option (0.7 Diem)
  };

  // Performance-optimized model selection (when cost is not priority)
  // NOTE: This function is ONLY used for chat completions, NOT embeddings
  const performanceOptimizedMap: Record<TaskType, keyof typeof VENICE_MODELS> = {
    embeddings: 'SMALL', // NOTE: This is never used - embeddings always use text-embedding-bge-m3
    keyword_extraction: 'SMALL',
    sentiment_analysis: 'SMALL',
    simple_chat: 'DEFAULT', // Better general performance
    defi_recommendations: 'PREMIUM_REASONING', // Best reasoning for financial decisions
    market_research: 'PREMIUM_REASONING', // Advanced research capabilities
    vision_tasks: 'VISION', // Specialized vision model
    image_generation: 'VISION',
    image_analysis: 'VISION',
    code_tasks: 'CODER', // Full-featured code model
    complex_reasoning: 'PREMIUM_REASONING', // Best reasoning capabilities
    social_posts: 'LARGE', // High-quality creative content
    creative_content: 'LARGE', // High-quality creative writing
    general_purpose: 'LARGE' // High performance
  };

  const selectedMap = prioritizeCost ? costOptimizedMap : performanceOptimizedMap;
  const selectedModelKey = selectedMap[taskType];
  return VENICE_MODELS[selectedModelKey];
}

export interface VeniceEmbeddingRequest {
  input: string | string[];
  model: string;
  encoding_format?: 'float' | 'base64';
  dimensions?: number;
  user?: string;
}

export interface VeniceEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface VeniceChatRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  // Venice-specific parameters
  venice_parameters?: {
    enable_web_search?: 'on' | 'off';
    enable_web_citations?: boolean;
    include_search_results_in_stream?: boolean;
  };
}

export interface VeniceChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  // Venice-specific response fields
  venice_parameters?: {
    web_search_citations?: Array<{
      title: string;
      url: string;
      snippet: string;
    }>;
  };
}

export interface VeniceImageRequest {
  prompt: string;
  model?: string;
  size?: string;
  quality?: string;
  n?: number;
}

export interface VeniceImageResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

class VeniceAIClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || VENICE_API_KEY || '';
    this.baseUrl = VENICE_API_BASE;
    
    if (!this.apiKey) {
      throw new Error('Venice AI API key is required');
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Venice AI API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Generate embeddings for text input using Venice AI's dedicated embeddings endpoint
   * Uses the text-embedding-bge-m3 model as specified in Venice AI documentation
   * 
   * Note: Embeddings always use the dedicated text-embedding-bge-m3 model.
   * The taskType parameter is ignored for embeddings - it's only used for chat completions.
   */
  async createEmbedding(
    input: string | string[],
    taskType?: TaskType // Optional and ignored - embeddings always use text-embedding-bge-m3
  ): Promise<VeniceEmbeddingResponse> {
    console.log(`🧠 Creating embedding with Venice AI text-embedding-bge-m3 model`);
    
    // Validate input
    if (!input || (Array.isArray(input) && input.length === 0)) {
      throw new Error('Input cannot be empty');
    }
    
    if (typeof input === 'string' && input.trim().length === 0) {
      throw new Error('Input string cannot be empty');
    }

    // Embeddings ALWAYS use the dedicated embedding model - no model selection needed
    const request: VeniceEmbeddingRequest = {
      input,
      model: 'text-embedding-bge-m3', // Venice AI's ONLY embedding model
      encoding_format: 'float', // Explicitly specify float format as per API docs
    };

    try {
      const response = await this.makeRequest<VeniceEmbeddingResponse>('/embeddings', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      // Validate response structure
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        throw new Error('Invalid response structure from Venice AI embeddings API');
      }

      // Validate embedding data
      const firstEmbedding = response.data[0];
      if (!firstEmbedding.embedding || !Array.isArray(firstEmbedding.embedding)) {
        throw new Error('Invalid embedding data in response');
      }

      console.log(`✅ Successfully created embedding with ${firstEmbedding.embedding.length} dimensions`);
      
      return response;
    } catch (error) {
      console.error(`❌ Venice AI embeddings endpoint failed:`, error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('Venice AI API authentication failed. Please check your API key.');
        } else if (error.message.includes('429')) {
          throw new Error('Venice AI API rate limit exceeded. Please try again later.');
        } else if (error.message.includes('400')) {
          throw new Error('Invalid request to Venice AI API. Please check your input.');
        }
      }
      
      throw new Error(`Failed to create embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate chat completion with optimized model selection
   */
  async createChatCompletion(
    messages: VeniceChatRequest['messages'],
    options: Partial<VeniceChatRequest> & { 
      taskType?: TaskType;
      prioritizeCost?: boolean;
    } = {}
  ): Promise<VeniceChatResponse> {
    const { taskType = 'general_purpose', prioritizeCost = true, ...requestOptions } = options;
    const selectedModel = selectOptimalModel(taskType, prioritizeCost);
    
    console.log(`🤖 Chat completion with ${selectedModel.name} (${selectedModel.id}) - Cost: $${selectedModel.pricing.input}/$${selectedModel.pricing.output} per 1M tokens`);
    
    const request: VeniceChatRequest = {
      model: selectedModel.id,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      ...requestOptions,
    };

    try {
      return await this.makeRequest<VeniceChatResponse>('/chat/completions', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      // Fallback to default model if the optimized model fails
      console.warn(`⚠️ Chat completion failed with ${selectedModel.id}, trying fallback...`);
      const fallbackRequest = { ...request, model: VENICE_MODELS.DEFAULT.id };
      return this.makeRequest<VeniceChatResponse>('/chat/completions', {
        method: 'POST',
        body: JSON.stringify(fallbackRequest),
      });
    }
  }

  /**
   * Generate image using Venice AI's dedicated image generation endpoint
   */
  async createImage(
    prompt: string,
    options: {
      model?: string;
      width?: number;
      height?: number;
      format?: 'jpeg' | 'png' | 'webp';
      cfg_scale?: number;
      negative_prompt?: string;
      safe_mode?: boolean;
      hide_watermark?: boolean;
      taskType?: TaskType;
    } = {}
  ): Promise<VeniceImageResponse> {
    const { taskType = 'image_generation', ...imageOptions } = options;
    
    console.log(`🎨 Generating image with Venice AI image generation model`);

    try {
      // Use Venice AI's dedicated image generation endpoint
      const request = {
        prompt,
        model: imageOptions.model || 'hidream', // Default Venice AI image model
        width: imageOptions.width || 1024,
        height: imageOptions.height || 1024,
        format: imageOptions.format || 'webp',
        cfg_scale: imageOptions.cfg_scale || 7.5,
        negative_prompt: imageOptions.negative_prompt || 'blurry, low quality, distorted',
        safe_mode: imageOptions.safe_mode !== false, // Default to true
        hide_watermark: imageOptions.hide_watermark || false,
        return_binary: false, // Return base64 encoded
        embed_exif_metadata: false,
      };

      const response = await this.makeRequest<any>('/image/generate', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      // Transform Venice AI response to match expected format
      return {
        created: Date.now(),
        data: [{
          b64_json: response.image_base64 || response.data,
          revised_prompt: prompt
        }]
      };
    } catch (error) {
      console.warn(`⚠️ Venice AI image generation failed, using chat-based image description...`);
      
      // Fallback: Generate detailed image description for social media
      const response = await this.createChatCompletion(
        [
          {
            role: 'system',
            content: `You are an expert social media content creator. Generate a detailed, engaging description for an image that would accompany a social media post about DeFi trading.
            
            Focus on:
            - Visual elements that convey success and professionalism
            - DeFi/crypto themes and symbols
            - Engaging colors and composition
            - Social media friendly aesthetics
            
            Return a JSON object with:
            {
              "description": "Detailed image description",
              "alt_text": "Accessibility-friendly alt text",
              "suggested_hashtags": ["hashtag1", "hashtag2"]
            }`
          },
          {
            role: 'user',
            content: `Generate image description for: "${prompt}"`
          }
        ],
        {
          taskType: 'creative_content',
          temperature: 0.8,
          max_tokens: 500
        }
      );

      const content = response.choices[0]?.message?.content || '';
      
      try {
        const imageData = JSON.parse(content);
        return {
          created: Date.now(),
          data: [{
            url: undefined, // No actual image generated
            b64_json: undefined,
            revised_prompt: imageData.description || prompt
          }]
        };
      } catch (parseError) {
        return {
          created: Date.now(),
          data: [{
            url: undefined,
            b64_json: undefined,
            revised_prompt: `Generated description for: ${prompt}`
          }]
        };
      }
    }
  }
}

// Export singleton instance
export const veniceClient = new VeniceAIClient();

// Export class for testing
export { VeniceAIClient };