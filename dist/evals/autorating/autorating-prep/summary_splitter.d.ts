/**
 * Takes a summary file where statements are linked to comment IDs (in brackets),
 * and a CSV file containing comment IDs and their text. Then generates a new CSV file
 * where each row represents a statement and its associated comments.
 *
 * @param summaryFilePath Path to the summary text file.
 * @param commentsFilePath Path to the comments CSV file with columns "comment-id" and "comment_text".
 * @param outputFilePath Path to the output CSV file that will have columns "summary" for the statement, and "comments" for the comment texts associated with that statement.
 */
export declare function splitSummaryAndLinkComments(summaryFilePath: string, commentsFilePath: string, outputFilePath: string): void;
