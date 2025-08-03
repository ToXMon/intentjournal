'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Link as LinkIcon, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  ArrowRight,
  Eye,
  Copy
} from 'lucide-react';
import { realTransactionExecutor, type TransactionResult } from '@/services/real-transaction-executor';
import { intentExecutionService, type OnChainEvidence } from '@/utils/intent-execution';

interface CrossChainEvidenceProps {
  onEvidenceUpdate?: (evidence: OnChainEvidence[]) => void;
}

interface EvidenceRecord {
  id: string;
  intentHash: string;
  sourceChain: number;
  destChain: number;
  sourceChainName: string;
  destChainName: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  explorerUrl: string;
  verified: boolean;
  userAddress: string;
}

export function CrossChainEvidence({ onEvidenceUpdate }: CrossChainEvidenceProps) {
  const { address, isConnected } = useAccount();
  
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Load existing evidence
  const loadEvidence = async () => {
    if (!address || !isConnected) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get evidence from both services
      const [realEvidence, intentEvidence] = await Promise.all([
        realTransactionExecutor.getRealOnChainEvidence(address),
        intentExecutionService.hasOnChainEvidence(address)
      ]);

      const combinedEvidence: EvidenceRecord[] = [];

      // Process real transaction executor evidence
      if (realEvidence && Array.isArray(realEvidence)) {
        realEvidence.forEach((item: any, index: number) => {
          combinedEvidence.push({
            id: `real-${index}`,
            intentHash: item.intentHash || `0x${Buffer.from(`intent-${index}`).toString('hex')}`,
            sourceChain: 27257,
            destChain: 128123,
            sourceChainName: 'BuildBear Base Fork',
            destChainName: 'Etherlink Testnet',
            txHash: item.txHash || '',
            blockNumber: item.blockNumber || 0,
            timestamp: item.timestamp || Date.now(),
            explorerUrl: item.explorerUrl || realTransactionExecutor.generateExplorerUrl(item.txHash || '', 128123),
            verified: !!item.txHash,
            userAddress: address
          });
        });
      }

      // Process intent execution service evidence
      if (intentEvidence && Array.isArray(intentEvidence)) {
        intentEvidence.forEach((item: OnChainEvidence) => {
          combinedEvidence.push({
            id: `intent-${item.orderId}`,
            intentHash: item.intentHash,
            sourceChain: item.sourceChain,
            destChain: item.destChain,
            sourceChainName: item.sourceChain === 27257 ? 'BuildBear Base Fork' : 'Unknown',
            destChainName: item.destChain === 128123 ? 'Etherlink Testnet' : 'Unknown',
            txHash: item.txHash,
            blockNumber: item.blockNumber,
            timestamp: item.timestamp,
            explorerUrl: realTransactionExecutor.generateExplorerUrl(item.txHash, item.destChain),
            verified: true,
            userAddress: address
          });
        });
      }

      // Remove duplicates based on txHash
      const uniqueEvidence = combinedEvidence.filter((item, index, self) => 
        index === self.findIndex(t => t.txHash === item.txHash && t.txHash !== '')
      );

      setEvidence(uniqueEvidence);
      setLastUpdate(new Date());
      onEvidenceUpdate?.(intentEvidence || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load evidence');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new cross-chain evidence
  const createEvidence = async (intentText: string) => {
    if (!address) return;

    setIsCreating(true);
    setError(null);

    try {
      const intentHash = `0x${Buffer.from(intentText + address + Date.now()).toString('hex').slice(0, 64)}`;
      
      const evidenceParams = {
        intentHash,
        sourceChain: 27257,
        destChain: 128123,
        userAddress: address
      };

      const result = await realTransactionExecutor.createCrossChainEvidence(evidenceParams);
      
      if (result.success) {
        // Refresh evidence list
        await loadEvidence();
      } else {
        throw new Error(result.error || 'Failed to create evidence');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Load evidence on mount and address change
  useEffect(() => {
    if (address && isConnected) {
      loadEvidence();
    }
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Cross-Chain Evidence
          </CardTitle>
          <CardDescription>
            Connect your wallet to view cross-chain evidence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to view cross-chain evidence records
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Cross-Chain Evidence
        </CardTitle>
        <CardDescription>
          Verifiable evidence of intent execution across blockchains
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {lastUpdate && `Last updated: ${lastUpdate.toLocaleTimeString()}`}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadEvidence}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => createEvidence('Demo intent for cross-chain evidence')}
              disabled={isCreating}
            >
              {isCreating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LinkIcon className="h-4 w-4 mr-2" />
              )}
              Create Evidence
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Evidence Records */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 border rounded-lg">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : evidence.length === 0 ? (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              No cross-chain evidence found. Create your first intent to generate evidence.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {evidence.map(record => (
              <div key={record.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={record.verified ? 'default' : 'secondary'}>
                        {record.verified ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </>
                        )}
                      </Badge>
                      <div className="text-sm text-gray-500">
                        {new Date(record.timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Intent Hash:</span>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                          {record.intentHash.slice(0, 10)}...{record.intentHash.slice(-8)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(record.intentHash)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Transaction:</span>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                          {record.txHash ? `${record.txHash.slice(0, 10)}...${record.txHash.slice(-8)}` : 'N/A'}
                        </code>
                        {record.txHash && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(record.txHash)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Block:</span>
                        <span className="text-xs">{record.blockNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {record.txHash && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(record.explorerUrl, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Verify
                    </Button>
                  )}
                </div>

                {/* Chain Flow */}
                <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{record.sourceChainName}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{record.destChainName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Network Information */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm">
            <div className="font-medium mb-2">Supported Networks</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">BuildBear Base Fork</div>
                  <div className="text-gray-600 dark:text-gray-300">Chain ID: 27257</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open('https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io', '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Etherlink Testnet</div>
                  <div className="text-gray-600 dark:text-gray-300">Chain ID: 128123</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open('https://testnet-explorer.etherlink.com', '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
