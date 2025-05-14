import { useLocation } from "wouter";

export default function Navigation() {
  const [location, setLocation] = useLocation();

  // Check if a path is active, including parent paths
  const isActive = (path: string): boolean => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  // Navigate to path
  const navigate = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setLocation(path);
  };

  return (
    <nav className="bg-background/50 border-b border-[#374151]">
      <div className="container mx-auto px-4">
        <div className="flex overflow-x-auto py-2 space-x-6 text-sm font-medium">
          <div 
            onClick={navigate("/auctions")}
            className={`px-1 py-2 whitespace-nowrap cursor-pointer ${isActive("/auctions") ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-white"}`}
          >
            Auctions
          </div>
          
          <div 
            onClick={navigate("/bid-packs")}
            className={`px-1 py-2 whitespace-nowrap cursor-pointer ${isActive("/bid-packs") ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-white"}`}
          >
            BidPacks
          </div>
          
          <div 
            onClick={navigate("/dashboard")}
            className={`px-1 py-2 whitespace-nowrap cursor-pointer ${isActive("/dashboard") ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-white"}`}
          >
            Dashboard
          </div>
          
          <div 
            onClick={navigate("/activity")}
            className={`px-1 py-2 whitespace-nowrap cursor-pointer ${isActive("/activity") ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-white"}`}
          >
            Activity
          </div>
          
          <div 
            onClick={navigate("/about")}
            className={`px-1 py-2 whitespace-nowrap cursor-pointer ${isActive("/about") ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-white"}`}
          >
            About
          </div>
        </div>
      </div>
    </nav>
  );
}
