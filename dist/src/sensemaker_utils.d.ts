import { Comment, CommentRecord, SummaryContent, Topic } from "./types";
/**
 * Rerun a function multiple times.
 * @param func the function to attempt
 * @param isValid checks that the response from func is valid
 * @param maxRetries the maximum number of times to retry func
 * @param errorMsg the error message to throw
 * @param retryDelayMS how long to wait in miliseconds between calls
 * @param funcArgs the args for func and isValid
 * @param isValidArgs the args for isValid
 * @returns the valid response from func
 */
export declare function retryCall<T>(func: (...args: any[]) => Promise<T>, isValid: (response: T, ...args: any[]) => boolean, maxRetries: number, errorMsg: string, retryDelayMS: number | undefined, funcArgs: any[], isValidArgs: any[]): Promise<T>;
/**
 * Combines the data and instructions into a prompt to send to Vertex.
 * @param instructions: what the model should do.
 * @param data: the data that the model should consider.
 * @param additionalContext additional context to include in the prompt.
 * @param dataWrapper: a function for wrapping each data entry
 * @returns the instructions and the data as a text
 */
export declare function getAbstractPrompt<T>(instructions: string, data: T[], dataWrapper: (data: T) => string, additionalContext?: string): string;
/**
 * Combines the data and instructions into a prompt to send to Vertex.
 * @param instructions: what the model should do.
 * @param data: the data that the model should consider.
 * @param additionalContext additional context to include in the prompt.
 * @returns the instructions and the data as a text
 */
export declare function getPrompt(instructions: string, data: string[], additionalContext?: string): string;
/**
 * Utility function for formatting the comments together with vote tally data
 * @param commentData: the data to summarize, as an array of Comment objects
 * @returns: comments, together with vote tally information as JSON
 */
export declare function formatCommentsWithVotes(commentData: Comment[]): string[];
/**
 * Converts the given commentRecords to Comments.
 * @param commentRecords what to convert to Comments
 * @param missingTexts the original comments with IDs match the commentRecords
 * @returns a list of Comments with all possible fields from commentRecords.
 */
export declare function hydrateCommentRecord(commentRecords: CommentRecord[], missingTexts: Comment[]): Comment[];
/**
 * Groups categorized comments by topic and subtopic.
 *
 * @param categorized An array of categorized comments.
 * @returns A JSON representing the comments grouped by topic and subtopic.
 *
 * Example:
 * {
 *   "Topic 1": {
 *     "Subtopic 2": {
 *       "id 1": "comment 1",
 *       "id 2": "comment 2"
 *     }
 *   }
 * }
 *
 * TODO: create a similar function to group comments by topics only.
 */
export declare function groupCommentsBySubtopic(categorized: Comment[]): {
    [topicName: string]: {
        [subtopicName: string]: {
            [commentId: string]: Comment;
        };
    };
};
/**
 * Gets a set of unique topics and subtopics from a list of comments.
 * @param comments the comments with topics and subtopics to consider
 * @returns a set of unique topics and subtopics
 */
export declare function getUniqueTopics(comments: Comment[]): Topic[];
/**
 * Format a decimal number as a percent string with the given precision
 * @param decimal The decimal number to convert
 * @param precision The precision
 * @returns A string representing the equivalent percentage
 */
export declare function decimalToPercent(decimal: number, precision?: number): string;
/**
 * Interface for specifying an extra column for a markdown table, as a columnName and
 * getValue function.
 */
export interface ColumnDefinition {
    columnName: string;
    getValue: (comment: Comment) => any;
}
/**
 * Returns a markdown table of comment data for inspection and debugging.
 * @param comments An array of Comment objects to include in the table.
 * @param extraColumns An array of keys of the comment objects to add as table cells.
 * @returns A string containing the markdown table.
 */
export declare function commentTableMarkdown(comments: Comment[], extraColumns?: (keyof Comment | ColumnDefinition)[]): string;
/**
 * Executes a batch of asynchronous functions (callbacks) concurrently.
 * This is essential for running multiple LLM calls in parallel, as it submits requests downstream as a batch.
 *
 * @param callbacks A batch of functions, each of which returns a Promise<T>.
 * @returns A Promise that resolves to an array containing the resolved values of the
 * promises returned by the callbacks, in the same order as the callbacks.
 */
export declare function executeConcurrently<T>(callbacks: (() => Promise<T>)[]): Promise<T[]>;
/**
 * This function creates a copy of the input summaryContent object, filtering out
 * any subContents according to filterFn, as appropriate
 * @param summaryContent Input summary content
 * @returns the resulting summary conten, as a new data structure
 */
export declare function filterSummaryContent(summaryContent: SummaryContent, filterFn: (s: SummaryContent) => boolean): SummaryContent;
