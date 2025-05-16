import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, Award, Lock } from "lucide-react";
import useWallet from "@/hooks/useWallet";
import { getUserByWalletAddress } from "@/lib/api";

// Achievement types
interface Achievement {
  id: number;
  name: string;
  description: string;
  points: number;
  tier: string;
  icon: string;
  criteria: string;
  targetValue: number;
}

interface UserAchievement {
  id: number;
  userId: number;
  achievementId: number;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  achievement: Achievement;
}

interface AchievementStats {
  completed: number;
  total: number;
  points: number;
  nextAchievements: UserAchievement[];
}

export default function UserAchievements() {
  const { address } = useWallet();
  const [userId, setUserId] = useState<number | null>(null);

  // Fetch the user by wallet address
  const { data: user } = useQuery({
    queryKey: ["/api/users/by-wallet", address],
    queryFn: () => getUserByWalletAddress(address || ""),
    enabled: !!address,
  });

  // Set user ID when the user data is loaded
  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, [user]);

  // Fetch user achievements
  const { data: userAchievements, isLoading: isAchievementsLoading } = useQuery({
    queryKey: ["/api/users", userId, "achievements"],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/achievements`);
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch user achievement stats
  const { data: achievementStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/users", userId, "achievement-stats"],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/achievement-stats`);
      return response.json();
    },
    enabled: !!userId,
  });

  // Helper function to render achievement icon
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "trophy":
        return <Trophy className="h-6 w-6 text-yellow-400" />;
      case "star":
        return <Star className="h-6 w-6 text-blue-400" />;
      case "award":
        return <Award className="h-6 w-6 text-green-400" />;
      default:
        return <Trophy className="h-6 w-6 text-primary" />;
    }
  };

  // Helper function to render tier badge
  const renderTierBadge = (tier: string) => {
    let colorClass = "";
    
    switch (tier.toLowerCase()) {
      case "bronze":
        colorClass = "bg-amber-700 hover:bg-amber-800";
        break;
      case "silver":
        colorClass = "bg-gray-400 hover:bg-gray-500";
        break;
      case "gold":
        colorClass = "bg-yellow-500 hover:bg-yellow-600";
        break;
      case "platinum":
        colorClass = "bg-blue-400 hover:bg-blue-500";
        break;
      case "diamond":
        colorClass = "bg-purple-500 hover:bg-purple-600";
        break;
      default:
        colorClass = "bg-primary hover:bg-primary-dark";
    }
    
    return (
      <Badge className={colorClass}>
        {tier}
      </Badge>
    );
  };

  if (!address) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-white mb-2">Connect Wallet to View Achievements</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          Connect your wallet to track your bidding achievements and earn rewards.
        </p>
      </div>
    );
  }

  if (isAchievementsLoading || isStatsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Achievement Stats Card */}
      {achievementStats && (
        <Card className="bg-[#1f2937] border-[#374151]">
          <CardHeader>
            <CardTitle className="text-white">Achievement Progress</CardTitle>
            <CardDescription>
              Track your bidding achievements and milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#111827] rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Completed</p>
                <p className="text-2xl font-bold text-white">
                  {achievementStats.completed} / {achievementStats.total}
                </p>
              </div>
              <div className="bg-[#111827] rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-white">
                  {Math.round((achievementStats.completed / achievementStats.total) * 100)}%
                </p>
              </div>
              <div className="bg-[#111827] rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Total Points</p>
                <p className="text-2xl font-bold text-white">
                  {achievementStats.points}
                </p>
              </div>
            </div>
            
            {achievementStats.nextAchievements.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-3">Next Achievements</h4>
                <div className="space-y-3">
                  {achievementStats.nextAchievements.slice(0, 3).map((ua) => (
                    <div key={ua.id} className="bg-[#111827] p-3 rounded-lg flex items-center">
                      <div className="mr-3">
                        {renderIcon(ua.achievement.icon)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white font-medium">{ua.achievement.name}</p>
                          <span className="text-gray-400 text-sm">
                            {ua.progress} / {ua.achievement.targetValue}
                          </span>
                        </div>
                        <Progress
                          value={(ua.progress / ua.achievement.targetValue) * 100}
                          className="h-2 bg-gray-700"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Achievement List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userAchievements && userAchievements.map((ua: UserAchievement) => (
          <Card
            key={ua.id}
            className={`overflow-hidden border ${
              ua.completed
                ? "bg-[#1f2937] border-[#374151]"
                : "bg-[#1f2937]/60 border-[#374151]/60"
            }`}
          >
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center mb-2">
                    <div className="mr-2">
                      {ua.completed ? (
                        renderIcon(ua.achievement.icon)
                      ) : (
                        <Lock className="h-6 w-6 text-gray-500" />
                      )}
                    </div>
                    <div className="flex items-center">
                      <h3 className={`font-medium ${ua.completed ? "text-white" : "text-gray-400"}`}>
                        {ua.achievement.name}
                      </h3>
                      <div className="ml-2">
                        {renderTierBadge(ua.achievement.tier)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-primary font-medium">
                      {ua.achievement.points} pts
                    </span>
                  </div>
                </div>
                <p className={`text-sm ${ua.completed ? "text-gray-300" : "text-gray-500"}`}>
                  {ua.achievement.description}
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{ua.progress} / {ua.achievement.targetValue}</span>
                    <span>{Math.round((ua.progress / ua.achievement.targetValue) * 100)}%</span>
                  </div>
                  <Progress
                    value={(ua.progress / ua.achievement.targetValue) * 100}
                    className="h-2 bg-gray-700"
                  />
                </div>
                {ua.completed && ua.completedAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    Completed on {new Date(ua.completedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}