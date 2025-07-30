"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppState,
  JournalEntry,
  DeFiRecommendation,
  CompletedTrade,
  SocialPost,
} from "@/types";
import { STORAGE_KEYS } from "./constants";
import { generateId } from "./utils";

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      walletAddress: null,
      connectedChain: null,
      walletType: null,
      paraWallet: {
        isConnected: false,
        address: null,
        authMethod: null,
        walletIds: null,
        isLoading: false,
        error: null,
      },
      journalEntries: [],
      embeddings: [],
      tradeHistory: [],
      preferences: {
        theme: "system",
        defaultSlippage: 0.5,
        autoGeneratePosts: true,
      },
      currentRecommendations: [],
      activeOrders: [],
      isLoading: false,
      error: null,

      // Actions
      setWalletConnection: (
        address: string,
        chainId: number,
        type: "wagmi" | "para" = "wagmi"
      ) => {
        set((state) => ({
          walletAddress: address,
          connectedChain: chainId,
          walletType: type,
          error: null,
          // If connecting Para wallet, also update Para state
          ...(type === "para" && {
            paraWallet: {
              ...state.paraWallet,
              isConnected: true,
              address: address,
              error: null,
            },
          }),
        }));
      },

      setParaWalletState: (
        paraState: Partial<import("@/types").ParaWalletState>
      ) => {
        set((state) => {
          const newParaState = { ...state.paraWallet, ...paraState };

          // Only sync to main wallet state if:
          // 1. Para wallet is connected and has an address
          // 2. AND there's no active main wallet connection (walletAddress is null)
          // 3. OR the current main wallet is already Para wallet
          const shouldSyncToMain =
            newParaState.isConnected &&
            newParaState.address &&
            (state.walletAddress === null || state.walletType === "para");

          return {
            paraWallet: newParaState,
            ...(shouldSyncToMain && {
              walletAddress: newParaState.address,
              walletType: "para" as const,
              connectedChain: 84532, // Default to Base Sepolia for Para wallets
            }),
          };
        });
      },

      disconnectWallet: () => {
        set((state) => {
          const updates: any = {
            walletAddress: null,
            connectedChain: null,
            walletType: null,
            currentRecommendations: [],
            activeOrders: [],
            error: null,
          };

          // Only clear Para state if it was the active wallet
          if (state.walletType === "para") {
            updates.paraWallet = {
              ...state.paraWallet,
              isConnected: false,
              address: null,
              error: null,
            };
          }
          // If wagmi wallet was active, Para wallet state should remain unchanged

          return updates;
        });
      },

      disconnectParaWallet: () => {
        set((state) => {
          const newParaState = {
            isConnected: false,
            address: null,
            authMethod: null,
            walletIds: null,
            isLoading: false,
            error: null,
          };

          // If Para was the active wallet, clear main wallet state too
          const shouldClearMain = state.walletType === "para";

          return {
            paraWallet: newParaState,
            ...(shouldClearMain && {
              walletAddress: null,
              connectedChain: null,
              walletType: null,
              currentRecommendations: [],
              activeOrders: [],
            }),
          };
        });
      },

      syncParaWalletState: () => {
        // This will be called by components to sync Para hook state with store
        // Implementation will be handled by the components using Para hooks
      },

      addJournalEntry: async (content: string) => {
        const entry: JournalEntry = {
          id: generateId(),
          content,
          timestamp: new Date(),
          processed: false,
        };

        set((state) => ({
          journalEntries: [entry, ...state.journalEntries],
          isLoading: true,
          error: null,
        }));

        try {
          // Process with AI (will be implemented in Venice AI integration)
          await get().processEntryWithAI(entry.id);
        } catch (error) {
          set({ error: "Failed to process journal entry", isLoading: false });
        }
      },

      processEntryWithAI: async (entryId: string) => {
        set({ isLoading: true });

        try {
          // Find the journal entry
          const state = get();
          const entry = state.journalEntries.find((e) => e.id === entryId);

          if (!entry) {
            throw new Error("Journal entry not found");
          }

          console.log("🧠 Processing journal entry with Venice AI...");

          // Import embedding service dynamically to avoid circular dependencies
          const { embeddingService } = await import("@/utils/embeddings");

          // Create embedding for the journal entry
          const embedding = await embeddingService.createEmbedding(
            entry.id,
            entry.content
          );

          // Update the entry as processed and store the embedding
          set((state) => ({
            journalEntries: state.journalEntries.map((e) =>
              e.id === entryId
                ? {
                    ...e,
                    processed: true,
                    embedding: embedding.vector,
                  }
                : e
            ),
            embeddings: [
              ...state.embeddings,
              {
                id: embedding.id,
                vector: embedding.vector,
                metadata: embedding.metadata,
              },
            ],
            isLoading: false,
          }));

          console.log("✅ Successfully processed journal entry with AI");
        } catch (error) {
          console.error("Failed to process entry with AI:", error);
          set((state) => ({
            journalEntries: state.journalEntries.map((entry) =>
              entry.id === entryId ? { ...entry, processed: false } : entry
            ),
            isLoading: false,
            error: `Failed to process with AI: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          }));
        }
      },

      generateRecommendations: async () => {
        set({ isLoading: true, error: null });

        try {
          console.log("🤖 Generating AI-powered DeFi recommendations...");

          // Import services dynamically
          const { embeddingService } = await import("@/utils/embeddings");
          const { veniceClient } = await import("@/utils/embeddings");

          const state = get();

          // Get the most recent journal entry for context
          const recentEntry = state.journalEntries[0]?.content || "";

          // Get embedding context for personalized recommendations
          const context = await embeddingService.getEmbeddingContext(
            recentEntry
          );

          // Build context for AI recommendation
          const contextText = [
            `Recent journal entries (${context.recentEntries.length} entries):`,
            ...context.recentEntries
              .slice(0, 3)
              .map((entry) => `- "${entry.content.slice(0, 100)}..."`),
            "",
            `Sentiment trend: ${Math.round(
              context.sentimentTrend.positive * 100
            )}% positive, ${Math.round(
              context.sentimentTrend.negative * 100
            )}% negative`,
            `Common topics: ${context.commonKeywords.slice(0, 5).join(", ")}`,
            "",
            `Current entry: "${recentEntry.slice(0, 200)}..."`,
          ].join("\n");

          // Generate AI recommendation using Venice AI with web search
          const aiResponse = await veniceClient.createChatCompletion(
            [
              {
                role: "system",
                content: `You are an expert DeFi financial advisor with real-time market access. Analyze the user's journal entries to provide personalized cryptocurrency trading recommendations.

INSTRUCTIONS:
1. Analyze the user's specific interests (stablecoins, memecoins, yield farming, etc.)
2. Search the web for current market trends, news, and sentiment
3. Consider liquidity data and recent events
4. Factor in their risk tolerance and investment goals
5. Provide actionable, data-driven recommendations

RESPONSE FORMAT (JSON only):
{
  "reasoning": "Detailed analysis based on their journal entries, current market conditions, and recent news. Include specific market data, trends, and why this recommendation fits their profile.",
  "fromToken": "ETH",
  "toToken": "USDC",
  "confidence": 0.85,
  "estimatedPrice": "2500.00",
  "marketInsights": "Recent market developments and news that support this recommendation",
  "riskAssessment": "Risk level and considerations for this trade"
}

Focus on popular DeFi tokens: ETH, BTC, USDC, USDT, LINK, UNI, AAVE, COMP, MKR, etc.
Use current market data and news to make recommendations more relevant and timely.
Be specific about WHY this recommendation matches their expressed interests and goals.`,
              },
              {
                role: "user",
                content: contextText,
              },
            ],
            {
              taskType: "defi_recommendations", // Use optimized model for DeFi analysis
              prioritizeCost: true, // Cost-optimized for frequent recommendations
              temperature: 0.7,
              max_tokens: 1000,
              // Enable Venice AI web search for real-time market data
              venice_parameters: {
                enable_web_search: "on",
                enable_web_citations: true,
                include_search_results_in_stream: false,
              },
            }
          );

          let aiRecommendation;
          try {
            const aiContent = aiResponse.choices[0]?.message?.content || "";
            console.log("🤖 Raw AI Response:", aiContent);
            
            // Try to extract JSON from the response (sometimes AI adds extra text)
            let jsonContent = aiContent;
            const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              jsonContent = jsonMatch[0];
            }
            
            aiRecommendation = JSON.parse(jsonContent);
            
            // Validate required fields
            if (!aiRecommendation.reasoning || !aiRecommendation.fromToken || !aiRecommendation.toToken) {
              throw new Error("Missing required fields in AI response");
            }
            
            console.log("✅ Successfully parsed AI recommendation:", aiRecommendation);
            
            // Log web search citations if available
            const citations = aiResponse.venice_parameters?.web_search_citations;
            if (citations && citations.length > 0) {
              console.log("🔍 Web search citations:", citations.map(c => c.title));
            }
            
          } catch (parseError) {
            console.warn("❌ Failed to parse AI response:", parseError);
            console.log("Raw response content:", aiResponse.choices[0]?.message?.content);
            
            // Enhanced fallback based on user's journal context
            const userKeywords = context.commonKeywords.join(", ");
            const sentiment = context.sentimentTrend.positive > 0.5 ? "optimistic" : 
                            context.sentimentTrend.negative > 0.5 ? "cautious" : "neutral";
            
            aiRecommendation = {
              reasoning: `Based on your ${sentiment} sentiment and interest in ${userKeywords || "DeFi"}, I recommend a balanced approach. Consider diversifying with USDC for stability while maintaining exposure to growth assets like ETH. This aligns with your recent journal entries about portfolio management.`,
              fromToken: "ETH",
              toToken: "USDC",
              confidence: 0.65,
              estimatedPrice: "2500.00",
              marketInsights: "AI analysis temporarily unavailable. Recommendation based on your journal patterns.",
              riskAssessment: "Medium risk - diversification strategy suitable for most portfolios."
            };
          }

          // Enhanced token mapping for better DeFi support
          const getTokenInfo = (symbol: string) => {
            const tokenMap: Record<string, { address: string; name: string; decimals: number }> = {
              ETH: { address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", name: "Ethereum", decimals: 18 },
              BTC: { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", name: "Bitcoin", decimals: 18 },
              USDC: { address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", name: "USD Coin", decimals: 6 },
              USDT: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", name: "Tether USD", decimals: 6 },
              LINK: { address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", name: "Chainlink", decimals: 18 },
              UNI: { address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", name: "Uniswap", decimals: 18 },
              AAVE: { address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", name: "Aave", decimals: 18 },
            };
            return tokenMap[symbol] || { address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", name: symbol, decimals: 18 };
          };

          const fromTokenInfo = getTokenInfo(aiRecommendation.fromToken);
          const toTokenInfo = getTokenInfo(aiRecommendation.toToken);

          // Create enhanced recommendation object
          const recommendation: DeFiRecommendation = {
            id: generateId(),
            reasoning: aiRecommendation.reasoning,
            marketInsights: aiRecommendation.marketInsights || "Market analysis based on current conditions",
            riskAssessment: aiRecommendation.riskAssessment || "Standard DeFi trading risks apply",
            webSearchCitations: aiResponse.venice_parameters?.web_search_citations || [],
            tokenPair: {
              from: {
                address: fromTokenInfo.address,
                symbol: aiRecommendation.fromToken,
                name: fromTokenInfo.name,
                decimals: fromTokenInfo.decimals,
                chainId: 84532,
              },
              to: {
                address: toTokenInfo.address,
                symbol: aiRecommendation.toToken,
                name: toTokenInfo.name,
                decimals: toTokenInfo.decimals,
                chainId: 84532,
              },
            },
            estimatedPrice: aiRecommendation.estimatedPrice,
            route: {
              fromToken: {
                address:
                  aiRecommendation.fromToken === "ETH"
                    ? "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
                    : "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
                symbol: aiRecommendation.fromToken,
                name:
                  aiRecommendation.fromToken === "ETH" ? "Ethereum" : "Bitcoin",
                decimals: 18,
                chainId: 84532,
              },
              toToken: {
                address:
                  aiRecommendation.toToken === "USDC"
                    ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
                    : "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                symbol: aiRecommendation.toToken,
                name:
                  aiRecommendation.toToken === "USDC" ? "USD Coin" : "Ethereum",
                decimals: aiRecommendation.toToken === "USDC" ? 6 : 18,
                chainId: 84532,
              },
              fromAmount: "1",
              toAmount: (
                parseFloat(aiRecommendation.estimatedPrice) || 2500
              ).toString(),
              protocols: ["1inch", "Venice AI"],
              gas: "150000",
            },
            confidence: aiRecommendation.confidence,
          };

          set({
            currentRecommendations: [recommendation],
            isLoading: false,
          });

          console.log("✅ Successfully generated AI-powered recommendation");
          return [recommendation];
        } catch (error) {
          console.error("Failed to generate AI recommendations:", error);

          // Fallback to basic recommendation
          const fallbackRecommendation: DeFiRecommendation = {
            id: generateId(),
            reasoning:
              "Unable to analyze your entries with AI at the moment. Consider diversifying with USDC for stability.",
            tokenPair: {
              from: {
                address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                symbol: "ETH",
                name: "Ethereum",
                decimals: 18,
                chainId: 84532,
              },
              to: {
                address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
                symbol: "USDC",
                name: "USD Coin",
                decimals: 6,
                chainId: 84532,
              },
            },
            estimatedPrice: "2500.00",
            route: {
              fromToken: {
                address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                symbol: "ETH",
                name: "Ethereum",
                decimals: 18,
                chainId: 84532,
              },
              toToken: {
                address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
                symbol: "USDC",
                name: "USD Coin",
                decimals: 6,
                chainId: 84532,
              },
              fromAmount: "1",
              toAmount: "2500",
              protocols: ["1inch"],
              gas: "150000",
            },
            confidence: 0.5,
          };

          set({
            currentRecommendations: [fallbackRecommendation],
            isLoading: false,
            error:
              "AI recommendations temporarily unavailable. Showing fallback recommendation.",
          });

          return [fallbackRecommendation];
        }
      },

      createFusionOrder: async (recommendation: DeFiRecommendation) => {
        set({ isLoading: true, error: null });

        try {
          // Placeholder - will be implemented with Fusion+ SDK
          const orderHash = `0x${Math.random().toString(16).substring(2, 66)}`;

          set((state) => ({
            activeOrders: [
              ...state.activeOrders,
              {
                hash: orderHash,
                recommendation,
                status: "pending",
                timestamp: new Date(),
              },
            ],
            isLoading: false,
          }));

          return orderHash;
        } catch (error) {
          set({ error: "Failed to create Fusion+ order", isLoading: false });
          throw error;
        }
      },

      generateSocialPost: async (tradeData: CompletedTrade) => {
        set({ isLoading: true, error: null });

        try {
          console.log("📱 Generating AI-powered social post...");

          // Import Venice client dynamically
          const { veniceClient } = await import("@/utils/embeddings");

          // Generate engaging social post using Venice AI
          const aiResponse = await veniceClient.createChatCompletion(
            [
              {
                role: "system",
                content: `You are a creative social media expert specializing in DeFi and crypto content. Generate engaging, authentic social media posts that celebrate successful trades while being informative and inspiring to the crypto community.

GUIDELINES:
- Use emojis strategically (not overwhelming)
- Include relevant hashtags (5-8 max)
- Keep it authentic and relatable
- Highlight the achievement without being boastful
- Include technical details that show expertise
- Make it shareable and engaging
- Vary the tone and style to avoid repetition

RESPONSE FORMAT (JSON only):
{
  "text": "The complete social media post text with emojis and mentions",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "tone": "celebratory|informative|casual|professional",
  "platform_optimized": "twitter|linkedin|general"
}`,
              },
              {
                role: "user",
                content: `Generate a social media post for this successful DeFi trade:
- Swapped: ${tradeData.fromAmount} ${tradeData.fromToken.symbol}
- Received: ${tradeData.toAmount} ${tradeData.toToken.symbol}
- From: ${tradeData.fromToken.name}
- To: ${tradeData.toToken.name}
- Platform: 1inch Fusion+ via IntentJournal+
- Chain: ${tradeData.fromToken.chainId === 84532 ? "Base Sepolia" : "Unknown"}

Make it engaging and authentic!`,
              },
            ],
            {
              taskType: "social_posts", // Use creative content model
              prioritizeCost: true, // Cost-optimized for social content
              temperature: 0.8, // Higher creativity
              max_tokens: 300,
            }
          );

          let socialPostData;
          try {
            const aiContent = aiResponse.choices[0]?.message?.content || "";
            console.log("📱 Raw AI Social Post Response:", aiContent);
            
            // Try to extract JSON from the response
            let jsonContent = aiContent;
            const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              jsonContent = jsonMatch[0];
            }
            
            socialPostData = JSON.parse(jsonContent);
            
            // Validate required fields
            if (!socialPostData.text || !socialPostData.hashtags) {
              throw new Error("Missing required fields in AI response");
            }
            
            console.log("✅ Successfully parsed AI social post:", socialPostData);
            
          } catch (parseError) {
            console.warn("❌ Failed to parse AI social post response:", parseError);
            console.log("Raw response content:", aiResponse.choices[0]?.message?.content);
            
            // Enhanced fallback with trade data
            socialPostData = {
              text: `Just completed a successful DeFi swap! 🎯\n\n${tradeData.fromAmount} ${tradeData.fromToken.symbol} → ${tradeData.toAmount} ${tradeData.toToken.symbol}\n\nUsing @1inch Fusion+ through IntentJournal+ for seamless cross-chain trading 🌉\n\nThe future of DeFi is here! 🚀`,
              hashtags: ["DeFi", "CrossChain", "1inch", "IntentJournal", "Web3", "Crypto"],
              tone: "celebratory",
              platform_optimized: "general"
            };
          }

          const post: SocialPost = {
            text: socialPostData.text,
            hashtags: socialPostData.hashtags || ["DeFi", "CrossChain", "1inch", "IntentJournal"],
          };

          set({ isLoading: false });
          console.log("✅ Successfully generated AI-powered social post");
          return post;
        } catch (error) {
          console.error("Failed to generate AI social post:", error);

          // Fallback to template-based post
          const fallbackPost: SocialPost = {
            text: `Just completed a successful cross-chain swap! 🚀\n\n${tradeData.fromAmount} ${tradeData.fromToken.symbol} → ${tradeData.toAmount} ${tradeData.toToken.symbol}\n\nPowered by @1inch Fusion+ and IntentJournal+ 💫\n\n#DeFi #CrossChain #1inch #IntentJournal`,
            hashtags: ["DeFi", "CrossChain", "1inch", "IntentJournal"],
          };

          set({ 
            isLoading: false,
            error: "AI social post generation temporarily unavailable. Using template."
          });
          return fallbackPost;
        }
      },

      generateSocialImage: async (tradeData: CompletedTrade, postText?: string) => {
        set({ isLoading: true, error: null });

        try {
          console.log("🎨 Generating AI-powered social media image...");

          // Import Venice client dynamically
          const { veniceClient } = await import("@/utils/embeddings");

          // Create a detailed prompt for the image
          const imagePrompt = `Professional DeFi trading success visualization: 
          A modern, clean digital art showing a successful cryptocurrency swap from ${tradeData.fromToken.symbol} to ${tradeData.toToken.symbol}. 
          Include subtle blockchain network elements, trading charts showing positive movement, 
          and 1inch protocol branding. Use a gradient background with blues and greens to convey success and trust. 
          Style: modern, professional, crypto-themed, social media optimized, high contrast, vibrant colors.
          No text overlays needed - clean visual design only.`;

          const imageResponse = await veniceClient.createImage(imagePrompt, {
            taskType: 'image_generation',
            width: 1024,
            height: 1024,
            format: 'webp',
            cfg_scale: 8.0,
            negative_prompt: 'blurry, low quality, text, watermarks, logos, distorted, ugly, dark, gloomy',
            safe_mode: true,
            hide_watermark: true
          });

          set({ isLoading: false });
          
          if (imageResponse.data[0]?.b64_json) {
            console.log("✅ Successfully generated AI-powered social image");
            return {
              imageData: imageResponse.data[0].b64_json,
              format: 'webp',
              description: imageResponse.data[0].revised_prompt || imagePrompt
            };
          } else {
            throw new Error("No image data received from Venice AI");
          }
        } catch (error) {
          console.error("Failed to generate AI social image:", error);
          
          set({ 
            isLoading: false,
            error: "AI image generation temporarily unavailable."
          });
          
          // Return a text-based description as fallback
          return {
            imageData: null,
            format: 'description',
            description: `Visual concept: A professional DeFi trading interface showing a successful swap from ${tradeData.fromAmount} ${tradeData.fromToken.symbol} to ${tradeData.toAmount} ${tradeData.toToken.symbol}, with modern blockchain aesthetics and success indicators.`
          };
        }
      },
    }),
    {
      name: STORAGE_KEYS.USER_PREFERENCES,
      partialize: (state) => ({
        journalEntries: state.journalEntries,
        embeddings: state.embeddings,
        tradeHistory: state.tradeHistory,
        preferences: state.preferences,
        // Persist Para wallet connection state
        paraWallet: {
          isConnected: state.paraWallet.isConnected,
          address: state.paraWallet.address,
          authMethod: state.paraWallet.authMethod,
          walletIds: state.paraWallet.walletIds,
          // Don't persist loading/error states
        },
        // Persist main wallet state for restoration
        walletAddress: state.walletAddress,
        connectedChain: state.connectedChain,
        walletType: state.walletType,
      }),
    }
  )
);
