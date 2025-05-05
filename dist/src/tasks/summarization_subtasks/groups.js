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
exports.GroupsSummary = void 0;
const sensemaker_utils_1 = require("../../sensemaker_utils");
const recursive_summarization_1 = require("./recursive_summarization");
/**
 * Format a list of strings to be a human readable list ending with "and"
 * @param items the strings to concatenate
 * @returns a string with the format "<item>, <item>, and <item>"
 */
function formatStringList(items) {
    if (items.length === 0) {
        return "";
    }
    if (items.length === 1) {
        return items[0];
    }
    if (items.length === 2) {
        return `${items[0]} and ${items[1]}`;
    }
    const lastItem = items.pop(); // Remove the last item
    return `${items.join(", ")} and ${lastItem}`;
}
/**
 * A summary section that describes the groups in the data and the similarities/differences between
 * them.
 */
class GroupsSummary extends recursive_summarization_1.RecursiveSummary {
    /**
     * Describes what makes the groups similar and different.
     * @returns a two sentence description of similarities and differences.
     */
    getGroupComparison(groupNames) {
        const topAgreeCommentsAcrossGroups = this.input.getCommonGroundComments();
        const groupComparisonSimilar = this.model.generateText((0, sensemaker_utils_1.getPrompt)(`Write one sentence describing the views of the ${groupNames.length} different opinion ` +
            "groups that had high inter group agreement on this subset of comments. Frame it in " +
            "terms of what the groups largely agree on.", topAgreeCommentsAcrossGroups.map((comment) => comment.text), this.additionalContext));
        const topDisagreeCommentsAcrossGroups = this.input.getDifferenceOfOpinionComments();
        const groupComparisonDifferent = this.model.generateText((0, sensemaker_utils_1.getPrompt)("The following are comments that different groups had different opinions on. Write one sentence describing " +
            "what groups had different opinions on. Frame it in terms of what differs between the " +
            "groups. Do not suggest the groups agree on these issues. Include every comment in the summary.", topDisagreeCommentsAcrossGroups.map((comment) => comment.text), this.additionalContext));
        // Combine the descriptions and add the comments used for summarization as citations.
        return [
            () => groupComparisonSimilar.then((result) => {
                return {
                    // Hack to force these two sections to be on a new line.
                    title: "\n",
                    text: result,
                    citations: topAgreeCommentsAcrossGroups.map((comment) => comment.id),
                };
            }),
            () => groupComparisonDifferent.then((result) => {
                return {
                    text: result,
                    citations: topDisagreeCommentsAcrossGroups.map((comment) => comment.id),
                };
            }),
        ];
    }
    /**
     * Returns a short description of all groups and a comparison of them.
     * @param groupNames the names of the groups to describe and compare
     * @returns text containing the description of each group and a compare and contrast section
     */
    getGroupDescriptions(groupNames) {
        return __awaiter(this, void 0, void 0, function* () {
            const groupDescriptions = [];
            for (const groupName of groupNames) {
                const topCommentsForGroup = this.input.getGroupRepresentativeComments(groupName);
                groupDescriptions.push(() => this.model
                    .generateText((0, sensemaker_utils_1.getPrompt)(`Write a two sentence summary of ${groupName}. Focus on the groups' expressed` +
                    ` views and opinions as reflected in the comments and votes, without speculating ` +
                    `about demographics. Avoid politically charged language (e.g., "conservative," ` +
                    `"liberal", or "progressive"). Instead, describe the group based on their ` +
                    `demonstrated preferences within the conversation.`, topCommentsForGroup.map((comment) => comment.text), this.additionalContext))
                    .then((result) => {
                    return {
                        title: `__${groupName}__: `,
                        text: result,
                        citations: topCommentsForGroup.map((comment) => comment.id),
                    };
                }));
            }
            // Join the individual group descriptions whenever they finish, and when that's done wait for
            // the group comparison to be created and combine them all together.
            console.log(`Generating group DESCRIPTION, SIMILARITY and DIFFERENCE comparison for ${groupNames.length} groups`);
            return (0, sensemaker_utils_1.executeConcurrently)([...groupDescriptions, ...this.getGroupComparison(groupNames)]);
        });
    }
    getSummary() {
        return __awaiter(this, void 0, void 0, function* () {
            const groupStats = this.input.getStatsByGroup();
            const groupCount = groupStats.length;
            const groupNamesWithQuotes = groupStats.map((stat) => {
                return `"${stat.name}"`;
            });
            const groupNames = groupStats.map((stat) => {
                return stat.name;
            });
            const content = {
                title: "## Opinion Groups",
                text: `${groupCount} distinct groups (named here as ${formatStringList(groupNamesWithQuotes)}) ` +
                    `emerged with differing viewpoints in relation to the submitted statements. The groups are ` +
                    `based on people who tend to vote more similarly to each other than to those outside the group. ` +
                    "However there are points of common ground where the groups voted similarly.\n\n",
                subContents: yield this.getGroupDescriptions(groupNames),
            };
            return content;
        });
    }
}
exports.GroupsSummary = GroupsSummary;
