"use strict";
// Copyright 2025 Google LLC
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
// Advanced data output mode.
//
// There are 3 outputs:
// - a topic stats JSON that includes the topics found, their size, their votes, their engagement
//        and alignment, and their subtopics
// - a comments JSON that includes the comment id, text, votes, pass rate, agree rate, disagree
//        rate,  whether the comment is high alignment, low alignment, uncertain, and whether the
//        comment is filtered out.
// - the summary object as a JSON which includes the section titles, text, and cited comment ids.
//
// The input CSV is expected to have the following columns: comment-id, comment_text, and topics.
// Vote data should also be included, for data without group information the columns should be:
// agrees, disagrees, and optionally passes. For data with group information the columns should be:
// {group name}-agree-count, {group name}-disagree-count, and optionally {group name}-pass-count
// for each group.
//
// Sample Usage:
// time npx ts-node ./runner-cli/advanced_runner.ts --outputBasename final-copy \
//   --vertexProject "{CLOUD_PROJECT_ID}" \
//   --inputFile "./data.csv"
const commander_1 = require("commander");
const fs_1 = require("fs");
const runner_utils_1 = require("./runner_utils");
const majority_vote_1 = require("../src/stats/majority_vote");
const relative_context_1 = require("../src/tasks/summarization_subtasks/relative_context");
const stats_util_1 = require("../src/stats/stats_util");
function createMinimalStats(stats, relativeContext = null) {
    if (!relativeContext)
        relativeContext = new relative_context_1.RelativeContext(stats);
    return stats.map((stat) => {
        const minimalStat = {
            name: stat.name,
            commentCount: stat.commentCount,
            voteCount: stat.summaryStats.voteCount,
            relativeAlignment: relativeContext.getRelativeAgreement(stat.summaryStats),
            relativeEngagement: relativeContext.getRelativeEngagement(stat.summaryStats),
            // Recursively process subtopics if they exist
            subtopicStats: stat.subtopicStats
                ? createMinimalStats(stat.subtopicStats, relativeContext)
                : undefined,
        };
        return minimalStat;
    });
}
function getCommentsWithScores(comments, stats) {
    const highAlignmentCommentIDs = stats
        .getCommonGroundComments(Number.MAX_VALUE)
        .map((comment) => comment.id);
    const lowAlignmentCommentIDs = stats
        .getDifferenceOfOpinionComments(Number.MAX_VALUE)
        .map((comment) => comment.id);
    const highUncertaintyCommentIDs = stats
        .getUncertainComments(Number.MAX_VALUE)
        .map((comment) => comment.id);
    const filteredCommentIds = stats.filteredComments.map((comment) => comment.id);
    return comments.map((comment) => {
        const commentWithScores = {
            id: comment.id,
            text: comment.text,
            votes: comment.voteInfo,
            topics: (0, runner_utils_1.concatTopics)(comment),
        };
        if (comment.voteInfo) {
            const commentWithVoteInfo = comment;
            commentWithScores.passRate = (0, stats_util_1.getTotalPassRate)(comment.voteInfo, stats.asProbabilityEstimate);
            commentWithScores.agreeRate = (0, stats_util_1.getTotalAgreeRate)(comment.voteInfo, stats.includePasses, stats.asProbabilityEstimate);
            commentWithScores.disagreeRate = (0, stats_util_1.getTotalDisagreeRate)(comment.voteInfo, stats.includePasses, stats.asProbabilityEstimate);
            commentWithScores.isHighAlignment = highAlignmentCommentIDs.includes(comment.id);
            commentWithScores.highAlignmentScore = stats.getCommonGroundScore(commentWithVoteInfo);
            commentWithScores.isLowAlignment = lowAlignmentCommentIDs.includes(comment.id);
            commentWithScores.lowAlignmentScore = stats.getDifferenceOfOpinionScore(commentWithVoteInfo);
            commentWithScores.isHighUncertainty = highUncertaintyCommentIDs.includes(comment.id);
            commentWithScores.highUncertaintyScore = stats.getUncertainScore(commentWithVoteInfo);
            commentWithScores.isFilteredOut = !filteredCommentIds.includes(comment.id);
        }
        return commentWithScores;
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Parse command line arguments.
        const program = new commander_1.Command();
        program
            .option("-o, --outputBasename <file>", "The output basename, this will be prepended to 'summary.html' and 'summaryClaimsAndComments.csv'.")
            .option("-i, --inputFile <file>", "The input file name.")
            .option("-a, --additionalContext <context>", "A short description of the conversation to add context.")
            .option("-v, --vertexProject <project>", "The Vertex Project name.");
        program.parse(process.argv);
        const options = program.opts();
        const comments = yield (0, runner_utils_1.getCommentsFromCsv)(options.inputFile);
        const stats = new majority_vote_1.MajoritySummaryStats(comments);
        if (stats.getStatsByTopic().length === 0) {
            throw Error("Expected input comments to have topics. Please categorize them using the " +
                "categorization_runner.ts");
        }
        // Modify the SummaryStats output to drop comment info and add RelativeContext.
        const minimalTopicStats = createMinimalStats(stats.getStatsByTopic());
        (0, fs_1.writeFileSync)(options.outputBasename + "-topic-stats.json", JSON.stringify(minimalTopicStats, null, 2));
        const commentsWithScores = getCommentsWithScores(comments, stats);
        (0, fs_1.writeFileSync)(options.outputBasename + "-comments-with-scores.json", JSON.stringify(commentsWithScores, null, 2));
        const summary = yield (0, runner_utils_1.getSummary)(options.vertexProject, comments, undefined, options.additionalContext);
        (0, fs_1.writeFileSync)(options.outputBasename + "-summary.json", JSON.stringify(summary, null, 2));
    });
}
main();
