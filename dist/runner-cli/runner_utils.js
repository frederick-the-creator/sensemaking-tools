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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.writeSummaryToGroundedCSV = writeSummaryToGroundedCSV;
exports.getTopicsAndSubtopics = getTopicsAndSubtopics;
exports.getSummary = getSummary;
exports.writeSummaryToHtml = writeSummaryToHtml;
exports.parseTopicsString = parseTopicsString;
exports.getCommentsFromCsv = getCommentsFromCsv;
exports.getTopicsFromComments = getTopicsFromComments;
// This code processes data from the `bin/` directory ingest scripts. In general, the shape
// takes the form of the `CoreCommentCsvRow` structure below, together with the vote tally
// columns of the form <Group Name>-agree-count, <Group Name>-disagree-count, and
// <Group Name>-pass-count.
const sensemaker_1 = require("../src/sensemaker");
const vertex_model_1 = require("../src/models/vertex_model");
const types_1 = require("../src/types");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const csv_parse_1 = require("csv-parse");
const marked_1 = require("marked");
const csv_writer_1 = require("csv-writer");
/**
 * Add the text and supporting comments to statementsWithComments. Also adds nested content.
 * @param summaryContent the content and subcontent to add
 * @param allComments all the comments from the deliberation
 * @param statementsWithComments where to add new summary text and supporting source comments
 * @returns none
 */
function addStatement(summaryContent, allComments, statementsWithComments) {
    if (summaryContent.subContents) {
        summaryContent.subContents.forEach((subContent) => {
            addStatement(subContent, allComments, statementsWithComments);
        });
    }
    if (summaryContent.text.length === 0 && !summaryContent.title) {
        return;
    }
    let comments = [];
    if (summaryContent.citations) {
        comments = summaryContent.citations
            .map((commentId) => allComments.find((comment) => comment.id === commentId))
            .filter((comment) => comment !== undefined);
    }
    statementsWithComments.push({
        summary: (summaryContent.title || "") + summaryContent.text,
        source: comments.map((comment) => `*        [${comment.id}] ${comment.text}`).join("\n"),
    });
}
/**
 * Outputs a CSV where each row represents a statement and its associated comments.
 *
 * @param summary the summary to split.
 * @param outputFilePath Path to the output CSV file that will have columns "summary" for the statement, and "comments" for the comment texts associated with that statement.
 */
function writeSummaryToGroundedCSV(summary, outputFilePath) {
    const statementsWithComments = [];
    for (const summaryContent of summary.contents) {
        addStatement(summaryContent, summary.comments, statementsWithComments);
    }
    const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
        path: outputFilePath,
        header: [
            { id: "summary", title: "summary" },
            { id: "source", title: "source" },
        ],
    });
    csvWriter.writeRecords(statementsWithComments);
    console.log(`Summary statements saved to ${outputFilePath}`);
}
/**
 * Identify topics and subtopics when input data has not already been categorized.
 * @param project The Vertex GCloud project name
 * @param comments The comments from which topics need to be identified
 * @returns Promise resolving to a Topic collection containing the newly discovered topics and subtopics for the given comments
 */
function getTopicsAndSubtopics(project, comments) {
    return __awaiter(this, void 0, void 0, function* () {
        const sensemaker = new sensemaker_1.Sensemaker({
            defaultModel: new vertex_model_1.VertexModel(project, "us-central1"),
        });
        return yield sensemaker.learnTopics(comments, true);
    });
}
/**
 * Runs the summarization routines for the data set.
 * @param project The Vertex GCloud project name
 * @param comments The comments to summarize
 * @param topics The input topics to categorize against
 * @param additionalContext Additional context about the conversation to pass through
 * @returns Promise resolving to a Summary object containing the summary of the comments
 */
