import { SummaryStats, TopicStats } from "../../stats/summary_stats";
import { SummaryContent } from "../../types";
import { RecursiveSummary } from "./recursive_summarization";
export declare class TopSubtopicsSummary extends RecursiveSummary<SummaryStats> {
    getSummary(): Promise<SummaryContent>;
    getSubtopicSummary(st: TopicStats, index: number): Promise<SummaryContent>;
}
