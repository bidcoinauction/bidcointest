// Removed header/footer imports
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
        <section className="mb-12">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">About BidCoin</h1>
          <p className="text-gray-300 max-w-3xl mb-8">
            BidCoin is a premier Web3 auction platform that combines the excitement of bidding with the power of blockchain technology, 
            offering a secure and transparent marketplace for NFTs, Ordinals, and digital collectibles.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151]">
              <h2 className="text-xl font-display font-bold text-white mb-4">Our Mission</h2>
              <p className="text-gray-300 mb-6">
                We're on a mission to revolutionize the digital auction space by leveraging blockchain technology to create 
                a secure, transparent, and exciting marketplace where collectors and creators can connect and trade unique digital assets.
              </p>
              <p className="text-gray-300">
                By incorporating cryptocurrencies, NFTs, and ordinals, we're building the future of digital ownership and value exchange.
              </p>
            </div>
            
            <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151]">
              <h2 className="text-xl font-display font-bold text-white mb-4">Why Choose BidCoin</h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <i className="fa-solid fa-check text-primary mt-1 mr-3"></i>
                  <span>Secure transactions backed by blockchain technology</span>
                </li>
                <li className="flex items-start">
                  <i className="fa-solid fa-check text-primary mt-1 mr-3"></i>
                  <span>Transparent bidding process with real-time updates</span>
                </li>
                <li className="flex items-start">
                  <i className="fa-solid fa-check text-primary mt-1 mr-3"></i>
                  <span>Support for multiple cryptocurrencies and blockchains</span>
                </li>
                <li className="flex items-start">
                  <i className="fa-solid fa-check text-primary mt-1 mr-3"></i>
                  <span>Innovative BidPack system for cost-effective participation</span>
                </li>
                <li className="flex items-start">
                  <i className="fa-solid fa-check text-primary mt-1 mr-3"></i>
                  <span>Curated collections of high-quality digital assets</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-[#374151] to-[#1f2937] rounded-xl overflow-hidden mb-12">
            <div className="md:flex">
              <div className="md:w-2/3 p-8">
                <h2 className="text-2xl font-display font-bold text-white mb-4">How BidCoin Works</h2>
                <p className="text-gray-300 mb-6">
                  BidCoin combines the excitement of traditional auctions with the security and transparency of blockchain technology.
                </p>
                
                <div className="space-y-6 mb-6">
                  <div className="flex">
                    <div className="bg-primary/20 h-8 w-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-primary font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-1">Connect Your Wallet</h3>
                      <p className="text-gray-300 text-sm">Link your cryptocurrency wallet to get started. We support MetaMask, Coinbase Wallet, and WalletConnect.</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="bg-primary/20 h-8 w-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-primary font-bold">2</span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-1">Purchase BidPacks</h3>
                      <p className="text-gray-300 text-sm">Buy BidPacks (ordinals) to participate in auctions. These are cost-effective compared to individual bids.</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="bg-primary/20 h-8 w-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-primary font-bold">3</span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-1">Place Bids on Auctions</h3>
                      <p className="text-gray-300 text-sm">Browse active auctions and place bids on your favorite NFTs. Each bid extends the auction time.</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="bg-primary/20 h-8 w-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-primary font-bold">4</span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-1">Win and Collect</h3>
                      <p className="text-gray-300 text-sm">If you're the highest bidder when the auction ends, the NFT is transferred to your wallet automatically.</p>
                    </div>
                  </div>
                </div>
                
                <Button className="bg-primary hover:bg-primary-dark text-white">Get Started Now</Button>
              </div>
              
              <div className="md:w-1/3 bg-[#111827] flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="mb-3 inline-block">
                    <i className="fa-solid fa-chart-line text-5xl text-primary"></i>
                  </div>
                  <h3 className="text-xl font-display font-bold text-white mb-2">Powered by BitCrunch</h3>
                  <p className="text-gray-300 text-sm">
                    We leverage BitCrunch API for real-time blockchain analytics, ensuring reliable market data for informed bidding decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-6">Our Team</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div className="bg-[#1f2937] rounded-xl p-5 border border-[#374151] text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                  <img src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80" alt="Team member" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-white font-bold mb-1">Alex Johnson</h3>
                <p className="text-primary text-sm mb-2">CEO & Founder</p>
                <p className="text-gray-400 text-sm">Blockchain enthusiast with 10+ years in fintech and digital marketplaces.</p>
              </div>
              
              <div className="bg-[#1f2937] rounded-xl p-5 border border-[#374151] text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                  <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80" alt="Team member" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-white font-bold mb-1">Sarah Chen</h3>
                <p className="text-primary text-sm mb-2">CTO</p>
                <p className="text-gray-400 text-sm">Full-stack developer with expertise in Web3 technologies and blockchain integration.</p>
              </div>
              
              <div className="bg-[#1f2937] rounded-xl p-5 border border-[#374151] text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80" alt="Team member" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-white font-bold mb-1">Michael Torres</h3>
                <p className="text-primary text-sm mb-2">Creative Director</p>
                <p className="text-gray-400 text-sm">Digital artist and designer with a passion for NFTs and cryptocurrency art.</p>
              </div>
              
              <div className="bg-[#1f2937] rounded-xl p-5 border border-[#374151] text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                  <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80" alt="Team member" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-white font-bold mb-1">Emily Patel</h3>
                <p className="text-primary text-sm mb-2">Head of Operations</p>
                <p className="text-gray-400 text-sm">Experienced operations manager specializing in digital marketplaces and e-commerce.</p>
              </div>
            </div>
          </div>
          
          <div className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151]">
                <h3 className="text-lg font-display font-bold text-white mb-2">What are NFTs and Ordinals?</h3>
                <p className="text-gray-300">
                  NFTs (Non-Fungible Tokens) are unique digital assets verified using blockchain technology. Each NFT has a digital signature 
                  that makes it one-of-a-kind. Ordinals are Bitcoin's version of NFTs, allowing digital content to be inscribed directly onto satoshis 
                  (the smallest unit of Bitcoin).
                </p>
              </div>
              
              <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151]">
                <h3 className="text-lg font-display font-bold text-white mb-2">How do BidPacks work?</h3>
                <p className="text-gray-300">
                  BidPacks are collections of bids purchased in bulk. When you buy a BidPack, you receive a set number of bids plus bonus bids 
                  that can be used across any auction on our platform. This system is more cost-effective than individual bids and reduces 
                  transaction fees.
                </p>
              </div>
              
              <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151]">
                <h3 className="text-lg font-display font-bold text-white mb-2">What cryptocurrencies do you accept?</h3>
                <p className="text-gray-300">
                  We currently accept ETH, BTC, SOL, MATIC, and AVAX for bidding and purchasing on our platform. We're continuously working to 
                  expand our supported cryptocurrencies to provide more options for our users.
                </p>
              </div>
              
              <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151]">
                <h3 className="text-lg font-display font-bold text-white mb-2">How secure is BidCoin?</h3>
                <p className="text-gray-300">
                  BidCoin utilizes blockchain technology for all transactions, ensuring security, transparency, and immutability. Our platform 
                  integrates with secure wallet providers and follows industry best practices for smart contract design and security audits.
                </p>
              </div>
              
              <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151]">
                <h3 className="text-lg font-display font-bold text-white mb-2">What happens after I win an auction?</h3>
                <p className="text-gray-300">
                  When you win an auction, the NFT is automatically transferred to your connected wallet via a secure smart contract transaction. 
                  You'll receive a confirmation of your purchase and can view your collection in your profile dashboard.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#1f2937] rounded-xl p-8 border border-[#374151] text-center">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Ready to Start Bidding?</h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-6">
              Join BidCoin today and discover a new way to collect unique digital assets using blockchain technology. 
              Connect your wallet, purchase BidPacks, and start bidding on exciting NFTs and ordinals.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button className="bg-primary hover:bg-primary-dark text-white">
                Explore Auctions
              </Button>
              <Button variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10">
                Learn More
              </Button>
            </div>
          </div>
        </section>
    </div>
  );
}
