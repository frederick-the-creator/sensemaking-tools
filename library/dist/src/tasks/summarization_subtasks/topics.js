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
exports.SubtopicSummary = exports.TopicSummary = exports.AllTopicsSummary = void 0;
// Functions for different ways to summarize Comment and Vote data.
const recursive_summarization_1 = require("./recursive_summarization");
const stats_util_1 = require("../../stats/stats_util");
const sensemaker_utils_1 = require("../../sensemaker_utils");
const types_1 = require("../../types");
const relative_context_1 = require("./relative_context");
const COMMON_INSTRUCTIONS = "Do not use the passive voice. Do not use ambiguous pronouns. Be clear. " +
    "Do not generate bullet points or special formatting. Do not yap.";
const GROUP_SPECIFIC_INSTRUCTIONS = `Participants in this conversation have been clustered into opinion groups. ` +
    `These opinion groups mostly approve of these comments. `;
function getCommonGroundInstructions(containsGroups) {
    const groupSpecificText = containsGroups ? GROUP_SPECIFIC_INSTRUCTIONS : "";
    return (`Here are several comments sharing different opinions. Your job is to summarize these ` +
        `comments. Do not pretend that you hold any of these opinions. You are not a participant in ` +
        `this discussion. ${groupSpecificText}Write a concise summary of these ` +
        `comments that is at least one sentence and at most five sentences long. The summary should ` +
        `be substantiated, detailed and informative: include specific findings, requests, proposals, ` +
        `action items and examples, grounded in the comments. Refer to the people who made these ` +
        `comments as participants, not commenters. Do not talk about how strongly they approve of ` +
        `these comments. Use complete sentences. ${COMMON_INSTRUCTIONS}`);
}
function getCommonGroundSingleCommentInstructions(containsGroups) {
    const groupSpecificText = containsGroups ? GROUP_SPECIFIC_INSTRUCTIONS : "";
    return (`Here is a comment presenting an opinion from a discussion. Your job is to rewrite this ` +
        `comment clearly without embellishment. Do not pretend that you hold this opinion. You are not` +
        ` a participant in this discussion. ${groupSpecificText}Refer to the people who ` +
        `made these comments as participants, not commenters. Do not talk about how strongly they ` +
        `approve of these comments. Write a complete sentence. ${COMMON_INSTRUCTIONS}`);
}
// TODO: Test whether conditionally including group specific text in this prompt improves
// performance.
const DIFFERENCES_OF_OPINION_INSTRUCTIONS = `You are going to be presented with several comments from a discussion on which there were differing opinions, ` +
    `as well as a summary of points of common ground from this discussion. Your job is summarize the ideas ` +
    `contained in the comments, keeping in mind the points of common ground as backgrounnd in describing ` +
    `the differences of opinion. Do not pretend that you hold any of these opinions. You are not a ` +
    `participant in this discussion. Write a concise summary of these comments that is at least ` +
    `one sentence and at most five sentences long. Refer to the people who made these comments as ` +
    `participants, not commenters.  Do not talk about how strongly they disagree with these ` +
    `comments. Use complete sentences. ${COMMON_INSTRUCTIONS}

Do not assume that these comments were written by different participants. These comments could be from ` +
    `the same participant, so do not say some participants prosed one things while other ` +
    `participants proposed another.  Do not say "Some participants proposed X while others Y".  ` +
    `Instead say "One statement proposed X while another Y"

Where the difference of opinion comments refer to topics that are also covered in the common ground ` +
    `summary, your output should begin in some variant of the form "While there was broad support for ..., ` +
    `opinions differed with respect to ...". When this is not the case, you can beging simple as ` +
    `"There was disagreement ..." or something similar to contextualize that the comments you are ` +
    `summarizing had mixed support.`;
