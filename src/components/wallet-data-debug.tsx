"use client";

import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function WalletDataDebug() {
  const { 
    walletAddress, 
    walletType, 
    journalEntries, 
    embeddings, 
    tradeHistory,
    currentRecommendations,
    activeOrders 
  } = useAppStore();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="mt-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          🐛 Wallet Data Debug
          <Badge variant="outline" className="text-xs">Dev Only</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>
          <strong>Current Wallet:</strong> {walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : 'None'}
        </div>
        <div>
          <strong>Wallet Type:</strong> {walletType || 'None'}
        </div>
        <div>
          <strong>Journal Entries:</strong> {journalEntries.length}
        </div>
        <div>
          <strong>Embeddings:</strong> {embeddings.length}
        </div>
        <div>
          <strong>Trade History:</strong> {tradeHistory.length}
        </div>
        <div>
          <strong>Recommendations:</strong> {currentRecommendations.length}
        </div>
        <div>
          <strong>Active Orders:</strong> {activeOrders.length}
        </div>
        {journalEntries.length > 0 && (
          <div className="mt-2 p-2 bg-white rounded border">
            <strong>Latest Entry:</strong>
            <div className="text-xs text-gray-600 mt-1">
              "{journalEntries[0].content.slice(0, 50)}..."
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}