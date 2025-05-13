import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getActivity } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { Activity, ActivityType } from "@shared/schema";

function getActivityBadgeColor(type: ActivityType) {
  switch (type) {
    case "bid":
      return "bg-primary/20 text-primary";
    case "purchase":
      return "bg-secondary/20 text-secondary";
    case "listing":
      return "bg-accent/20 text-accent";
    case "bid-increase":
      return "bg-purple-500/20 text-purple-400";
    default:
      return "bg-primary/20 text-primary";
  }
}

function getActivityLabel(type: ActivityType) {
  switch (type) {
    case "bid":
      return "Bid Placed";
    case "purchase":
      return "Purchase";
    case "listing":
      return "Listing";
    case "bid-increase":
      return "Bid Increase";
    default:
      return "Activity";
  }
}

export default function AuctionHistory() {
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ["/api/activity"],
    queryFn: getActivity,
  });

  if (isLoading) {
    return (
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold text-white">Recent Activity</h2>
          <Link href="/activity">
            <a className="text-primary hover:text-[#818cf8] font-medium text-sm flex items-center">
              View All 
              <i className="fa-solid fa-arrow-right ml-2"></i>
            </a>
          </Link>
        </div>
        <div className="bg-[#1f2937] rounded-xl p-4 animate-pulse">
          <div className="h-10 bg-[#374151] rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-[#374151] rounded"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !activities) {
    return (
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold text-white">Recent Activity</h2>
        </div>
        <div className="bg-[#1f2937] rounded-xl p-8 text-center">
          <p className="text-white mb-2">Failed to load activity data</p>
          <p className="text-gray-400">Please try again later</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display font-bold text-white">Recent Activity</h2>
        <Link href="/activity">
          <a className="text-primary hover:text-[#818cf8] font-medium text-sm flex items-center">
            View All 
            <i className="fa-solid fa-arrow-right ml-2"></i>
          </a>
        </Link>
      </div>
      
      <div className="bg-[#1f2937] rounded-xl overflow-hidden border border-[#374151]">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#374151]">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#374151]">
              {activities.slice(0, 4).map((activity) => (
                <tr key={activity.id} className="hover:bg-[#374151]/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-md overflow-hidden mr-3">
                        <img src={activity.nft.imageUrl} alt={`${activity.nft.name} thumbnail`} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{activity.nft.name}</div>
                        <div className="text-xs text-gray-400">Ordinal #{activity.nft.tokenId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActivityBadgeColor(activity.type)}`}>
                      {getActivityLabel(activity.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {activity.price} {activity.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{activity.from}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{activity.to}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {formatRelativeTime(activity.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
