import { Model } from "../models/model";
import { Comment, Topic } from "../types";
/**
 * @fileoverview Helper functions for performing topic modeling on sets of comments.
 */
export declare const LEARN_TOPICS_PROMPT =
  "\nAnalyze the following comments and identify common topics.\nConsider the granularity of topics: too few topics may oversimplify the content and miss important nuances, while too many topics may lead to redundancy and make the overall structure less clear.\nAim for a balanced number of topics that effectively summarizes the key themes without excessive detail.\nAfter analysis of the comments, determine the optimal number of topics to represent the content effectively.\nJustify why having fewer topics would be less optimal (potentially oversimplifying and missing key nuances), and why having more topics would also be less optimal (potentially leading to redundancy and a less clear overall structure).\nAfter determining the optimal number of topics, identify those topics.\n";
export declare function learnOneLevelOfTopicsPrompt(
  parentTopic: Topic,
  otherTopics?: Topic[],
  prompt_learn_factor?: string,
  prompt_learn_metrics?: string
): string;
/**
 * Generates an LLM prompt for topic modeling of a set of comments.
 *
 * @param parentTopics - Optional. An array of top-level topics to use.
 * @param theme - Optional theme string to include in the prompt.
 * @param factor - Optional factor string to include in the prompt.
 * @returns The generated prompt string.
 */
export declare function generateTopicModelingPrompt(
  parentTopic?: Topic,
  otherTopics?: Topic[],
  theme?: string,
  factor?: string,
  prompt_learn_factor?: string,
  prompt_learn_metrics?: string
): string;
/**
 * Learn either topics or subtopics from the given comments.
 * @param comments the comments to consider
 * @param model the LLM to use
 * @param topic given or learned topic that subtopics will fit under
 * @param otherTopics other topics that are being used, this is used
 * to avoid duplicate topic/subtopic names
 * @param additionalContext more info to give the model
 * @param theme optional theme string to include in the prompt
 * @param factor optional factor string to include in the prompt
 * @returns the topics that are present in the comments.
 */
export declare function learnOneLevelOfTopics(
  comments: Comment[],
  model: Model,
  topic?: Topic,
  otherTopics?: Topic[],
  additionalContext?: string,
  theme?: string,
  factor?: string,
  prompt_learn_factor?: string,
  prompt_learn_metrics?: string
): Promise<Topic[]>;
/**
 * Validates the topic modeling response from the LLM.
 *
 * @param response The topic modeling response from the LLM.
 * @param parentTopics Optional. An array of parent topic names to validate against.
 * @returns True if the response is valid, false otherwise.
 */
export declare function learnedTopicsValid(response: Topic[], parentTopic?: Topic): boolean;
