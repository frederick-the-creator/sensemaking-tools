import { Comment, CommentWithVoteInfo } from "../types";
/**
 * This class is the input interface for the RecursiveSummary abstraction, and
 * therefore the vessel through which all data is ultimately communicated to
 * the individual summarization routines.
 */
export declare abstract class SummaryStats {
    comments: Comment[];
    filteredComments: CommentWithVoteInfo[];
    minCommonGroundProb: number;
    minAgreeProbDifference: number;
    minUncertaintyProb: number;
    maxSampleSize: number;
    minVoteCount: number;
    groupBasedSummarization: boolean;
    constructor(comments: Comment[]);
    /**
     * A static factory method that creates a new instance of SummaryStats
     * or a subclass. This is meant to be overriden by subclasses.
     */
    static create(comments: Comment[]): SummaryStats;
    /**
     * Get the top common ground comments that everyone either agrees on or disagrees on.
     * @param k the number of comments to return
     */
    abstract getCommonGroundComments(k?: number): Comment[];
    /** Returns a score indicating how well a comment represents the common ground. */
    abstract getCommonGroundScore(comment: Comment): number;
    /**
     * Get the top common ground comments that everyone agrees on.
     * @param k the number of comments to return
     */
    abstract getCommonGroundAgreeComments(k?: number): Comment[];
    /**
     * Returns an error message explaining why no common ground comments were found. The
     * requirements for inclusion and thresholds are typically mentioned.
     */
    abstract getCommonGroundNoCommentsMessage(): string;
    /** Get the top common ground comments that everyone disagrees on.
     * @param k the number of comments to return
     */
    abstract getCommonGroundDisagreeComments(k?: number): Comment[];
    /**
     * Based on how the implementing class defines it, get the top disagreed on comments.
     * @param k the number of comments to return.
     */
    abstract getDifferenceOfOpinionComments(k?: number): Comment[];
    /** Returns a score indicating how well a comment represents a difference of opinions. */
    abstract getDifferenceOfOpinionScore(comment: Comment): number;
    /**
     * Gets the topK uncertain comments.
     * @param k the number of comments to get
     */
    abstract getUncertainComments(k?: number): Comment[];
    /** Returns a score indicating how well a comment represents an uncertain viewpoint */
    abstract getUncertainScore(comment: Comment): number;
    /**
     * Returns an error message explaining why no differences of opinion comments were found. The
     * requirements for inclusion and thresholds are typically mentioned.
     */
    abstract getDifferencesOfOpinionNoCommentsMessage(): string;
    get voteCount(): number;
    get commentCount(): number;
    get containsSubtopics(): boolean;
    /**
     * Returns the top k comments according to the given metric.
     */
    topK(sortBy: (comment: Comment) => number, k?: number, filterFn?: (comment: Comment) => boolean): Comment[];
    /**
     * Sorts topics and their subtopics based on comment count, with
     * "Other" topics and subtopics going last in sortByDescendingCount order.
     * @param topicStats what to sort
     * @param sortByDescendingCount whether to sort by comment count sortByDescendingCount or ascending
     * @returns the topics and subtopics sorted by comment count
     */
    private sortTopicStats;
    /**
     * Gets a sorted list of stats for each topic and subtopic.
     *
     * @returns A list of TopicStats objects sorted by comment count with "Other" topics last.
     */
    getStatsByTopic(): TopicStats[];
}
/**
 * Represents statistics about a topic and its subtopics.
 */
export interface TopicStats {
    name: string;
    commentCount: number;
    subtopicStats?: TopicStats[];
    summaryStats: SummaryStats;
}
