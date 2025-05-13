import { useQuery } from "@tanstack/react-query";
import { getBlockchainStats } from "@/lib/api";
import { 
  Bitcoin, 
  Brackets, 
  BarChart2, 
  Hexagon
} from "lucide-react";

function CryptoIcon({ name }: { name: string }) {
  switch (name.toLowerCase()) {
    case "bitcoin":
      return <Bitcoin className="text-sm" />;
    case "ethereum":
      return <Brackets className="text-sm" />;
    case "solana":
      return <BarChart2 className="text-sm" />;
    case "polygon":
      return <Hexagon className="text-sm" />;
    default:
      return <Hexagon className="text-sm" />;
  }
}

export default function BitCrunchSection() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["/api/blockchain/stats"],
    queryFn: getBlockchainStats,
  });

  if (isLoading) {
    return (
      <section className="mb-12 bg-[#1f2937] rounded-xl p-6 border border-[#374151] animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-48 bg-[#374151] rounded"></div>
          <div className="h-6 w-32 bg-[#374151] rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-background p-4 rounded-lg border border-[#374151]">
            <div className="h-6 w-40 bg-[#374151] rounded mb-4"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-[#374151] rounded"></div>
              ))}
            </div>
          </div>
          <div className="bg-background p-4 rounded-lg border border-[#374151]">
            <div className="h-6 w-40 bg-[#374151] rounded mb-4"></div>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-[#374151] rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !stats) {
    return (
      <section className="mb-12 bg-[#1f2937] rounded-xl p-6 border border-[#374151]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold text-white">Blockchain Analytics</h2>
          <div className="text-sm text-gray-400">
            Powered by <span className="text-primary font-medium">BitCrunch API</span>
          </div>
        </div>
        <div className="p-8 text-center">
          <p className="text-white mb-2">Failed to load blockchain data</p>
          <p className="text-gray-400">Please try again later</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12 bg-[#1f2937] rounded-xl p-6 border border-[#374151]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display font-bold text-white">Blockchain Analytics</h2>
        <div className="text-sm text-gray-400">
          Powered by <span className="text-primary font-medium">BitCrunch API</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-background p-4 rounded-lg border border-[#374151]">
          <h3 className="text-lg font-medium text-white mb-3">Top Blockchain Networks</h3>
          <div className="space-y-3">
            {stats.networks.map((network) => (
              <div key={network.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full ${network.gradient} mr-3 flex items-center justify-center text-white`}>
                    <CryptoIcon name={network.name} />
                  </div>
                  <span className="text-white">{network.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-medium">{network.price}</span>
                  <div className={`text-xs ${network.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {network.change}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-background p-4 rounded-lg border border-[#374151]">
          <h3 className="text-lg font-medium text-white mb-3">NFT Market Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            {stats.marketStats.map((stat) => (
              <div key={stat.label} className="bg-[#374151] p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
                <p className="font-medium text-white text-lg">{stat.value}</p>
                <p className={`text-xs ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.change}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
