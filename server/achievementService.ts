import { log } from './vite';
import { db } from './db';
import { eq, and, sql } from 'drizzle-orm';
import { 
  achievements, 
  userAchievements, 
  users, 
  bids, 
  auctions, 
  Achievement, 
  UserAchievement,
  User
} from '@shared/schema';

// Types of achievement triggers
export type AchievementTrigger = 
  | { type: 'bid_placed'; userId: number; auctionId: number; bidCount?: number }
  | { type: 'auction_won'; userId: number; auctionId: number }
  | { type: 'login_streak'; userId: number; days: number }
  | { type: 'bid_count'; userId: number; count: number }
  | { type: 'collection_bid'; userId: number; collection: string }
  | { type: 'first_bid'; userId: number }
  | { type: 'first_win'; userId: number }
  | { type: 'social_share'; userId: number; platform: string };

/**
 * Service to handle achievement-related functionality
 */
export class AchievementService {
  /**
   * Initialize user achievements for a new user
   * @param userId The ID of the user
   */
  async initializeUserAchievements(userId: number): Promise<void> {
    try {
      // Get all achievements from the database
      const allAchievements = await db.select().from(achievements);
      
      // Create user achievement entries for each achievement
      for (const achievement of allAchievements) {
        await db.insert(userAchievements).values({
          userId,
          achievementId: achievement.id,
          progress: 0,
          completed: false
        });
      }
      
      log(`Initialized achievements for user ${userId}`, 'achievement');
    } catch (error) {
      log(`Error initializing achievements for user ${userId}: ${error}`, 'achievement');
    }
  }
  
  /**
   * Process an achievement trigger and update user progress
   * @param trigger The achievement trigger
   */
  async processTrigger(trigger: AchievementTrigger): Promise<UserAchievement[]> {
    try {
      // Find achievements that match the trigger type
      const relevantAchievements = await this.findRelevantAchievements(trigger);
      
      if (!relevantAchievements.length) {
        return [];
      }
      
      const userId = trigger.userId;
      const unlockedAchievements: UserAchievement[] = [];
      
      // Process each achievement
      for (const achievement of relevantAchievements) {
        // Get the user's current progress
        const [userAchievement] = await db
          .select()
          .from(userAchievements)
          .where(
            and(
              eq(userAchievements.userId, userId),
              eq(userAchievements.achievementId, achievement.id)
            )
          );
        
        if (!userAchievement) {
          // Create a new user achievement if it doesn't exist
          const [newUserAchievement] = await db
            .insert(userAchievements)
            .values({
              userId,
              achievementId: achievement.id,
              progress: 0,
              completed: false
            })
            .returning();
            
          // Continue with the newly created user achievement
          await this.updateAchievementProgress(newUserAchievement, trigger);
          continue;
        }
        
        // Skip already completed achievements
        if (userAchievement.completed) {
          continue;
        }
        
        // Update the achievement progress
        const updated = await this.updateAchievementProgress(userAchievement, trigger);
        if (updated && updated.completed) {
          // Load the full achievement details for notification
          const fullAchievement = {
            ...updated,
            achievement
          };
          unlockedAchievements.push(fullAchievement as UserAchievement);
        }
      }
      
      return unlockedAchievements;
    } catch (error) {
      log(`Error processing achievement trigger: ${error}`, 'achievement');
      return [];
    }
  }
  
