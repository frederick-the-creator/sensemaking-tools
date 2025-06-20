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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoteTally = exports.Summary = exports.SummarizationType = exports.CommentRecord = exports.SubtopicCategorizedComment = exports.TopicCategorizedComment = exports.Topic = exports.NestedTopic = exports.FlatTopic = void 0;
exports.isVoteTallyType = isVoteTallyType;
exports.isCommentWithVoteInfoType = isCommentWithVoteInfoType;
exports.isGroupVoteTalliesType = isGroupVoteTalliesType;
exports.isCommentType = isCommentType;
exports.checkDataSchema = checkDataSchema;
exports.isCommentRecordType = isCommentRecordType;
exports.isTopicType = isTopicType;
// This module defines a set a data types used throughout the library. These types are specified using
// TypeBox, which allows us to simultaneously generate TypeScript types for the codebase, together with
// JSON Schema specifications, useful for VertexAI/Gemini constrained decoding, as well as for data
// validation routines.
const typebox_1 = require("@sinclair/typebox");
const compiler_1 = require("@sinclair/typebox/compiler");
const citation_utils_1 = require("./tasks/utils/citation_utils");
const sensemaker_utils_1 = require("./sensemaker_utils");
/**
 * TypeBox JSON Schema representation of a single topic record as a name, with no subtopics.
 */
exports.FlatTopic = typebox_1.Type.Object({
    name: typebox_1.Type.String(),
});
/**
 * TypeBox JSON Schema representation of a topic record as a name, with flat subtopics.
 */
exports.NestedTopic = typebox_1.Type.Object({
    name: typebox_1.Type.String(),
    subtopics: typebox_1.Type.Array(exports.FlatTopic),
});
/**
 * TypeBox JSON Schema representation of an abstract topic, either with or without subtopics.
 */
exports.Topic = typebox_1.Type.Union([exports.FlatTopic, exports.NestedTopic]);
/**
 * TypeBox JSON Schema representation of a comment id, together with a list of associated topics.
 */
exports.TopicCategorizedComment = typebox_1.Type.Object({
    id: typebox_1.Type.String(),
    topics: typebox_1.Type.Array(exports.FlatTopic),
});
/**
 * TypeBox JSON Schema representation of a comment id, together with a list of associated topics and subtopics.
 */
exports.SubtopicCategorizedComment = typebox_1.Type.Object({
    id: typebox_1.Type.String(),
    topics: typebox_1.Type.Array(exports.NestedTopic),
});
/**
 * TypeBox JSON Schema representation of a comment id, together with a list of associated topics and possibly subtopics.
 */
exports.CommentRecord = typebox_1.Type.Union([exports.TopicCategorizedComment, exports.SubtopicCategorizedComment]);
/**
 * Describes the type of summarization to use.
 *
 * GROUP_INFORMED_CONSENSUS - summarizes the comments with the highest group informed consensus
 * AGGREGATE_VOTE - summarizes the comments based on the majority vote. Does not use votes.
 */
var SummarizationType;
(function (SummarizationType) {
    SummarizationType[SummarizationType["GROUP_INFORMED_CONSENSUS"] = 0] = "GROUP_INFORMED_CONSENSUS";
    SummarizationType[SummarizationType["AGGREGATE_VOTE"] = 1] = "AGGREGATE_VOTE";
})(SummarizationType || (exports.SummarizationType = SummarizationType = {}));
/**
 * Represents a summary composed of multiple SummaryContents.
 * If a SummaryContent contains a claim, it should be grounded by representative comments.
 */
class Summary {
    constructor(contents, comments) {
        this.contents = contents;
        this.comments = comments;
    }
    // TODO: Move citation logic to here and make sure it works for all formats.
    /**
     * Returns the text of the summary, formatted according to the specified citation format.
     * @param format The desired format for citations. Can be "XML" or "MARKDOWN".
     * @returns The formatted summary text.  Throws an error if an unsupported format is provided.
     */
    getText(format) {
        return this.contents
            .map((content) => this.getContentText(content, format))
            .join("\n");
    }
    /**
     * Filter the contents according to removeFn, using sensemaker utils filterSummaryContent
     * @param removeFn Decides whether SummaryContent object should be removed or not
     * @returns boolean
     */
    withoutContents(removeFn) {
        return new Summary(this.contents.map((sc) => (0, sensemaker_utils_1.filterSummaryContent)(sc, (sc_) => !removeFn(sc_))), this.comments);
    }
    getContentText(content, format) {
        let result = content.title ? "\n\n" + content.title + "\n" : "";
        result += `${content.text}${this.getCitationText(content, format)}`;
        for (const subcontent of content.subContents || []) {
            result += this.getContentText(subcontent, format);
        }
        return result;
    }
    getCitationText(content, format) {
        if (!content.citations || content.citations.length === 0) {
            return "";
        }
        let result = " ";
        switch (format) {
            case "XML":
                for (const id of content.citations) {
                    result += `<citation comment_id=${id}>`;
                }
                break;
            case "MARKDOWN":
                result += `[${content.citations.join(",")}]`;
                // Apply citation tooltips as markdown.
                result = (0, citation_utils_1.formatCitations)(this.comments, result);
                break;
            default:
                throw new Error(`Unsupported citation type: ${format}`);
        }
        // Add a trailing whitespace in case there's another SummaryContent directly after.
        return result + " ";
    }
}
exports.Summary = Summary;
/**
 * Aggregates a number of individual votes.
 */
