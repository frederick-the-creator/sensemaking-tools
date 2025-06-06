"use strict";
// Copyright 2024 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiStepSummary = void 0;
exports.summarizeByType = summarizeByType;
exports._quantifyTopicNames = _quantifyTopicNames;
const types_1 = require("../types");
const intro_1 = require("./summarization_subtasks/intro");
const overview_1 = require("./summarization_subtasks/overview");
const groups_1 = require("./summarization_subtasks/groups");
const group_informed_1 = require("../stats/group_informed");
const majority_vote_1 = require("../stats/majority_vote");
const top_subtopics_1 = require("./summarization_subtasks/top_subtopics");
const topics_1 = require("./summarization_subtasks/topics");
/**
 * Summarizes comments based on the specified summarization type.
 *
 * @param model The language model to use for summarization.
 * @param comments An array of `Comment` objects containing the comments to summarize.
 * @param summarizationType The type of summarization to perform (e.g., GROUP_INFORMED_CONSENSUS).
 * @param additionalContext Optional additional instructions to guide the summarization process. These instructions will be included verbatim in the prompt sent to the LLM.
 * @returns A Promise that resolves to the generated summary string.
 * @throws {TypeError} If an unknown `summarizationType` is provided.
 */
function summarizeByType(model, comments, summarizationType, additionalContext) {
    return __awaiter(this, void 0, void 0, function* () {
        let summaryStats;
        if (summarizationType === types_1.SummarizationType.GROUP_INFORMED_CONSENSUS) {
            summaryStats = new group_informed_1.GroupedSummaryStats(comments);
        }
        else if (summarizationType === types_1.SummarizationType.AGGREGATE_VOTE) {
            summaryStats = new majority_vote_1.MajoritySummaryStats(comments);
        }
        else {
            throw new TypeError("Unknown Summarization Type.");
        }
        return new MultiStepSummary(summaryStats, model, additionalContext).getSummary();
    });
}
/**
 *
 */
class MultiStepSummary {
    constructor(summaryStats, model, additionalContext) {
        this.summaryStats = summaryStats;
        this.model = model;
        this.additionalContext = additionalContext;
    }
    getSummary() {
        return __awaiter(this, void 0, void 0, function* () {
            const topicsSummary = yield new topics_1.AllTopicsSummary(this.summaryStats, this.model, this.additionalContext).getSummary();
            const summarySections = [];
            summarySections.push(yield new intro_1.IntroSummary(this.summaryStats, this.model, this.additionalContext).getSummary());
            summarySections.push(yield new overview_1.OverviewSummary({ summaryStats: this.summaryStats, topicsSummary: topicsSummary, method: "one-shot" }, this.model, this.additionalContext).getSummary());
            summarySections.push(yield new top_subtopics_1.TopSubtopicsSummary(this.summaryStats, this.model, this.additionalContext).getSummary());
            if (this.summaryStats.groupBasedSummarization) {
                summarySections.push(yield new groups_1.GroupsSummary(this.summaryStats, this.model, this.additionalContext).getSummary());
            }
            summarySections.push(topicsSummary);
            return new types_1.Summary(summarySections, this.summaryStats.comments);
        });
    }
}
exports.MultiStepSummary = MultiStepSummary;
/**
 * Quantifies topic names by adding the number of associated comments in parentheses.
 *
 * @param topics An array of `TopicStats` objects.
 * @returns A map where keys are quantified topic names and values are arrays of quantified subtopic names.
 *
 * @example
 * Example input:
 * [
 *   {
 *     name: 'Topic A',
 *     commentCount: 5,
 *     subtopicStats: [
 *       { name: 'Subtopic 1', commentCount: 2 },
 *       { name: 'Subtopic 2', commentCount: 3 }
 *     ]
 *   }
 * ]
 *
 * Expected output:
 * {
 *   'Topic A (5 comments)': [
 *     'Subtopic 1 (2 comments)',
 *     'Subtopic 2 (3 comments)'
 *   ]
 * }
 */
function _quantifyTopicNames(topics) {
    const result = {};
    for (const topic of topics) {
        const topicName = `${topic.name} (${topic.commentCount} comments)`;
        if (topic.subtopicStats) {
            result[topicName] = topic.subtopicStats.map((subtopic) => `${subtopic.name} (${subtopic.commentCount} comments)`);
        }
    }
    return result;
}
