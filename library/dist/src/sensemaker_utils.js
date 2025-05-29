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
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryCall = retryCall;
exports.getAbstractPrompt = getAbstractPrompt;
exports.getPrompt = getPrompt;
exports.formatCommentsWithVotes = formatCommentsWithVotes;
exports.hydrateCommentRecord = hydrateCommentRecord;
exports.groupCommentsBySubtopic = groupCommentsBySubtopic;
exports.getUniqueTopics = getUniqueTopics;
exports.decimalToPercent = decimalToPercent;
exports.commentTableMarkdown = commentTableMarkdown;
exports.executeConcurrently = executeConcurrently;
exports.filterSummaryContent = filterSummaryContent;
const model_util_1 = require("./models/model_util");
const citation_utils_1 = require("./tasks/utils/citation_utils");
/**
 * Rerun a function multiple times.
 * @param func the function to attempt
 * @param isValid checks that the response from func is valid
 * @param maxRetries the maximum number of times to retry func
 * @param errorMsg the error message to throw
 * @param retryDelayMS how long to wait in miliseconds between calls
 * @param funcArgs the args for func and isValid
 * @param isValidArgs the args for isValid
 * @returns the valid response from func
 */
/* eslint-disable  @typescript-eslint/no-explicit-any */
function retryCall(func_1, isValid_1, maxRetries_1, errorMsg_1) {
  return __awaiter(
    this,
    arguments,
    void 0,
    function* (
      func,
      isValid,
      maxRetries,
      errorMsg,
      retryDelayMS = model_util_1.RETRY_DELAY_MS,
      funcArgs,
      isValidArgs
    ) {
      var _a;
      /* eslint-enable  @typescript-eslint/no-explicit-any */
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = yield func(...funcArgs);
          if (isValid(response, ...isValidArgs)) {
            return response;
          }
          console.error(`Attempt ${attempt} failed. Invalid response:`, response);
          /* eslint-disable  @typescript-eslint/no-explicit-any */
        } catch (error) {
          if (
            ((_a = error.message) === null || _a === void 0
              ? void 0
              : _a.includes("Too Many Requests")) ||
            error.code === 429 ||
            error.status === "RESOURCE_EXHAUSTED"
          ) {
            // log error message only to avoid spamming the logs with stacktraces
            console.error(`Attempt ${attempt} failed: ${error.message}`);
          } else {
            console.error(`Attempt ${attempt} failed:`, error);
          }
        }
        // Exponential backoff calculation
        const backoffGrowthRate = 1; // controls how quickly delay increases b/w retries (higher value = faster increase)
        const delay = retryDelayMS * Math.pow(backoffGrowthRate, attempt - 1);
        console.log(`Retrying in ${delay / 1000} seconds (attempt ${attempt})`);
        yield new Promise((resolve) => setTimeout(resolve, delay));
      }
      throw new Error(`Failed after ${maxRetries} attempts: ${errorMsg}`);
    }
  );
}
/**
 * Combines the data and instructions into a prompt to send to Vertex.
 * @param instructions: what the model should do.
 * @param data: the data that the model should consider.
 * @param additionalContext additional context to include in the prompt.
 * @param dataWrapper: a function for wrapping each data entry
 * @returns the instructions and the data as a text
 */
function getAbstractPrompt(instructions, data, dataWrapper, additionalContext) {
  return `
<instructions>
  ${instructions}
</instructions>
${additionalContext ? "\n<additionalContext>\n  " + additionalContext + "\n</additionalContext>\n" : ""}
<data>
  ${data.map(dataWrapper).join("\n  ")}
</data>`;
}
/**
 * Combines the data and instructions into a prompt to send to Vertex.
 * @param instructions: what the model should do.
 * @param data: the data that the model should consider.
 * @param additionalContext additional context to include in the prompt.
 * @returns the instructions and the data as a text
 */