function getDifferencesOfOpinionSingleCommentInstructions(containsGroups) {
    const groupSpecificText = containsGroups
        ? `Participants in this conversation have been clustered ` +
            `into opinion groups. There were very different levels of agreement between the two opinion ` +
            `groups regarding this comment. `
        : "";
    return (`You are going to be presented with a single comment from a discussion on which there were differing opinions, ` +
        `as well as a summary of points of common ground from this discussion. ` +
        `Your job is to rewrite this comment to summarize the main points or ideas it is trying to make, clearly and without embellishment,` +
        `keeping in mind the points of common ground as backgrounnd in describing the differences of opinion participants had in relation to this comment. ` +
        `Do not pretend that you hold  opinions. You are not a participant in this discussion. ` +
        groupSpecificText +
        `Write your summary as a single complete sentence.` +
        `Refer to the people who made these comments as participants, not commenters. ` +
        `Do not talk about how strongly they disagree with these comments. ${COMMON_INSTRUCTIONS}

  Where the difference of opinion comments refer to topics that are also covered in the common ground ` +
        `summary, your output should begin in some variant of the form "While there was broad support for ..., ` +
        `opinions differed with respect to ...". When this is not the case, you can beging simple as ` +
        `"There was disagreement ..." or something similar to contextualize that the comments you are ` +
        `summarizing had mixed support.`);
}
function getRecursiveTopicSummaryInstructions(topicStat) {
    return (`Your job is to compose a summary paragraph to be included in a report on the results of a ` +
        `discussion among some number of participants. You are specifically tasked with producing ` +
        `a paragraph about the following topic of discussion: ${topicStat.name}. ` +
        `You will base this summary off of a number of already composed summaries corresponding to ` +
        `subtopics of said topic. These summaries have been based on comments that participants submitted ` +
        `as part of the discussion. ` +
        `Do not pretend that you hold any of these opinions. You are not a participant in this ` +
        `discussion. Write a concise summary of these summaries that is at least one sentence ` +
        `and at most three to five sentences long. The summary should be substantiated, detailed and ` +
        `informative. However, do not provide any meta-commentary ` +
        `about your task, or the fact that your summary is being based on other summaries. Also do not ` +
        `include specific numbers about how many comments were included in each subtopic, as these will be ` +
        `included later in the final report output. ` +
        `Also refrain from describing specific areas of agreement or disagreement, and instead focus on themes discussed. ` +
        `You also do not need to recap the context of the conversation, ` +
        `as this will have already been stated earlier in the report. Remember: this is just one paragraph in a larger ` +
        `summary, and you should compose this paragraph so that it will flow naturally in the context of the rest of the report. ` +
        `${COMMON_INSTRUCTIONS}`);
}
/**
 * This RecursiveSummary subclass constructs a top level "Topics" summary section,
 * calling out to the separate TopicSummary and SubtopicSummary classes to generate
 * content for individual subsections corresponding to specific topics and subtopics.
 */
class AllTopicsSummary extends recursive_summarization_1.RecursiveSummary {
    getSummary() {
        return __awaiter(this, void 0, void 0, function* () {
            // First construct the introductory description for the entire section
            const topicStats = this.input.getStatsByTopic();
            const nTopics = topicStats.length;
            const nSubtopics = topicStats
                .map((t) => { var _a; return ((_a = t.subtopicStats) === null || _a === void 0 ? void 0 : _a.length) || 0; })
                .reduce((n, m) => n + m, 0);
            const hasSubtopics = nSubtopics > 0;
            const subtopicsCountText = hasSubtopics ? `, as well as ${nSubtopics} subtopics` : "";
            const usesGroups = topicStats.some((t) => t.summaryStats.groupBasedSummarization);
            const overviewText = `From the statements submitted, ${nTopics} high level topics were identified` +
                `${subtopicsCountText}. Based on voting patterns` +
                `${usesGroups ? " between the opinion groups described above," : ""} both points of common ` +
                `ground as well as differences of opinion ${usesGroups ? "between the groups " : ""}` +
                `have been identified and are described below.\n`;
            // Now construct the individual Topic summaries
            const relativeContext = new relative_context_1.RelativeContext(topicStats);
            const topicSummaries = topicStats.map((topicStat) => 
            // Create a callback function for each summary and add it to the list, preparing them for parallel execution.
            () => new TopicSummary(topicStat, this.model, relativeContext, this.additionalContext).getSummary());
            return {
                title: "## Topics",
                text: overviewText,
                subContents: yield (0, sensemaker_utils_1.executeConcurrently)(topicSummaries),
            };
        });
    }
}
exports.AllTopicsSummary = AllTopicsSummary;
/**
 * This RecursiveSummary subclass generates summaries for individual topics.
 */
