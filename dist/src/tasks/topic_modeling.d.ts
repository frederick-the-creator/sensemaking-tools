import { Model } from "../models/model";
import { Comment, Topic } from "../types";
/**
 * @fileoverview Helper functions for performing topic modeling on sets of comments.
 */
export declare const LEARN_TOPICS_PROMPT = "\nIdentify a 1-tiered hierarchical topic modeling of the following comments.\n\nImportant Considerations:\n- Use Title Case for topic names.\n- When identifying topics, try to group similar concepts into one comprehensive topic instead of creating multiple, overly specific topics.\n- Create as few topics as possible while covering all the comments.\n- Example topic names are: \"Education\", \"Environmental Sustainability\", \"Transportation\"\n- Bad topic names are like \"Community\" which is too vague\n";
export declare function learnOneLevelOfTopicsPrompt(parentTopic: Topic, otherTopics?: Topic[], prompt_learn_factor?: string, prompt_learn_metrics?: string): string;
/**
 * Generates an LLM prompt for topic modeling of a set of comments.
 *
 * @param parentTopics - Optional. An array of top-level topics to use.
 * @param theme - Optional theme string to include in the prompt.
 * @param factor - Optional factor string to include in the prompt.
 * @returns The generated prompt string.
 */
export declare function generateTopicModelingPrompt(parentTopic?: Topic, otherTopics?: Topic[], theme?: string, factor?: string, prompt_learn_factor?: string, prompt_learn_metrics?: string): string;
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
export declare function learnOneLevelOfTopics(comments: Comment[], model: Model, topic?: Topic, otherTopics?: Topic[], additionalContext?: string, theme?: string, factor?: string, prompt_learn_factor?: string, prompt_learn_metrics?: string): Promise<Topic[]>;
/**
 * Validates the topic modeling response from the LLM.
 *
 * @param response The topic modeling response from the LLM.
 * @param parentTopics Optional. An array of parent topic names to validate against.
 * @returns True if the response is valid, false otherwise.
 */
export declare function learnedTopicsValid(response: Topic[], parentTopic?: Topic): boolean;
