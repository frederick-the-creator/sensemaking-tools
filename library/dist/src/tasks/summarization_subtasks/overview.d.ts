import { SummaryStats } from "../../stats/summary_stats";
import { SummaryContent } from "../../types";
import { RecursiveSummary } from "./recursive_summarization";
/**
 * The interface is the input structure for the OverviewSummary class, and controls
 * which specific method is used to generate this part of the summary.
 */
export interface OverviewInput {
  summaryStats: SummaryStats;
  topicsSummary: SummaryContent;
  method?: "one-shot" | "per-topic";
}
/**
 * Generates a summary of the key findings in the conversation, in terms of the top-level
 * topics.
 */
export declare class OverviewSummary extends RecursiveSummary<OverviewInput> {
  getSummary(): Promise<SummaryContent>;
  /**
   * Produces a summary of the key findings within the conversation, based on the
   * results of the topicsSummary.
   * @returns A promise of the resulting summary string
   */
  oneShotSummary(): Promise<string>;
  /**
   * Generates a summary one topic at a time, and then programatically concatenates them.
   * @returns A promise of the resulting summary string
   */
  perTopicSummary(): Promise<string>;
  /**
   * @returns Topic names with the percentage of comments classified thereunder in parentheses
   */
  private topicNames;
  private getTopicNameAndCommentPercentage;
}
/**
 * Remove all empty lines from the input string, useful when a model response formats
 * list items with empty lines between them (as though they are paragraphs, each containing
 * a single list item).
 * @param mdList A string, presumably representing a markdown list
 * @returns The input string, with all empty lines removed
 */
export declare function removeEmptyLines(mdList: string): string;
/**
 * This function processes the input markdown list string, ensuring that it matches
 * the expected format, normalizing it with `removeEmptyLines`, and ensuring that each
 * lines matches the expected format (* **bold topic**: summary...)
 */
export declare function isMdListValid(mdList: string, topicNames: string[]): boolean;