class VoteTally {
    constructor(agreeCount, disagreeCount, passCount) {
        this.agreeCount = agreeCount;
        this.disagreeCount = disagreeCount;
        this.passCount = passCount;
    }
    getTotalCount(includePasses) {
        if (includePasses) {
            return this.agreeCount + this.disagreeCount + (this.passCount || 0);
        }
        else {
            return this.agreeCount + this.disagreeCount;
        }
    }
}
exports.VoteTally = VoteTally;
/**
 * Checks if the data is a VoteTally object.
 *
 * It has the side effect of changing the type of the object to VoteTally if applicable.
 *
 * @param data - the object to check
 * @returns - true if the object is a VoteTally
 */
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
function isVoteTallyType(data) {
    return (typeof data === "object" &&
        data !== null &&
        "agreeCount" in data &&
        typeof data.agreeCount === "number" &&
        "disagreeCount" in data &&
        typeof data.disagreeCount === "number" &&
        (!("passCount" in data && data.passCount !== undefined) || typeof data.passCount === "number"));
}
/**
 * Checks if the given data is a CommentWithVoteInfo object (that is, a Comment object that includes VoteTallies), and sets the type as such if it passes.
 * @param data the object to check
 * @returns true if the object is a CommentWithVoteInfo, and false otherwise.
 */
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
function isCommentWithVoteInfoType(data) {
    return (typeof data === "object" &&
        data !== null &&
        "voteInfo" in data &&
        (isVoteTallyType(data.voteInfo) || isGroupVoteTalliesType(data.voteInfo)) &&
        isCommentType(data));
}
/**
 * Checks if the given object is a dictionary of group names to VoteTally objects.
 * @param data the object to check
 * @returns true if the object is a dictionary of groups to VoteTallys.
 */
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
function isGroupVoteTalliesType(data) {
    return (Object.keys(data).every((groupName) => typeof groupName === "string") &&
        Array.isArray(Object.values(data)) &&
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        Object.values(data).every((voteTally) => isVoteTallyType(voteTally)));
}
/**
 * Checks if the data is a Comment object.
 *
 * It has the side effect of changing the type of the object to Comment if applicable.
 *
 * @param data - the object to check
 * @returns - true if the object is a Comment
 */
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
function isCommentType(data) {
    return (typeof data === "object" &&
        data !== null &&
        "id" in data &&
        typeof data.id === "string" &&
        "text" in data &&
        typeof data.text === "string" &&
        // Check that if VoteInfo exists it is one of two accepted types.
        (!("voteInfo" in data) ||
            isGroupVoteTalliesType(data.voteInfo) ||
            isVoteTallyType(data.voteInfo)) &&
        (!("topics" in data) || data.topics.every((topic) => isTopicType(topic))));
}
/**
 * This is a local cache of compiled type/schema checkers. Checker compilation is not free, so
 * we keep a cache of previously compiled checkers so that we can more efficiently run checks.
 * Note that it's important here that this be a Map structure, for its specific value/identity
 * semantic guarantees on the input spec value.
 */
const schemaCheckerCache = new Map();
/**
 * Check that the given data matches the corresponding TSchema specification. Caches type checking compilation.
 * @param schema The schema to check by
 * @param response The response to check
 * @returns Boolean for whether or not the data matches the schema
 */
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
function checkDataSchema(schema, response) {
    let checker = schemaCheckerCache.get(schema);
    if (!checker) {
        checker = compiler_1.TypeCompiler.Compile(schema);
        schemaCheckerCache.set(schema, checker);
    }
    return checker.Check(response);
}
/**
 * Checks if the data is a CategorizedComment object.
 *
 * It has the side effect of changing the type of the object to CommentRecord if applicable.
 *
 * @param data - the object to check
 * @returns - true if the object is a Comment
 */
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
function isCommentRecordType(data) {
    return checkDataSchema(exports.CommentRecord, data);
}
/**
 * Checks if the data is a Topic object.
 *
 * It has the side effect of changing the type of the object to Topic if applicable.
 *
 * @param data - the object to check
 * @returns - true if the object is a Topic
 */
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
function isTopicType(data) {
    // This shouldn't be necessary, but checking directly against the union type seems to be ignoring
    // empty subtopic objects. This fixes it, but should maybe be reported as a bug?
    // TODO: Figure out why this is happening, and fix more optimally
    if ("subtopics" in data) {
        return checkDataSchema(exports.NestedTopic, data);
    }
    else {
        return checkDataSchema(exports.FlatTopic, data);
    }
}