function getPrompt(instructions, data, additionalContext) {
  return getAbstractPrompt(
    instructions,
    data,
    (data) => `<comment>${data}</comment>`,
    additionalContext
  );
}
/**
 * Utility function for formatting the comments together with vote tally data
 * @param commentData: the data to summarize, as an array of Comment objects
 * @returns: comments, together with vote tally information as JSON
 */
function formatCommentsWithVotes(commentData) {
  return commentData.map(
    (comment) => comment.text + "\n      vote info per group: " + JSON.stringify(comment.voteInfo)
  );
}
/**
 * Converts the given commentRecords to Comments.
 * @param commentRecords what to convert to Comments
 * @param missingTexts the original comments with IDs match the commentRecords
 * @returns a list of Comments with all possible fields from commentRecords.
 */
function hydrateCommentRecord(commentRecords, missingTexts) {
  const inputCommentsLookup = new Map(missingTexts.map((comment) => [comment.id, comment]));
  return commentRecords
    .map((commentRecord) => {
      // Combine the matching Comment with the topics from the CommentRecord.
      const comment = inputCommentsLookup.get(commentRecord.id);
      if (comment) {
        comment.topics = commentRecord.topics;
      }
      return comment;
    })
    .filter((comment) => {
      return comment !== undefined;
    });
}
/**
 * Groups categorized comments by topic and subtopic.
 *
 * @param categorized An array of categorized comments.
 * @returns A JSON representing the comments grouped by topic and subtopic.
 *
 * Example:
 * {
 *   "Topic 1": {
 *     "Subtopic 2": {
 *       "id 1": "comment 1",
 *       "id 2": "comment 2"
 *     }
 *   }
 * }
 *
 * TODO: create a similar function to group comments by topics only.
 */
function groupCommentsBySubtopic(categorized) {
  const groupedComments = {};
  for (const comment of categorized) {
    if (!comment.topics || comment.topics.length === 0) {
      console.log(`Comment with ID ${comment.id} has no topics assigned.`);
      continue;
    }
    for (const topic of comment.topics) {
      if (!groupedComments[topic.name]) {
        groupedComments[topic.name] = {}; // init new topic name
      }
      if ("subtopics" in topic) {
        for (const subtopic of topic.subtopics || []) {
          if (!groupedComments[topic.name][subtopic.name]) {
            groupedComments[topic.name][subtopic.name] = {}; // init new subtopic name
          }
          groupedComments[topic.name][subtopic.name][comment.id] = comment;
        }
      }
    }
  }
  return groupedComments;
}
/**
 * Gets a set of unique topics and subtopics from a list of comments.
 * @param comments the comments with topics and subtopics to consider
 * @returns a set of unique topics and subtopics
 */
function getUniqueTopics(comments) {
  const topicNameToTopic = new Map();
  for (const comment of comments) {
    if (comment.topics) {
      for (const topic of comment.topics) {
        const existingTopic = topicNameToTopic.get(topic.name);
        if (!existingTopic) {
          topicNameToTopic.set(topic.name, topic);
        } else {
          const existingSubtopics =
            "subtopics" in existingTopic
              ? existingTopic.subtopics.map((subtopic) => subtopic.name)
              : [];
          const newSubtopics =
            "subtopics" in topic ? topic.subtopics.map((subtopic) => subtopic.name) : [];
          const uniqueSubtopics = new Set([...existingSubtopics, ...newSubtopics]);
          topicNameToTopic.set(topic.name, {
            name: topic.name,
            subtopics: Array.from(uniqueSubtopics).map((subtopic) => ({ name: subtopic })),
          });
        }
      }
    }
  }
  return Array.from(topicNameToTopic.values());
}
/**
 * Format a decimal number as a percent string with the given precision
 * @param decimal The decimal number to convert
 * @param precision The precision
 * @returns A string representing the equivalent percentage
 */
