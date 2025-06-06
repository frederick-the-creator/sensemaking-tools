import { Summary, Comment, Topic } from "../src/types";
/**
 * Core comment columns, sans any vote tally rows
 */
type CoreCommentCsvRow = {
    index: number;
    timestamp: number;
    datetime: string;
    "comment-id": number;
    "author-id": number;
    agrees: number;
    disagrees: number;
    moderated: number;
    comment_text: string;
    passes: number;
    topics: string;
    topic: string;
    subtopic: string;
};
type VoteTallyGroupKey = `${string}-agree-count` | `${string}-disagree-count` | `${string}-pass-count`;
export interface VoteTallyCsvRow {
    [key: VoteTallyGroupKey]: number;
}
export type CommentCsvRow = VoteTallyCsvRow & CoreCommentCsvRow;
/**
 * Outputs a CSV where each row represents a statement and its associated comments.
 *
 * @param summary the summary to split.
 * @param outputFilePath Path to the output CSV file that will have columns "summary" for the statement, and "comments" for the comment texts associated with that statement.
 */
export declare function writeSummaryToGroundedCSV(summary: Summary, outputFilePath: string): void;
/**
 * Identify topics and subtopics when input data has not already been categorized.
 * @param project The Vertex GCloud project name
 * @param comments The comments from which topics need to be identified
 * @returns Promise resolving to a Topic collection containing the newly discovered topics and subtopics for the given comments
 */
export declare function getTopicsAndSubtopics(project: string, comments: Comment[]): Promise<Topic[]>;
/**
 * Runs the summarization routines for the data set.
 * @param project The Vertex GCloud project name
 * @param comments The comments to summarize
 * @param topics The input topics to categorize against
 * @param additionalContext Additional context about the conversation to pass through
 * @returns Promise resolving to a Summary object containing the summary of the comments
 */
export declare function getSummary(project: string, comments: Comment[], topics?: Topic[], additionalContext?: string): Promise<Summary>;
export declare function writeSummaryToHtml(summary: Summary, outputFile: string): void;
export declare function concatTopics(comment: Comment): string;
/**
 * Parse a topics string from the categorization_runner.ts into a (possibly) nested topics
 * array, omitting subtopics and subsubtopics if not present in the labels.
 * @param topicsString A string in the format Topic1:Subtopic1:A;Topic2:Subtopic2.A
 * @returns Nested Topic structure
 */
export declare function parseTopicsString(topicsString: string): Topic[];
/**
 * Gets comments from a CSV file, in the style of the output from the input processing files
 * in the project's `bin/` directory. Core CSV rows are as for `CoreCommentCsvRow`, plus any
 * vote tallies in `VoteTallyCsvRow`.
 * @param inputFilePath
 * @returns
 */
export declare function getCommentsFromCsv(inputFilePath: string): Promise<Comment[]>;
export declare function getTopicsFromComments(comments: Comment[]): Topic[];
export {};
