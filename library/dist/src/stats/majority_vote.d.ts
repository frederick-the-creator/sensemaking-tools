import { Comment, CommentWithVoteInfo } from "../types";
import { SummaryStats } from "./summary_stats";
export declare class MajoritySummaryStats extends SummaryStats {
  minCommonGroundProb: number;
  minDifferenceProb: number;
  maxDifferenceProb: number;
  includePasses: boolean;
  groupBasedSummarization: boolean;
  asProbabilityEstimate: boolean;
  uncertaintyBuffer: number;
  /**
   * An override of the SummaryStats static factory method,
   * to allow for MajoritySummaryStats specific initialization.
   */
  static create(comments: Comment[]): MajoritySummaryStats;
  /**
   * Returns the top k comments according to the given metric.
   */
  topK(
    sortBy: (comment: CommentWithVoteInfo) => number,
    k?: number,
    filterFn?: (comment: CommentWithVoteInfo) => boolean
  ): Comment[];
  /** Returns a score indicating how well a comment represents when everyone agrees. */
  getCommonGroundAgreeScore(comment: CommentWithVoteInfo): number;
  /** Returns a score indicating how well a comment represents the common ground. */
  getCommonGroundScore(comment: CommentWithVoteInfo): number;
  meetsCommonGroundAgreeThreshold(comment: CommentWithVoteInfo): boolean;
  /**
   * Gets the topK agreed upon comments based on highest % of agree votes.
   *
   * @param k the number of comments to get
   * @returns the top agreed on comments
   */
  getCommonGroundAgreeComments(k?: number): Comment[];
  /**
   * Gets the topK common ground comments where either everyone agrees or everyone disagrees.
   *
   * @param k the number of comments to get
   * @returns the top common ground comments
   */
  getCommonGroundComments(k?: number): Comment[];
  getCommonGroundNoCommentsMessage(): string;
  /** Returns a score indicating how well a comment represents an uncertain viewpoint based on pass
   *  votes */
  getUncertainScore(comment: CommentWithVoteInfo): number;
  /**
   * Gets the topK uncertain comments based on pass votes.
   *
   * @param k the number of comments to get
   * @returns the top uncertain comments
   */
  getUncertainComments(k?: number): Comment[];
  meetsCommonGroundDisagreeThreshold(comment: CommentWithVoteInfo): boolean;
  /**
   * Gets the topK disagreed upon comments across.
   *
   * @param k dfaults to this.maxSampleSize
   * @returns the top disagreed on comments
   */
  getCommonGroundDisagreeComments(k?: number): Comment[];
  /** Returns a score indicating how well a comment represents a difference of opinions. This
   * score prioritizes comments where the agreement rate and disagreement rate are
   * both high, and the pass rate is low.*/
  getDifferenceOfOpinionScore(comment: CommentWithVoteInfo): number;
  /**
   * Gets the topK agreed upon comments based on highest % of agree votes.
   *
   * @param k the number of comments to get
   * @returns the top differences of opinion comments
   */
  getDifferenceOfOpinionComments(k?: number): Comment[];
  getDifferencesOfOpinionNoCommentsMessage(): string;
}
