import { CommentRecord, Comment, Topic } from "../types";
import { Model } from "../models/model";
/**
 * @fileoverview Helper functions for performing comments categorization.
 */
/**
 * Makes API call to generate JSON and retries with any comments that were not properly categorized.
 * @param instructions Instructions for the LLM on how to categorize the comments.
 * @param inputComments The comments to categorize.
 * @param topics The topics and subtopics provided to the LLM for categorization.
 * @param additionalContext - extra context to be included to the LLM prompt
 * @returns The categorized comments.
 */
export declare function categorizeWithRetry(model: Model, instructions: string, inputComments: Comment[], topics: Topic[], additionalContext?: string): Promise<CommentRecord[]>;
export declare function topicCategorizationPrompt(topics: Topic[], prompt_categorise_comments?: string): string;
/**
 * Validates categorized comments, checking for:
 *  - Extra comments (not present in the original input)
 *  - Empty topics or subtopics
 *  - Invalid topic or subtopic names
 * @param commentRecords The categorized comments to validate.
 * @param inputComments The original input comments.
 * @param topics The topics and subtopics provided to the LLM for categorization.
 * @returns An object containing:
 *  - `validCommentRecords`: comments that passed validation.
 *  - `commentsWithInvalidTopics`: comments that failed validation.
 */
export declare function validateCommentRecords(commentRecords: CommentRecord[], inputComments: Comment[], topics: Topic[]): {
    commentsPassedValidation: CommentRecord[];
    commentsWithInvalidTopics: CommentRecord[];
};
/**
 * Finds comments that are missing from the categorized output.
 * @param commentRecords The categorized comments received from the model.
 * @param uncategorized The current set of uncategorized comments to check if any are missing in the model response.
 * @returns An array of comments that were present in the input, but not in categorized.
 */
export declare function findMissingComments(commentRecords: CommentRecord[], uncategorized: Comment[]): Comment[];
export declare function getTopicDepthFromTopics(topics: Topic[], currentDepth?: number): number;
/**
 * Categorize comments one level at a time.
 *
 * For comments without topics, first all the topics are learned, then the comments are
 * categorized into the topics, then for each topic the subset of relevant comments are selected
 * and this is repeated recursively.
 *
 * @param comments the comments to categorize to the given depthLevel
 * @param topicDepth the depth of categorization and topic learning, 1 is topic only; 2 is topics
 * and subtopics; 3 is topics, subtopics, and subsubtopics
 * @param model the model to use for topic learning and categorization
 * @param topics a given set of topics to categorize the comments into
 * @param additionalContext information to give the model
 * @param theme the theme to pass to learnOneLevelOfTopics
 * @param factor the factor to pass to learnOneLevelOfTopics
 * @returns the comments categorized to the level specified by topicDepth
 */
export declare function categorizeCommentsRecursive(comments: Comment[], topicDepth: 1 | 2 | 3, model: Model, topics?: Topic[], additionalContext?: string, theme?: string, factor?: string, prompt_categorise_comments?: string, prompt_learn_factor?: string, prompt_learn_metrics?: string): Promise<Comment[]>;
export declare function oneLevelCategorization(comments: Comment[], model: Model, topics: Topic[], additionalContext?: string, prompt_categorise_comments?: string): Promise<Comment[]>;
