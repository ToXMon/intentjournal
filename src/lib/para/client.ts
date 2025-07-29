import { ParaWeb, Environment } from "@getpara/web-sdk";

const PARA_API_KEY = process.env.NEXT_PUBLIC_PARA_API_KEY!;
const PARA_SECRET_KEY = process.env.NEXT_PUBLIC_PARA_SECRET_KEY;

if (!PARA_API_KEY) {
  throw new Error("NEXT_PUBLIC_PARA_API_KEY is required");
}

// Initialize Para client with proper error handling
// Note: Para Web SDK typically only needs API key for client-side operations
export const para = new ParaWeb(Environment.BETA, PARA_API_KEY);

// Add debugging for Para client methods (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log("=== PARA CLIENT TEST ===");
  console.log("✓ Para client initialized");
  console.log("✓ API Key:", PARA_API_KEY?.slice(0, 10) + "...");
  console.log("✓ Secret Key:", PARA_SECRET_KEY ? PARA_SECRET_KEY.slice(0, 10) + "..." : "NOT SET");
  
  // Show all available methods that might be related to accounts/auth
  const allMethods = Object.getOwnPropertyNames(para);
  const accountMethods = allMethods.filter(name => 
    name.toLowerCase().includes('account') || 
    name.toLowerCase().includes('user') || 
    name.toLowerCase().includes('auth') ||
    name.toLowerCase().includes('session') ||
    name.toLowerCase().includes('wallet')
  );
  console.log("✓ Account/Auth related methods:", accountMethods);
  
  // Test specific methods that might give us account info
  console.log("\n=== ACCOUNT METHOD TESTS ===");
  const methodsToTest = ['getUserId', 'getWallets', 'getAuthInfo', 'isSessionActive', 'isFullyLoggedIn'];
  methodsToTest.forEach(method => {
    if (typeof para[method] === 'function') {
      try {
        const result = para[method]();
        console.log(`✓ ${method}():`, result);
      } catch (err) {
        console.log(`⚠️ ${method}() error:`, err.message);
      }
    } else {
      console.log(`✗ ${method}: Not available`);
    }
  });
  
  // Test OAuth methods
  console.log("\n=== OAUTH METHODS TEST ===");
  const oauthMethods = ['verifyOAuth', 'waitForWalletCreation', 'waitForLogin', 'logout'];
  oauthMethods.forEach(method => {
    console.log(`✓ ${method}:`, typeof para[method] === 'function' ? 'Available' : 'Not available');
  });
}

// Create a compatibility wrapper for different SDK versions
export const paraCompat = {
  async getAccount() {
    try {
      // First try to restore session from storage
      if (typeof para.initializeFromStorage === 'function') {
        await para.initializeFromStorage();
      }

      // Debug: Check what properties are available
      console.log("Para client properties:", Object.getOwnPropertyNames(para).filter(name => 
        name.includes('user') || name.includes('wallet') || name.includes('auth') || name.includes('session')
      ));
      
      // Check if user is authenticated by looking at userId
      const userId = para.getUserId?.() || para.userId;
      console.log("UserId found:", userId);
      
      if (!userId) {
        // Check if there's session data
        const sessionActive = para.isSessionActive?.() || para.isFullyLoggedIn?.();
        console.log("Session active:", sessionActive);
        
        if (!sessionActive) {
          return null;
        }
      }

      // Get wallets and auth info
      const wallets = para.getWallets?.() || para.wallets || [];
      const authInfo = para.getAuthInfo?.() || {};
      
      console.log("Wallets found:", wallets);
      console.log("Auth info found:", authInfo);
      
      // Construct account object from available data
      const account = {
        userId,
        wallets,
        authInfo,
        isAuthenticated: !!userId,
        // Try to get primary wallet address
        address: wallets[0]?.address || null
      };

      console.log("Constructed account:", account);
      return account;
    } catch (error) {
      console.log("Account method error:", error);
      return null;
    }
  },

  async initializeSession() {
    try {
      if (typeof para.initializeFromStorage === 'function') {
        await para.initializeFromStorage();
        return true;
      }
      return false;
    } catch (error) {
      console.log("Session initialization error:", error);
      return false;
    }
  },

  async verifyOAuth(params: any) {
    if (typeof para.verifyOAuth === 'function') {
      try {
        // Ensure we have the required parameters
        const oauthParams = {
          method: params.method,
          onOAuthUrl: params.onOAuthUrl,
          isCanceled: params.isCanceled || (() => false)
        };
        
        console.log("Calling para.verifyOAuth with params:", oauthParams);
        console.log("Para client methods available:", Object.getOwnPropertyNames(para).filter(name => name.includes('auth') || name.includes('OAuth') || name.includes('login')));
        
        const result = await para.verifyOAuth(oauthParams);
        console.log("verifyOAuth result:", result);
        console.log("verifyOAuth result type:", typeof result);
        console.log("verifyOAuth result keys:", result ? Object.keys(result) : 'null');
        return result;
      } catch (error) {
        console.error("verifyOAuth error details:", error);
        
        // Enhanced error handling for common issues
        if (error instanceof Error) {
          if (error.message.includes('400') || error.message.includes('Bad Request')) {
            throw new Error(`Para API Error: The authentication request failed. This could be due to:
• Invalid API credentials
• OAuth method not properly configured
• Session expired or invalid
• Network connectivity issues

Please try connecting again or contact support if the issue persists.`);
          } else if (error.message.includes('timeout')) {
            throw new Error("Authentication timed out. Please try again.");
          } else if (error.message.includes('CORS')) {
            throw new Error("Browser security policy blocked the request. Please try a different browser or disable ad blockers.");
          }
        }
        throw error;
      }
    } else {
      throw new Error("verifyOAuth method not available on Para client");
    }
  },

  async waitForWalletCreation(params: any) {
    if (typeof para.waitForWalletCreation === 'function') {
      return await para.waitForWalletCreation(params);
    } else {
      throw new Error("waitForWalletCreation method not available on Para client");
    }
  },

  async waitForLogin(params: any) {
    if (typeof para.waitForLogin === 'function') {
      return await para.waitForLogin(params);
    } else {
      throw new Error("waitForLogin method not available on Para client");
    }
  },

  async logout() {
    if (typeof para.logout === 'function') {
      return await para.logout();
    } else {
      throw new Error("logout method not available on Para client");
    }
  }
};