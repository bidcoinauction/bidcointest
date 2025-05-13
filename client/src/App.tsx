import { Switch, Route } from "wouter";
import AuctionsPage from "@/pages/auctions";
import AuctionDetailsPage from "@/pages/auction-details";
import NFTCollectionsPage from "@/pages/nft-collections";
import OrdinalsPage from "@/pages/ordinals";
import BidPacksPage from "@/pages/bid-packs";
import ActivityPage from "@/pages/activity";
import AboutPage from "@/pages/about";
import NotFound from "@/pages/not-found";

function App() {
  return (
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
  );
}

export default App;
