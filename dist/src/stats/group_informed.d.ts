import { Comment, CommentWithVoteInfo } from "../types";
import { SummaryStats } from "./summary_stats";
/**
 * This child class of the SummaryStats class provides the same abstract purpose
 * (that is, serving as the interface to the RecursiveSummary abstraction),
 * but is specifically tailored to group based summarization.
 */
export declare class GroupedSummaryStats extends SummaryStats {
    asProbabilityEstimate: boolean;
    /**
     * An override of the SummaryStats static factory method,
     * to allow for GroupedSummaryStats specific initialization.
     */
    static create(comments: Comment[]): GroupedSummaryStats;
    /**
     * Returns the top k comments according to the given metric.
     */
    topK(sortBy: (comment: CommentWithVoteInfo) => number, k?: number, filterFn?: (comment: CommentWithVoteInfo) => boolean): Comment[];
    /** Returns a score indicating how well a comment represents the common ground. */
    getCommonGroundScore(comment: CommentWithVoteInfo): number;
    /**
     * Gets the topK agreed upon comments across all groups.
     *
     * This is measured via the getGroupInformedConsensus metric, subject to the constraints of
     * this.minVoteCount and this.minAgreeProbCommonGround settings.
     * @param k dfaults to this.maxSampleSize
     * @returns the top agreed on comments
     */
    getCommonGroundComments(k?: number): Comment[];
    meetsCommonGroundAgreeThreshold(comment: CommentWithVoteInfo): boolean;
    getCommonGroundAgreeScore(comment: CommentWithVoteInfo): number;
    /**
     * Gets the topK agreed upon comments across all groups.
     *
     * This is measured via the getGroupInformedConsensus metric, subject to the constraints of
     * this.minVoteCount and this.minAgreeProbCommonGround settings.
     * @param k dfaults to this.maxSampleSize
     * @returns the top agreed on comments
     */
    getCommonGroundAgreeComments(k?: number): Comment[];
    getCommonGroundNoCommentsMessage(): string;
    /**
     * Gets the topK disagreed upon comments across all groups.
     *
     * This is measured via the getGroupInformedDisagreeConsensus metric, subject to the constraints of
     * this.minVoteCount and this.minAgreeProbCommonGround settings.
     * @param k dfaults to this.maxSampleSize
     * @returns the top disagreed on comments
     */
    getCommonGroundDisagreeComments(k?: number): Comment[];
    meetsCommonGroundDisagreeThreshold(comment: CommentWithVoteInfo): boolean;
    /**
     * Sort through the comments with the highest getGroupAgreeDifference for the corresponding group,
     * subject to this.minVoteCount, not matching the common ground comment set by this.minAgreeProbCommonGround,
     * and this.minAgreeProbDifference
     * @param group The name of a single group
     * @param k dfaults to this.maxSampleSize
     * @returns The corresponding set of comments
     */
    getGroupRepresentativeComments(group: string, k?: number): Comment[];
    /** Returns a score indicating how well a comment represents a difference of opinions. */
    getDifferenceOfOpinionScore(comment: CommentWithVoteInfo): number;
    /**
     * Returns the top K comments that best distinguish differences of opinion between groups.
     *
     * This is computed as the difference in how likely each group is to agree with a given comment
     * as compared with the rest of the participant body, as computed by the getGroupAgreeDifference method,
     * and subject to this.minVoteCount, this.minAgreeProbCommonGround and this.minAgreeProbDifference.
     *
     * @param k the number of comments to find, this is a maximum and is not guaranteed
     * @returns the top disagreed on comments
     */
    getDifferenceOfOpinionComments(k?: number): Comment[];
    getDifferencesOfOpinionNoCommentsMessage(): string;
    /** Returns a score indicating how well a comment represents an uncertain viewpoint based on pass
     *  votes. This is not based on groups. */
    getUncertainScore(comment: CommentWithVoteInfo): number;
    /**
     * Gets the topK uncertain comments based on pass votes.
     *
     * @param k the number of comments to get
     * @returns the top uncertain comments
     */
    getUncertainComments(k?: number): Comment[];
    getStatsByGroup(): GroupStats[];
}
/**
 * Represents statistics about a group.
 */
export interface GroupStats {
    name: string;
    voteCount: number;
}