class TopicSummary extends recursive_summarization_1.RecursiveSummary {
    // This override is necessary to pass through a TopicStat object, rather than a SummaryStats object
    constructor(topicStat, model, relativeContext, additionalContext) {
        super(topicStat.summaryStats, model, additionalContext);
        this.topicStat = topicStat;
        this.relativeContext = relativeContext;
    }
    getSummary() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const nSubtopics = ((_a = this.topicStat.subtopicStats) === null || _a === void 0 ? void 0 : _a.length) || 0;
            if (nSubtopics == 0) {
                return this.getCommentSummary();
            }
            else {
                return this.getAllSubTopicSummaries();
            }
        });
    }
    /**
     * Returns the section title for this topics summary section of the final report
     */
    getSectionTitle() {
        return `### ${this.topicStat.name} (${this.topicStat.commentCount} statements)`;
    }
    /**
     * When subtopics are present, compiles the individual summaries for those subtopics
     * @returns a promise of the summary string
     */
    getAllSubTopicSummaries() {
        return __awaiter(this, void 0, void 0, function* () {
            // Create subtopic summaries for all subtopics with > 1 statement.
            const subtopicSummaries = (this.topicStat.subtopicStats || [])
                .filter((subtopicStat) => subtopicStat.commentCount > 1)
                .map(
            // Create a callback function for each summary and add it to the list, preparing them for parallel execution.
            (subtopicStat) => () => new SubtopicSummary(subtopicStat, this.model, this.relativeContext, this.additionalContext).getSummary());
            const subtopicSummaryContents = yield (0, sensemaker_utils_1.executeConcurrently)(subtopicSummaries);
            const nSubtopics = subtopicSummaries.length;
            let topicSummary = "";
            if (nSubtopics > 0) {
                topicSummary =
                    `This topic included ${nSubtopics} subtopic${nSubtopics === 1 ? "" : "s"}, comprising a ` +
                        `total of ${this.topicStat.commentCount} statement${this.topicStat.commentCount === 1 ? "" : "s"}.`;
                const subtopicSummaryPrompt = (0, sensemaker_utils_1.getAbstractPrompt)(getRecursiveTopicSummaryInstructions(this.topicStat), subtopicSummaryContents, (summary) => {
                    var _a;
                    return `<subtopicSummary>\n` +
                        `    <title>${summary.title}</title>\n` +
                        `    <text>\n${(_a = summary.subContents) === null || _a === void 0 ? void 0 : _a.map((s) => s.title + s.text).join("\n\n")}\n` +
                        `    </text>\n  </subtopicSummary>`;
                }, this.additionalContext);
                console.log(`Generating TOPIC SUMMARY for: "${this.topicStat.name}"`);
                subtopicSummaryContents.unshift({
                    type: "TopicSummary",
                    text: yield this.model.generateText(subtopicSummaryPrompt),
                });
            }
            return {
                title: this.getSectionTitle(),
                text: topicSummary,
                subContents: subtopicSummaryContents,
            };
        });
    }
    /**
     * Summarizes the comments associated with the given topic
     * @returns a promise of the summary string
     */
    getCommentSummary() {
        return __awaiter(this, void 0, void 0, function* () {
            const relativeAgreement = this.relativeContext.getRelativeAgreement(this.topicStat.summaryStats);
            const agreementDescription = `This subtopic had ${relativeAgreement} compared to the other subtopics.`;
            const subContents = [yield this.getThemesSummary()];
            // check env variable to decide whether to compute common ground and difference of opinion summaries
            if (process.env["SKIP_COMMON_GROUND_AND_DIFFERENCES_OF_OPINION"] !== "true") {
                const commonGroundSummary = yield this.getCommonGroundSummary(this.topicStat.name);
                const differencesOfOpinionSummary = yield this.getDifferencesOfOpinionSummary(commonGroundSummary, this.topicStat.name);
                subContents.push(commonGroundSummary, differencesOfOpinionSummary);
            }
            if (process.env["DEBUG_MODE"] === "true") {
                // Based on the common ground and differences of opinion comments,
                // TODO: Should also include common ground disagree comments (aka what everyone agrees they
                // don't like)
                const commonGroundComments = this.input.getCommonGroundAgreeComments();
                const differencesComments = this.input.getDifferenceOfOpinionComments();
                // Figure out what comments aren't currently being summarized
                const allSummarizedCommentIds = new Set([
                    ...commonGroundComments.map((c) => c.id),
                    ...differencesComments.map((c) => c.id),
                ]);
                const otherComments = this.topicStat.summaryStats.comments.filter((comment) => !allSummarizedCommentIds.has(comment.id));
                const otherCommentsTable = (0, sensemaker_utils_1.commentTableMarkdown)(otherComments, [
                    { columnName: "minAgreeProb", getValue: stats_util_1.getMinAgreeProb },
                    {
                        columnName: "maxAgreeDiff",
                        getValue: stats_util_1.getMaxGroupAgreeProbDifference,
                    },
                ]);
                const otherCommentsSummary = {
                    title: `**Other statements** (${otherComments.length} statements`,
                    text: otherCommentsTable,
                };
                subContents.push(otherCommentsSummary);
            }
            return {
                title: this.getSectionTitle(),
                text: agreementDescription,
                subContents: subContents,
            };
        });
    }
    /**
     * Summarizes the themes that recur across all comments
     * @returns a single sentence describing the themes, without citations.
     */
    getThemesSummary() {
        return __awaiter(this, void 0, void 0, function* () {
            const allComments = this.input.comments;
            // TODO: add some edge case handling in case there is only 1 comment, etc
            console.log(`Generating PROMINENT THEMES for subtopic: "${this.topicStat.name}"`);
            const text = yield this.model.generateText((0, sensemaker_utils_1.getPrompt)(`Please write a concise bulleted list identifying up to 5 prominent themes across all statements. These statements are all about ${this.topicStat.name}. For each theme, begin with a short theme description written in bold text, followed by a colon, then followed by a SINGLE sentence explaining the theme. Your list should meet the below Criteria and STRICTLY follow the Output Format. Do not preface the bulleted list with any text.

      <criteria format="markdown">
      * Impartiality: Do not express your own opinion or pass normative judgments on the statements, like agreement, disagreement, or alarm.
      * Faithfulness: Your list should accurately reflect the statements without hallucinations or mischaracterizations.
        * Similarly, your list should not assume or misstate the amount of agreement across statements. For example, do not present a theme as unanimous if it is only mentioned in some statements.
        * This criterion also applies to the name of the theme itself: do not imply overwhelming agreement when you name themes if it does not exist. For example, do not name a theme "Support for _______" unless there is overwhelming evidence beyond a reasonable doubt in the statements.
        * Be **specific**. Avoid overgeneralizations or fuzzy nouns like "things" or "aspects".
      * Comprehensiveness: Your list should reflect ALL opinions proportional to their representation in the statements. However, **absolutely do not exclude minority opinions**, especially if there are strong objections or mixed stances.  Please be **specific** in including these objections or stances.
      * Consistent terminology: You should always use "statements" and NOT "comments".
      </criteria>

      <output_format format="markdown">
      * **Title Case Theme**: Sentence
      </output_format>
      
      `, allComments.map((comment) => comment.text), this.additionalContext));
            return {
                title: "Prominent themes were: ",
                text: text,
            };
        });
    }
    /**
     * Summarizes the comments on which there was the strongest agreement.
     * @returns a short paragraph describing the similarities, including comment citations.
     */
    getCommonGroundSummary(topic) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: Should also include common ground disagree comments (aka what everyone agrees they
            // don't like)
            const commonGroundComments = this.input.getCommonGroundAgreeComments();
            const nComments = commonGroundComments.length;
            let text = "";
            if (nComments === 0) {
                text = this.input.getCommonGroundNoCommentsMessage();
            }
            else {
                console.log(`Generating COMMON GROUND for "${topic}"`);
                const summary = this.model.generateText((0, sensemaker_utils_1.getPrompt)(nComments === 1
                    ? getCommonGroundSingleCommentInstructions(this.input.groupBasedSummarization)
                    : getCommonGroundInstructions(this.input.groupBasedSummarization), commonGroundComments.map((comment) => comment.text), this.additionalContext));
                text = yield summary;
            }
            return {
                title: this.input.groupBasedSummarization
                    ? "Common ground between groups: "
                    : "Common ground: ",
                text: text,
                citations: commonGroundComments.map((comment) => comment.id),
            };
        });
    }
    /**
     * Summarizes the comments on which there was the strongest disagreement.
     * @returns a short paragraph describing the differences, including comment citations.
     */
    getDifferencesOfOpinionSummary(commonGroundSummary, topic) {
        return __awaiter(this, void 0, void 0, function* () {
            const topDisagreeCommentsAcrossGroups = this.input.getDifferenceOfOpinionComments();
            const nComments = topDisagreeCommentsAcrossGroups.length;
            let text = "";
            if (nComments === 0) {
                text = this.input.getDifferencesOfOpinionNoCommentsMessage();
            }
            else {
                const prompt = (0, sensemaker_utils_1.getAbstractPrompt)(nComments === 1
                    ? getDifferencesOfOpinionSingleCommentInstructions(this.input.groupBasedSummarization)
                    : DIFFERENCES_OF_OPINION_INSTRUCTIONS, [commonGroundSummary].concat(topDisagreeCommentsAcrossGroups), formatDifferenceOfOpinionData, this.additionalContext);
                console.log(`Generating DIFFERENCES OF OPINION for "${topic}"`);
                const summary = this.model.generateText(prompt);
                text = yield summary;
            }
            const resp = {
                title: "Differences of opinion: ",
                text: text,
                citations: topDisagreeCommentsAcrossGroups.map((comment) => comment.id),
            };
            // Since common ground is part of the summary, include its citations for evaluation
            if (commonGroundSummary.citations) {
                resp.citations = resp.citations.concat(commonGroundSummary.citations);
            }
            return resp;
        });
    }
}
exports.TopicSummary = TopicSummary;
/**
 * This TopicSummary subclass contains overrides for subtopics. At present, this is just an
 * override for the section title, but may evolve to different on other functionality.
 */
class SubtopicSummary extends TopicSummary {
    getSectionTitle() {
        return `#### ${this.topicStat.name} (${this.topicStat.commentCount} statements)`;
    }
}
exports.SubtopicSummary = SubtopicSummary;
function formatDifferenceOfOpinionData(datum) {
    // Warning: `Comment` and `SummaryContent` types are very similar, and comments actually pass
    // the `isSummaryContent` typecheck function. We are checking for isCommentType
    // first because comments _must_ have `id` fields, so the code below works.
    // However, if for some reason `SummaryContent` ended up getting an `id` field, this would no
    // longer work. There does not seem to be a simple way around this though because of the
    // differences between types and interfaces in typescript.
    // TODO: Add some testing of this in case there's ever a regression, or write with a more
    // custom prompt construction function.
    if ((0, types_1.isCommentType)(datum)) {
        return `<comment>${datum.text}</comment>`;
    }
    else {
        return (`<commonGroundSummary>\n` +
            `    <text>\n${datum.text}` +
            `    </text>\n  </commonGroundSummary>`);
    }
}
