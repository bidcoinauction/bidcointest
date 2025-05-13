import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import WalletModal from "@/components/modals/WalletModal";
import useWallet from "@/hooks/useWallet";
import { formatAddress } from "@/lib/utils";

export default function Header() {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { isConnected, address, disconnect } = useWallet();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search logic here
    console.log("Searching for:", searchQuery);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-[#374151]">
      <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <a className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shadow-glow">
                <i className="fa-solid fa-coin text-white text-xl"></i>
              </div>
              <h1 className="text-2xl font-display font-bold text-white">BidCoin</h1>
            </a>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4 order-3 w-full md:w-auto md:order-2 mt-4 md:mt-0">
          <form onSubmit={handleSearch} className="relative w-full md:w-64">
            <Input
              type="text"
              placeholder="Search auctions, NFTs..."
              className="w-full bg-[#1f2937] text-white border border-[#374151] rounded-lg py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </form>
        </div>
        
        <div className="order-2 md:order-3">
          {isConnected ? (
            <div className="flex items-center space-x-3">
              <span className="text-white bg-[#1f2937] py-2 px-3 rounded-lg text-sm hidden md:block">
                {formatAddress(address)}
              </span>
              <Button
                variant="outline"
                className="text-white border-[#374151] hover:bg-[#374151]"
                onClick={() => disconnect()}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              className="flex items-center space-x-2 bg-primary hover:bg-[#4f46e5] text-white"
              onClick={() => setShowWalletModal(true)}
            >
              <i className="fa-solid fa-wallet"></i>
              <span>Connect Wallet</span>
            </Button>
          )}
        </div>
      </div>
      
      <WalletModal open={showWalletModal} onOpenChange={setShowWalletModal} />
    </header>
  );
}
