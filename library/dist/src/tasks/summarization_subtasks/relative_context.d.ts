import { SummaryStats, TopicStats } from "../../stats/summary_stats";
/**
 * Holds information for the relative agreement and engagement across all pieces of the summary.
 */
export declare class RelativeContext {
  averageHighAgreeRate: number;
  highAgreeStdDeviation: number;
  maxCommentCount: number;
  maxVoteCount: number;
  engagementStdDeviation: number;
  averageEngagement: number;
  constructor(topicStats: TopicStats[]);
  /**
   * Get the rate of all comments being considered high agreement (both all agree and all disagree)
   * @param summaryStats the subset of comments to consider
   * @returns the count of all potential high agreement comments.
   */
  private getHighAgreementRate;
  getRelativeEngagement(summaryStats: SummaryStats): string;
  /**
   * Gets an engagement number that weighs votes and comment counts equally.
   *
   * This is done by normalizing the vote count to be in the range 0-1 and the comment count to be
   * in the range 0-1. Then these numbers are added together to get a score from 0-2 with 2 being
   * the max value.
   *
   * @param summaryStats the comments and votes to consider for engagement
   * @returns the engagement number from 0-2 for the comments.
   */
  private getEngagementNumber;
  getRelativeAgreement(summaryStats: SummaryStats): string;
}
