import { Model } from "../../models/model";
import { SummaryContent } from "../../types";
export declare abstract class RecursiveSummary<InputType> {
    protected input: InputType;
    protected model: Model;
    protected additionalContext?: string;
    constructor(input: InputType, model: Model, additionalContext?: string);
    abstract getSummary(): Promise<SummaryContent>;
}