  /**
   * Find achievements relevant to a specific trigger
   * @param trigger The achievement trigger
   */
  private async findRelevantAchievements(trigger: AchievementTrigger): Promise<Achievement[]> {
    try {
      // Filter achievements based on trigger type
      switch (trigger.type) {
        case 'bid_placed':
          return db
            .select()
            .from(achievements)
            .where(eq(achievements.type, 'bid'));
          
        case 'auction_won':
          return db
            .select()
            .from(achievements)
            .where(eq(achievements.type, 'auction'));
          
        case 'login_streak':
          return db
            .select()
            .from(achievements)
            .where(eq(achievements.type, 'login'));
          
        case 'bid_count':
          return db
            .select()
            .from(achievements)
            .where(eq(achievements.type, 'bid'));
          
        case 'collection_bid':
          return db
            .select()
            .from(achievements)
            .where(eq(achievements.type, 'collection'));
          
        case 'first_bid':
        case 'first_win':
          return db
            .select()
            .from(achievements)
            .where(eq(achievements.type, 'milestone'));
          
        case 'social_share':
          return db
            .select()
            .from(achievements)
            .where(eq(achievements.type, 'social'));
          
        default:
          return [];
      }
    } catch (error) {
      log(`Error finding relevant achievements: ${error}`, 'achievement');
      return [];
    }
  }
  
  /**
   * Update a user's achievement progress based on a trigger
   * @param userAchievement The user achievement to update
   * @param trigger The achievement trigger
   */
  private async updateAchievementProgress(
    userAchievement: Omit<UserAchievement, 'achievement' | 'user'>,
    trigger: AchievementTrigger
  ): Promise<Omit<UserAchievement, 'achievement' | 'user'> | null> {
    try {
      // Get the achievement details
      const [achievement] = await db
        .select()
        .from(achievements)
        .where(eq(achievements.id, userAchievement.achievementId));
      
      if (!achievement) {
        return null;
      }
      
      // Extract condition from the achievement
      const condition = achievement.condition as Record<string, any>;
      
      // Calculate new progress
      let newProgress = userAchievement.progress;
      let completed = userAchievement.completed;
      
      switch (trigger.type) {
        case 'bid_placed':
          if (achievement.type === 'bid') {
            // Increment progress for bid-related achievements
            newProgress += 1;
          }
          break;
          
        case 'auction_won':
          if (achievement.type === 'auction') {
            // Increment progress for auction-related achievements
            newProgress += 1;
          }
          break;
          
        case 'login_streak':
          if (achievement.type === 'login' && condition.days <= trigger.days) {
            // Set completed directly for login streak achievements
            completed = true;
            newProgress = condition.days;
          }
          break;
          
        case 'bid_count':
          if (achievement.type === 'bid' && condition.count) {
            // Set progress to the actual bid count
            newProgress = trigger.count;
          }
          break;
          
        case 'collection_bid':
          if (achievement.type === 'collection' && condition.collection === trigger.collection) {
            // Increment for specific collection bids
            newProgress += 1;
          }
          break;
          
        case 'first_bid':
          if (achievement.type === 'milestone' && condition.type === 'first_bid') {
            // Set completed directly for milestone achievements
            completed = true;
            newProgress = 1;
          }
          break;
          
        case 'first_win':
          if (achievement.type === 'milestone' && condition.type === 'first_win') {
            // Set completed directly for milestone achievements
            completed = true;
            newProgress = 1;
          }
          break;
          
        case 'social_share':
          if (achievement.type === 'social' && (!condition.platform || condition.platform === trigger.platform)) {
            // Increment for social shares
            newProgress += 1;
          }
          break;
      }
      
      // Check if the achievement is completed
      if (!completed && condition.target && newProgress >= condition.target) {
        completed = true;
      }
      
      // Update the user achievement
      const [updatedUserAchievement] = await db
        .update(userAchievements)
        .set({
          progress: newProgress,
          completed,
          completedAt: completed ? new Date() : null
        })
        .where(
          and(
            eq(userAchievements.userId, userAchievement.userId),
            eq(userAchievements.achievementId, userAchievement.achievementId)
          )
        )
        .returning();
      
      // Log achievement completion
      if (completed && !userAchievement.completed) {
        log(`User ${userAchievement.userId} unlocked achievement: ${achievement.name}`, 'achievement');
      }
      
      return updatedUserAchievement;
    } catch (error) {
      log(`Error updating achievement progress: ${error}`, 'achievement');
      return null;
    }
  }
  
