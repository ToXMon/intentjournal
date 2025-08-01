/**
 * Development Mode Indicator
 * Shows when mock data is being used for 1inch API
 */

'use client';

import { useChainId } from 'wagmi';
import { shouldUseMockData } from '@/utils/oneinch';
import { shouldUseHybridData } from '@/utils/oneinch/hybrid-data';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Globe } from 'lucide-react';

export function DevModeIndicator() {
  const chainId = useChainId();
  const usingHybridData = shouldUseHybridData(chainId);
  const usingMockData = shouldUseMockData(chainId);

  if (usingHybridData) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
          <Globe className="h-3 w-3 mr-1" />
          Hybrid Data Mode
        </Badge>
      </div>
    );
  }

  if (usingMockData) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Mock Data Mode
        </Badge>
      </div>
    );
  }

  return null;
}