function decimalToPercent(decimal, precision = 0) {
  const percentage = decimal * 100;
  const roundedPercentage = Math.round(percentage * 10 ** precision) / 10 ** precision;
  return `${roundedPercentage}%`;
}
/**
 * Return the markdown corresponding to the extraColumns specification for the given Comment row,
 * without either the leading or tailing | bars.
 * @param extraColumns Either a Comment object key (string) or ColumnDefinition object
 * @param row Comment object
 * @returns A string representing the additional column values
 */
function extraColumnDataMd(extraColumns, row) {
  return extraColumns.length > 0
    ? " <small>" +
        extraColumns
          .map((extraColumn) => columnValue(extraColumn, row))
          .join("</small> | <small>") +
        "</small> |"
    : "";
}
/**
 * Returns the table cell entry for the given ColumnDefinition (or Comment key) and Comment
 * object.
 * @param extraColumn Either a Comment key, or a ColumnDefinition object
 * @param comment A comment object
 * @returns The corresponding table cell value
 */
function columnValue(extraColumn, comment) {
  return typeof extraColumn === "string" ? comment[extraColumn] : extraColumn.getValue(comment);
}
/**
 * Return header name for extraColumn specification, either the returning the string back
 * or getting the columnName specification for a ColumnDefinition object.
 */
function columnHeader(extraColumn) {
  return typeof extraColumn === "string" ? extraColumn : extraColumn.columnName;
}
/**
 * Returns a markdown table of comment data for inspection and debugging.
 * @param comments An array of Comment objects to include in the table.
 * @param extraColumns An array of keys of the comment objects to add as table cells.
 * @returns A string containing the markdown table.
 */
function commentTableMarkdown(comments, extraColumns = []) {
  // Format the comments as a markdown table, with rows keyed by comment id,
  // displaying comment text and vote tally breakdown.
  const hasExtraCols = extraColumns.length > 0;
  const extraHeaders = extraColumns.map(columnHeader);
  const extraHeadersMd = hasExtraCols ? " " + extraHeaders.join(" | ") + " |" : "";
  const extraHeadersUnderlineMd = hasExtraCols
    ? " " + extraHeaders.map((h) => "-".repeat(h.length)).join(" | ") + " |"
    : "";
  return (
    `\n| id | text | votes |${extraHeadersMd}\n| -- | ---- | ---- |${extraHeadersUnderlineMd}\n` +
    comments.reduce(
      (ct, comment) =>
        ct +
        `| ${comment.id}&nbsp; | ${comment.text} | <small>${(0, citation_utils_1.voteInfoToString)(comment)}</small> |${extraColumnDataMd(extraColumns, comment)}\n`,
      ""
    )
  );
}
/**
 * Executes a batch of asynchronous functions (callbacks) concurrently.
 * This is essential for running multiple LLM calls in parallel, as it submits requests downstream as a batch.
 *
 * @param callbacks A batch of functions, each of which returns a Promise<T>.
 * @returns A Promise that resolves to an array containing the resolved values of the
 * promises returned by the callbacks, in the same order as the callbacks.
 */
function executeConcurrently(callbacks) {
  return __awaiter(this, void 0, void 0, function* () {
    // NOTE: if a least one callback fails, the entire batch fails.
    // Because of that, we should aim to retry any failed callbacks down the call stack,
    // and avoid retries higher up the stack, as it will retry entire batch from scratch, including completed callbacks.
    return yield Promise.all(callbacks.map((callback) => callback()));
  });
}
/**
 * This function creates a copy of the input summaryContent object, filtering out
 * any subContents according to filterFn, as appropriate
 * @param summaryContent Input summary content
 * @returns the resulting summary conten, as a new data structure
 */
function filterSummaryContent(summaryContent, filterFn) {
  var _a;
  const filteredTopicSummary = {
    title: summaryContent.title,
    text: summaryContent.text,
    citations: summaryContent.citations,
    subContents:
      (_a = summaryContent.subContents) === null || _a === void 0
        ? void 0
        : _a.filter(filterFn).map((s) => filterSummaryContent(s, filterFn)),
  };
  return filteredTopicSummary;
}
