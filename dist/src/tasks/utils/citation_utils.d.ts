import { Comment } from "../../types";
/**
 * Create citations for comments in the format of "[12, 43, 56]"
 * @param comments the comments to use for citations
 * @returns the formatted citations as a string
 */
export declare function getCommentCitations(comments: Comment[]): string;
/**
 * Get the text that should be visible on hover for a citation.
 *
 * This includes the text and vote information.
 *
 * @param comment the comment to use for the numbers and text.
 * @returns
 */
export declare function commentCitationHoverOver(comment: Comment): string;
/**
 * Utility function for displaying a concise textual summary of a comment as Markdown
 *
 * This includes the text and vote information.
 *
 * @param comment
 * @returns the summary as a string
 */
export declare function commentCitation(comment: Comment): string;
/**
 * Display a summary of a comment (text and votes) as a citation in HTML.
 * @param comment the comment to summarize
 * @returns the html element with the comment id and more info on hover over.
 */
export declare function commentCitationHtml(comment: Comment): string;
/**
 * Utility function for displaying a concise textual summary of the vote tally patterns for a given comment
 * @param comment the comment with the VoteInfo to display
 * @returns the summary as a string
 */
export declare function voteInfoToString(comment: Comment): string;
/**
 * Replace citation notation with hoverover links for analysis
 * @param comments
 * @param summary
 * @returns the markdown summary
 */
export declare function formatCitations(comments: Comment[], summary: string): string;
