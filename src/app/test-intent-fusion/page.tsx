import IntentFusionTest from '@/components/intent-fusion-test';
import BuildBearFaucetSimple from '@/components/buildbear-faucet-simple';
import IJTTokenFaucet from '@/components/ijt-token-faucet';

export default function TestIntentFusionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <BuildBearFaucetSimple />
        <IJTTokenFaucet />
        <IntentFusionTest />
      </div>
    </div>
  );
}