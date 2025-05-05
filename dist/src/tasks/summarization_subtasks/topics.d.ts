import { RecursiveSummary } from "./recursive_summarization";
import { SummaryContent } from "../../types";
import { Model } from "../../models/model";
import { SummaryStats, TopicStats } from "../../stats/summary_stats";
import { RelativeContext } from "./relative_context";
/**
 * This RecursiveSummary subclass constructs a top level "Topics" summary section,
 * calling out to the separate TopicSummary and SubtopicSummary classes to generate
 * content for individual subsections corresponding to specific topics and subtopics.
 */
export declare class AllTopicsSummary extends RecursiveSummary<SummaryStats> {
    getSummary(): Promise<SummaryContent>;
}
/**
 * This RecursiveSummary subclass generates summaries for individual topics.
 */
export declare class TopicSummary extends RecursiveSummary<SummaryStats> {
    topicStat: TopicStats;
    relativeContext: RelativeContext;
    constructor(topicStat: TopicStats, model: Model, relativeContext: RelativeContext, additionalContext?: string);
    getSummary(): Promise<SummaryContent>;
    /**
     * Returns the section title for this topics summary section of the final report
     */
    getSectionTitle(): string;
    /**
     * When subtopics are present, compiles the individual summaries for those subtopics
     * @returns a promise of the summary string
     */
    getAllSubTopicSummaries(): Promise<SummaryContent>;
    /**
     * Summarizes the comments associated with the given topic
     * @returns a promise of the summary string
     */
    getCommentSummary(): Promise<SummaryContent>;
    /**
     * Summarizes the themes that recur across all comments
     * @returns a single sentence describing the themes, without citations.
     */
    getThemesSummary(): Promise<SummaryContent>;
    /**
     * Summarizes the comments on which there was the strongest agreement.
     * @returns a short paragraph describing the similarities, including comment citations.
     */
    getCommonGroundSummary(topic: string): Promise<SummaryContent>;
    /**
     * Summarizes the comments on which there was the strongest disagreement.
     * @returns a short paragraph describing the differences, including comment citations.
     */
    getDifferencesOfOpinionSummary(commonGroundSummary: SummaryContent, topic: string): Promise<SummaryContent>;
}
/**
 * This TopicSummary subclass contains overrides for subtopics. At present, this is just an
 * override for the section title, but may evolve to different on other functionality.
 */
export declare class SubtopicSummary extends TopicSummary {
    getSectionTitle(): string;
}