  /**
   * Get all achievements for a user
   * @param userId The ID of the user
   */
  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    try {
      const userAchievementsData = await db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId));
      
      // Load achievement details for each user achievement
      const result: UserAchievement[] = [];
      
      for (const userAchievement of userAchievementsData) {
        const [achievement] = await db
          .select()
          .from(achievements)
          .where(eq(achievements.id, userAchievement.achievementId));
        
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));
        
        if (achievement && user) {
          result.push({
            ...userAchievement,
            achievement,
            user
          });
        }
      }
      
      return result;
    } catch (error) {
      log(`Error getting user achievements: ${error}`, 'achievement');
      return [];
    }
  }
  
  /**
   * Get user achievements statistics
   * @param userId The ID of the user
   */
  async getUserAchievementStats(userId: number): Promise<{
    completed: number;
    total: number;
    points: number;
    nextAchievements: UserAchievement[];
  }> {
    try {
      const userAchievementsData = await this.getUserAchievements(userId);
      
      const completedAchievements = userAchievementsData.filter(ua => ua.completed);
      const inProgressAchievements = userAchievementsData.filter(ua => !ua.completed);
      
      // Calculate total points from completed achievements
      const points = completedAchievements.reduce((sum, ua) => sum + ua.achievement.points, 0);
      
      // Find achievements close to completion (progress > 0)
      const nextAchievements = inProgressAchievements
        .filter(ua => ua.progress > 0)
        .sort((a, b) => {
          const aCondition = a.achievement.condition as Record<string, any>;
          const bCondition = b.achievement.condition as Record<string, any>;
          
          const aPercentage = aCondition.target ? a.progress / aCondition.target : 0;
          const bPercentage = bCondition.target ? b.progress / bCondition.target : 0;
          
          return bPercentage - aPercentage; // Sort by highest percentage first
        })
        .slice(0, 3); // Get top 3 closest to completion
      
      return {
        completed: completedAchievements.length,
        total: userAchievementsData.length,
        points,
        nextAchievements
      };
    } catch (error) {
      log(`Error getting user achievement stats: ${error}`, 'achievement');
      return {
        completed: 0,
        total: 0,
        points: 0,
        nextAchievements: []
      };
    }
  }
  
  /**
   * Update user bid count achievements
   * @param userId The ID of the user
   */
  async updateBidCountAchievements(userId: number): Promise<void> {
    try {
      // Count total bids for the user
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(bids)
        .where(eq(bids.bidderId, userId));
      
      if (result) {
        // Process bid count trigger
        await this.processTrigger({
          type: 'bid_count',
          userId,
          count: result.count
        });
      }
    } catch (error) {
      log(`Error updating bid count achievements: ${error}`, 'achievement');
    }
  }
  
  /**
   * Check for first-time achievements after a user action
   * @param userId The ID of the user
   * @param type The type of action ('bid' or 'win')
   */
  async checkFirstTimeAchievement(userId: number, type: 'bid' | 'win'): Promise<void> {
    try {
      if (type === 'bid') {
        // Check if this is the user's first bid
        const [result] = await db
          .select({ count: sql<number>`count(*)` })
          .from(bids)
          .where(eq(bids.bidderId, userId));
        
        if (result && result.count === 1) {
          // Process first bid trigger
          await this.processTrigger({
            type: 'first_bid',
            userId
          });
        }
      } else if (type === 'win') {
        // Check if this is the user's first win
        const [result] = await db
          .select({ count: sql<number>`count(*)` })
          .from(auctions)
          .where(
            and(
              eq(auctions.lastBidderId, userId),
              eq(auctions.status, 'settled')
            )
          );
        
        if (result && result.count === 1) {
          // Process first win trigger
          await this.processTrigger({
            type: 'first_win',
            userId
          });
        }
      }
    } catch (error) {
      log(`Error checking first-time achievement: ${error}`, 'achievement');
    }
  }
}

export const achievementService = new AchievementService();