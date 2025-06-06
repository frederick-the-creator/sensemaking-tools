import { Model } from "../models/model";
import { Comment, SummarizationType, Summary } from "../types";
import { SummaryStats, TopicStats } from "../stats/summary_stats";
/**
 * Summarizes comments based on the specified summarization type.
 *
 * @param model The language model to use for summarization.
 * @param comments An array of `Comment` objects containing the comments to summarize.
 * @param summarizationType The type of summarization to perform (e.g., GROUP_INFORMED_CONSENSUS).
 * @param additionalContext Optional additional instructions to guide the summarization process. These instructions will be included verbatim in the prompt sent to the LLM.
 * @returns A Promise that resolves to the generated summary string.
 * @throws {TypeError} If an unknown `summarizationType` is provided.
 */
export declare function summarizeByType(model: Model, comments: Comment[], summarizationType: SummarizationType, additionalContext?: string): Promise<Summary>;
/**
 *
 */
export declare class MultiStepSummary {
    private summaryStats;
    private model;
    private additionalContext?;
    constructor(summaryStats: SummaryStats, model: Model, additionalContext?: string);
    getSummary(): Promise<Summary>;
}
/**
 * Quantifies topic names by adding the number of associated comments in parentheses.
 *
 * @param topics An array of `TopicStats` objects.
 * @returns A map where keys are quantified topic names and values are arrays of quantified subtopic names.
 *
 * @example
 * Example input:
 * [
 *   {
 *     name: 'Topic A',
 *     commentCount: 5,
 *     subtopicStats: [
 *       { name: 'Subtopic 1', commentCount: 2 },
 *       { name: 'Subtopic 2', commentCount: 3 }
 *     ]
 *   }
 * ]
 *
 * Expected output:
 * {
 *   'Topic A (5 comments)': [
 *     'Subtopic 1 (2 comments)',
 *     'Subtopic 2 (3 comments)'
 *   ]
 * }
 */
export declare function _quantifyTopicNames(topics: TopicStats[]): {
    [key: string]: string[];
};
