import { SummaryStats } from "../../stats/summary_stats";
import { SummaryContent } from "../../types";
import { RecursiveSummary } from "./recursive_summarization";
export declare class IntroSummary extends RecursiveSummary<SummaryStats> {
  getSummary(): Promise<SummaryContent>;
}
