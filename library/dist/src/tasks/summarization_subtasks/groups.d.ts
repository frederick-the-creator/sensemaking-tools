import { GroupedSummaryStats } from "../../stats/group_informed";
import { RecursiveSummary } from "./recursive_summarization";
import { SummaryContent } from "../../types";
/**
 * A summary section that describes the groups in the data and the similarities/differences between
 * them.
 */
export declare class GroupsSummary extends RecursiveSummary<GroupedSummaryStats> {
    /**
     * Describes what makes the groups similar and different.
     * @returns a two sentence description of similarities and differences.
     */
    private getGroupComparison;
    /**
     * Returns a short description of all groups and a comparison of them.
     * @param groupNames the names of the groups to describe and compare
     * @returns text containing the description of each group and a compare and contrast section
     */
    private getGroupDescriptions;
    getSummary(): Promise<SummaryContent>;
}
