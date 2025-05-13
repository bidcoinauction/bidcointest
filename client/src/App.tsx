import { Switch, Route } from "wouter";
import { useEffect } from "react";
import AuctionsPage from "@/pages/auctions";
import AuctionDetailsPage from "@/pages/auction-details";
import NFTCollectionsPage from "@/pages/nft-collections";
import OrdinalsPage from "@/pages/ordinals";
import BidPacksPage from "@/pages/bid-packs";
import ActivityPage from "@/pages/activity";
import AboutPage from "@/pages/about";
import NotFound from "@/pages/not-found";
import useWebSocket from "@/hooks/useWebSocket";
import { queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

function App() {
  const { isConnected, subscribe } = useWebSocket();

  // Subscribe to WebSocket events and update cache accordingly
  useEffect(() => {
    if (isConnected) {
      // Subscribe to auction updates
      const unsubscribeAuctions = subscribe("new-auction", () => {
        queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auctions/featured"] });
      });

      // Subscribe to bid updates
      const unsubscribeBids = subscribe("new-bid", () => {
        queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      });

      // Clean up subscriptions
      return () => {
        unsubscribeAuctions();
        unsubscribeBids();
      };
    }
  }, [isConnected, subscribe]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={AuctionsPage}/>
          <Route path="/auctions" component={AuctionsPage}/>
          <Route path="/auctions/:id" component={AuctionDetailsPage}/>
          <Route path="/nft-collections" component={NFTCollectionsPage}/>
          <Route path="/ordinals" component={OrdinalsPage}/>
          <Route path="/bid-packs" component={BidPacksPage}/>
          <Route path="/activity" component={ActivityPage}/>
          <Route path="/about" component={AboutPage}/>
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

export default App;
