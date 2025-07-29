/**
 * Para SDK troubleshooting utilities
 */

export interface TroubleshootingResult {
  issue: string;
  severity: 'error' | 'warning' | 'info';
  solution: string;
}

export function detectWalletConflicts(): TroubleshootingResult[] {
  const results: TroubleshootingResult[] = [];
  
  // Check for multiple wallet extensions
  const walletProviders = [];
  
  if (typeof window !== 'undefined') {
    if (window.ethereum) walletProviders.push('MetaMask/Generic');
    if ((window as any).phantom?.solana) walletProviders.push('Phantom');
    if ((window as any).coinbaseWalletExtension) walletProviders.push('Coinbase');
    if ((window as any).trustWallet) walletProviders.push('Trust Wallet');
  }
  
  if (walletProviders.length > 1) {
    results.push({
      issue: `Multiple wallet extensions detected: ${walletProviders.join(', ')}`,
      severity: 'warning',
      solution: 'Consider disabling unused wallet extensions to avoid conflicts. Para works independently of these extensions.'
    });
  }
  
  return results;
}

export function detectCORSIssues(): TroubleshootingResult[] {
  const results: TroubleshootingResult[] = [];
  
  // Check if we're in a secure context
  if (typeof window !== 'undefined') {
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      results.push({
        issue: 'Insecure context detected',
        severity: 'error',
        solution: 'Para OAuth requires HTTPS in production. Use localhost for development or deploy with HTTPS.'
      });
    }
    
    // Check for popup blockers
    try {
      const testPopup = window.open('', 'test', 'width=1,height=1');
      if (!testPopup) {
        results.push({
          issue: 'Popup blocker detected',
          severity: 'error',
          solution: 'Please allow popups for this site in your browser settings.'
        });
      } else {
        testPopup.close();
      }
    } catch (e) {
      results.push({
        issue: 'Popup functionality blocked',
        severity: 'error',
        solution: 'Browser security settings are blocking popups. Please adjust your browser settings.'
      });
    }
  }
  
  return results;
}

export function validateParaConfiguration(): TroubleshootingResult[] {
  const results: TroubleshootingResult[] = [];
  
  const apiKey = process.env.NEXT_PUBLIC_PARA_API_KEY;
  const secretKey = process.env.NEXT_PUBLIC_PARA_SECRET_KEY;
  
  if (!apiKey) {
    results.push({
      issue: 'NEXT_PUBLIC_PARA_API_KEY not set',
      severity: 'error',
      solution: 'Add your Para API key to the .env file as NEXT_PUBLIC_PARA_API_KEY'
    });
  } else if (!apiKey.match(/^[a-f0-9]{32}$/)) {
    results.push({
      issue: 'Para API key format appears incorrect',
      severity: 'warning',
      solution: 'Para API keys should be 32 character hexadecimal strings. Please verify your API key.'
    });
  }
  
  if (!secretKey) {
    results.push({
      issue: 'NEXT_PUBLIC_PARA_SECRET_KEY not set',
      severity: 'warning',
      solution: 'Consider adding your Para secret key to the .env file as NEXT_PUBLIC_PARA_SECRET_KEY for client-side operations'
    });
  }
  
  return results;
}

export function runFullDiagnostics(): TroubleshootingResult[] {
  return [
    ...detectWalletConflicts(),
    ...detectCORSIssues(),
    ...validateParaConfiguration()
  ];
}

export function formatDiagnosticResults(results: TroubleshootingResult[]): string {
  if (results.length === 0) {
    return "✅ No issues detected";
  }
  
  return results.map(result => {
    const icon = result.severity === 'error' ? '❌' : result.severity === 'warning' ? '⚠️' : 'ℹ️';
    return `${icon} ${result.issue}\n   Solution: ${result.solution}`;
  }).join('\n\n');
}