import { Link, useLocation } from "wouter";

export default function Navigation() {
  const [location] = useLocation();

  // Check if a path is active, including parent paths
  const isActive = (path: string): boolean => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <nav className="bg-background/50 border-b border-[#374151]">
      <div className="container mx-auto px-4">
        <div className="flex overflow-x-auto py-2 space-x-6 text-sm font-medium">
          <Link href="/auctions">
            <a className={`px-1 py-2 whitespace-nowrap ${isActive("/auctions") ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-white"}`}>
              Auctions
            </a>
          </Link>
          <Link href="/nft-collections">
            <a className={`px-1 py-2 whitespace-nowrap ${isActive("/nft-collections") ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-white"}`}>
              NFT Collections
            </a>
          </Link>
          <Link href="/ordinals">
            <a className={`px-1 py-2 whitespace-nowrap ${isActive("/ordinals") ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-white"}`}>
              Ordinals
            </a>
          </Link>
          <Link href="/bid-packs">
            <a className={`px-1 py-2 whitespace-nowrap ${isActive("/bid-packs") ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-white"}`}>
              BidPacks
            </a>
          </Link>
          <Link href="/activity">
            <a className={`px-1 py-2 whitespace-nowrap ${isActive("/activity") ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-white"}`}>
              Activity
            </a>
          </Link>
          <Link href="/about">
            <a className={`px-1 py-2 whitespace-nowrap ${isActive("/about") ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-white"}`}>
              About
            </a>
          </Link>
        </div>
      </div>
    </nav>
  );
}