function getSummary(project, comments, topics, additionalContext) {
    return __awaiter(this, void 0, void 0, function* () {
        const sensemaker = new sensemaker_1.Sensemaker({
            defaultModel: new vertex_model_1.VertexModel(project, "us-central1"),
        });
        // TODO: Make the summariation type an argument and add it as a flag in runner.ts. The data
        // requirements (like requiring votes) would also need updated.
        const summary = yield sensemaker.summarize(comments, types_1.SummarizationType.AGGREGATE_VOTE, topics, additionalContext);
        // For now, remove all Common Ground, Difference of Opinion, or TopicSummary sections
        return summary.withoutContents((sc) => sc.type === "TopicSummary");
    });
}
function writeSummaryToHtml(summary, outputFile) {
    const markdownContent = summary.getText("MARKDOWN");
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Summary</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
    </style>
    ${
    // When in DEBUG_MODE, we need to add the DataTables and jQuery libraries, and hook
    // into our table elements to add support for features like sorting and search.
    process.env.DEBUG_MODE === "true"
        ? `
    <script src="https://code.jquery.com/jquery-3.7.1.js"></script>
    <script src="https://cdn.datatables.net/2.2.1/js/dataTables.js"></script>
    <link rel="stylesheet" href="https://cdn.datatables.net/2.2.1/css/dataTables.dataTables.css" />
    <script>$(document).ready( function () {$('table').DataTable();} )</script>
    `
        : ""}
</head>
<body>
    ${(0, marked_1.marked)(markdownContent)}
</body>
</html>`;
    fs.writeFileSync(outputFile, htmlContent);
    console.log(`Written summary to ${outputFile}`);
}
/**
 * Parse a topics string from the categorization_runner.ts into a (possibly) nested topics
 * array, omitting subtopics and subsubtopics if not present in the labels.
 * @param topicsString A string in the format Topic1:Subtopic1:A;Topic2:Subtopic2.A
 * @returns Nested Topic structure
 */
function parseTopicsString(topicsString) {
    // use the new multiple topic output notation to parse multiple topics/subtopics
    const subtopicMappings = topicsString
        .split(";")
        .reduce((topicMapping, topicString) => {
        const [topicName, subtopicName, subsubtopicName] = topicString.split(":");
        // if we already have a mapping for this topic, add, otherwise create a new one
        topicMapping[topicName] = topicMapping[topicName] || [];
        if (subtopicName) {
            let subsubtopic = [];
            let subtopicUpdated = false;
            // Check for an existing subtopic and add subsubtopics there if possible.
            for (const subtopic of topicMapping[topicName]) {
                if (subtopic.name === subtopicName) {
                    subsubtopic = "subtopics" in subtopic ? subtopic.subtopics : [];
                    if (subsubtopicName) {
                        subsubtopic.push({ name: subsubtopicName });
                        subtopicUpdated = true;
                        break;
                    }
                }
            }
            if (subsubtopicName) {
                subsubtopic = [{ name: subsubtopicName }];
            }
            if (!subtopicUpdated) {
                topicMapping[topicName].push({ name: subtopicName, subtopics: subsubtopic });
            }
        }
        return topicMapping;
    }, {});
    // map key/value pairs from subtopicMappings to Topic objects
    return Object.entries(subtopicMappings).map(([topicName, subtopics]) => {
        if (subtopics.length === 0) {
            return { name: topicName };
        }
        else {
            return { name: topicName, subtopics: subtopics };
        }
    });
}
/**
 * Gets comments from a CSV file, in the style of the output from the input processing files
 * in the project's `bin/` directory. Core CSV rows are as for `CoreCommentCsvRow`, plus any
 * vote tallies in `VoteTallyCsvRow`.
 * @param inputFilePath
 * @returns
 */
function getCommentsFromCsv(inputFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        // Determine the groups names from the header row
        const header = fs.readFileSync(inputFilePath, { encoding: "utf-8" }).split("\n")[0];
        const groupNames = header
            .split(",")
            .filter((name) => name.includes("-agree-count"))
            .map((name) => name.replace("-agree-count", ""))
            .sort();
        const usesGroups = groupNames.length > 0;
        if (!inputFilePath) {
            throw new Error("Input file path is missing!");
        }
        const filePath = path.resolve(inputFilePath);
        const fileContent = fs.readFileSync(filePath, { encoding: "utf-8" });
        const parser = (0, csv_parse_1.parse)(fileContent, {
            delimiter: ",",
            columns: true,
        });
        return new Promise((resolve, reject) => {
            const data = [];
            fs.createReadStream(filePath)
                .pipe(parser)
                .on("error", reject)
                .on("data", (row) => {
                const newComment = {
                    text: row.comment_text,
                    id: row["comment-id"].toString(),
                    voteInfo: getVoteInfoFromCsvRow(row, usesGroups, groupNames),
                };
                if (row.topics) {
                    // In this case, use the topics output format from the categorization_runner.ts routines
                    newComment.topics = parseTopicsString(row.topics);
                }
                else if (row.topic) {
                    // Add topic and subtopic from single value columns if available
                    newComment.topics = [];
                    newComment.topics.push({
                        name: row.topic.toString(),
                        subtopics: row.subtopic ? [{ name: row.subtopic.toString() }] : [],
                    });
                }
                data.push(newComment);
            })
                .on("end", () => resolve(data));
        });
    });
}
function getVoteInfoFromCsvRow(row, usesGroups, groupNames) {
    if (usesGroups) {
        const voteInfo = {};
        for (const groupName of groupNames) {
            voteInfo[groupName] = new types_1.VoteTally(Number(row[`${groupName}-agree-count`]), Number(row[`${groupName}-disagree-count`]), Number(row[`${groupName}-pass-count`]));
        }
        return voteInfo;
    }
    else {
        return new types_1.VoteTally(Number(row["agrees"]), Number(row["disagrees"]), Number(row["passes"]));
    }
}
function getTopicsFromComments(comments) {
    // Create a map from the topic name to a set of subtopic names.
    const mapTopicToSubtopicSet = {};
    for (const comment of comments) {
        for (const topic of comment.topics || []) {
            if (mapTopicToSubtopicSet[topic.name] == undefined) {
                mapTopicToSubtopicSet[topic.name] = new Set();
            }
            if ("subtopics" in topic) {
                for (const subtopic of topic.subtopics || []) {
                    mapTopicToSubtopicSet[topic.name].add(subtopic.name);
                }
            }
        }
    }
    // Convert that map to a Topic array and return
    const returnTopics = [];
    for (const topicName in mapTopicToSubtopicSet) {
        const topic = { name: topicName, subtopics: [] };
        for (const subtopicName of mapTopicToSubtopicSet[topicName].keys()) {
            topic.subtopics.push({ name: subtopicName });
        }
        returnTopics.push(topic);
    }
    return returnTopics;
}
