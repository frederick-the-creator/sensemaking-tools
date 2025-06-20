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
exports.categorizeWithRetry = categorizeWithRetry;
exports.topicCategorizationPrompt = topicCategorizationPrompt;
exports.validateCommentRecords = validateCommentRecords;
exports.findMissingComments = findMissingComments;
exports.getTopicDepthFromTopics = getTopicDepthFromTopics;
exports.categorizeCommentsRecursive = categorizeCommentsRecursive;
exports.oneLevelCategorization = oneLevelCategorization;
const types_1 = require("../types");
const sensemaker_utils_1 = require("../sensemaker_utils");
const typebox_1 = require("@sinclair/typebox");
const topic_modeling_1 = require("./topic_modeling");
const model_util_1 = require("../models/model_util");
/**
 * @fileoverview Helper functions for performing comments categorization.
 */
/**
 * Makes API call to generate JSON and retries with any comments that were not properly categorized.
 * @param instructions Instructions for the LLM on how to categorize the comments.
 * @param inputComments The comments to categorize.
 * @param topics The topics and subtopics provided to the LLM for categorization.
 * @param additionalContext - extra context to be included to the LLM prompt
 * @returns The categorized comments.
 */
function categorizeWithRetry(model, instructions, inputComments, topics, additionalContext) {
  return __awaiter(this, void 0, void 0, function* () {
    // a holder for uncategorized comments: first - input comments, later - any failed ones that need to be retried
    let uncategorized = [...inputComments];
    let categorized = [];
    for (let attempts = 1; attempts <= model_util_1.MAX_RETRIES; attempts++) {
      // convert JSON to string refation that will be sent to the model
      const uncategorizedCommentsForModel = uncategorized.map((comment) =>
        JSON.stringify({ id: comment.id, text: comment.text })
      );
      const outputSchema = typebox_1.Type.Array(types_1.TopicCategorizedComment);
      const newCategorized = yield model.generateData(
        (0, sensemaker_utils_1.getPrompt)(
          instructions,
          uncategorizedCommentsForModel,
          additionalContext
        ),
        outputSchema
      );
      const newProcessedComments = processCategorizedComments(
        newCategorized,
        inputComments,
        uncategorized,
        topics
      );
      categorized = categorized.concat(newProcessedComments.commentRecords);
      uncategorized = newProcessedComments.uncategorizedComments;
      if (uncategorized.length === 0) {
        break; // All comments categorized successfully
      }
      if (attempts < model_util_1.MAX_RETRIES) {
        console.warn(
          `Expected all ${uncategorizedCommentsForModel.length} comments to be categorized, but ${uncategorized.length} are not categorized properly. Retrying in ${model_util_1.RETRY_DELAY_MS / 1000} seconds...`
        );
        yield new Promise((resolve) => setTimeout(resolve, model_util_1.RETRY_DELAY_MS));
      } else {
        categorized = categorized.concat(assignDefaultCategory(uncategorized));
      }
    }
    return categorized;
  });
}
function topicCategorizationPrompt(topics, prompt_categorise_comments) {
  if (prompt_categorise_comments) {
    prompt_categorise_comments = prompt_categorise_comments.replace(
      /{{topics}}/g,
      JSON.stringify(topics)
    );
    return prompt_categorise_comments;
  } else {
    return "No prompt provided";
  }
}
/**
 * Validates categorized comments, checking for:
 *  - Extra comments (not present in the original input)
 *  - Empty topics or subtopics
 *  - Invalid topic or subtopic names
 * @param commentRecords The categorized comments to validate.
 * @param inputComments The original input comments.
 * @param topics The topics and subtopics provided to the LLM for categorization.
 * @returns An object containing:
 *  - `validCommentRecords`: comments that passed validation.
 *  - `commentsWithInvalidTopics`: comments that failed validation.
 */
function validateCommentRecords(commentRecords, inputComments, topics) {
  const commentsPassedValidation = [];
  const commentsWithInvalidTopics = [];
  // put all input comment ids together for output ids validation
  const inputCommentIds = new Set(inputComments.map((comment) => comment.id));
  // topic -> subtopics lookup for naming validation
  const topicLookup = createTopicLookup(topics);
  commentRecords.forEach((comment) => {
    if (isExtraComment(comment, inputCommentIds)) {
      return; // Skip to the next comment
    }
    if (hasEmptyTopicsOrSubtopics(comment)) {
      commentsWithInvalidTopics.push(comment);
      return; // Skip to the next comment
    }
    if (hasInvalidTopicNames(comment, topicLookup)) {
      commentsWithInvalidTopics.push(comment);
      return; // Skip to the next comment
    }
    // If all checks pass, add the comment to the valid ones
    commentsPassedValidation.push(comment);
  });
  return { commentsPassedValidation, commentsWithInvalidTopics };
}
/**
 * Creates a lookup table (dictionary) from an array of input Topic objects.
 * This table maps topic names to arrays of their corresponding subtopic names.
 *
 * @param inputTopics The array of Topic objects to create the lookup table from.
 * @returns A dictionary where keys are topic names (strings) and values are arrays of subtopic names (strings).
 *   If a topic has no subtopics, an empty array is used as the value to avoid dealing with undefined values.
 */
function createTopicLookup(inputTopics) {
  const lookup = {};
  for (const topic of inputTopics) {
    if ("subtopics" in topic) {
      lookup[topic.name] = topic.subtopics.map((subtopic) => subtopic.name);
    } else {
      lookup[topic.name] = [];
    }
  }
  return lookup;
}
/**
 * Checks if a comment is an extra comment (not present in the original input).
 * @param comment The categorized comment to check.
 * @param inputCommentIds An array of IDs of the original input comments.
 * @returns True if the comment is extra, false otherwise.
 */
function isExtraComment(comment, inputCommentIds) {
  if (!inputCommentIds.has(comment.id)) {
    console.warn(`Extra comment in model's response: ${JSON.stringify(comment)}`);
    return true;
  }
  return false;
}
/**
 * Checks if a comment has empty topics or subtopics.
 * @param comment The categorized comment to check.
 * @returns True if the comment has empty topics or subtopics, false otherwise.
 */
function hasEmptyTopicsOrSubtopics(comment) {
  if (comment.topics.length === 0) {
    console.warn(`Comment with empty topics: ${JSON.stringify(comment)}`);
    return true;
  }
  if (
    comment.topics.some(
      (topic) => "subtopics" in topic && (!topic.subtopics || topic.subtopics.length === 0)
    )
  ) {
    console.warn(`Comment with empty subtopics: ${JSON.stringify(comment)}`);
    return true;
  }
  return false;
}
/**
 * Checks if a categorized comment has topic or subtopic names different from the provided ones to the LLM.
 * @param comment The categorized comment to check.
 * @param inputTopics The lookup table mapping the input topic names to arrays of their subtopic names.
 * @returns True if the comment has invalid topic or subtopic names, false otherwise.
 */
function hasInvalidTopicNames(comment, inputTopics) {
  // We use `some` here to return as soon as we find an invalid topic (or subtopic).
  return comment.topics.some((topic) => {
    const isValidTopic = topic.name in inputTopics;
    if (!isValidTopic && topic.name !== "Other") {
      console.warn(
        `Comment has an invalid topic: ${topic.name}, comment: ${JSON.stringify(comment)}`
      );
      return true; // Invalid topic found, stop checking and return `hasInvalidTopicNames` true for this comment.
    }
    if ("subtopics" in topic) {
      const areAllSubtopicsValid = areSubtopicsValid(topic.subtopics, inputTopics[topic.name]);
      if (!areAllSubtopicsValid) {
        console.warn(
          `Comment has invalid subtopics under topic: ${topic.name}, comment: ${JSON.stringify(comment)}`
        );
        return true; // Invalid subtopics found, stop checking and return `hasInvalidTopicNames` true for this comment.
      }
    }
    // The current topic (and all its subtopics) is valid, go to the next one.
    return false;
  });
}
/**
 * Checks if an array of subtopics is valid against a list of valid subtopic names.
 * A subtopic is considered valid if its name is present in the input subtopics or if it's named "Other".
 *
 * @param subtopicsToCheck An array of subtopic objects, each having a 'name' property.
 * @param inputSubtopics An array of input subtopic names.
 * @returns True if all subtopics are valid, false otherwise.
 */
function areSubtopicsValid(subtopicsToCheck, inputSubtopics) {
  return subtopicsToCheck.every(
    (subtopic) => inputSubtopics.includes(subtopic.name) || subtopic.name === "Other"
  );
}
/**
 * Finds comments that are missing from the categorized output.
 * @param commentRecords The categorized comments received from the model.
 * @param uncategorized The current set of uncategorized comments to check if any are missing in the model response.
 * @returns An array of comments that were present in the input, but not in categorized.
 */
function findMissingComments(commentRecords, uncategorized) {
  const commentRecordIds = commentRecords.map((comment) => comment.id);
  const missingComments = uncategorized.filter(
    (uncommentRecord) => !commentRecordIds.includes(uncommentRecord.id)
  );
  if (missingComments.length > 0) {
    console.warn(`Missing comments in model's response: ${JSON.stringify(missingComments)}`);
  }
  return missingComments;
}
/**
 * Processes the categorized comments, validating them and updating the categorized and uncategorized arrays.
 *
 * @param commentRecords The newly categorized comments from the LLM.
 * @param inputComments The original input comments.
 * @param uncategorized The current set of uncategorized comments to check if any are missing in the model response.
 * @param topics The topics and subtopics provided to the LLM for categorization.
 * @returns The successfully categorized comments and the unsuccessfully categorized comments with
 * the topics removed.
 */
function processCategorizedComments(commentRecords, inputComments, uncategorized, topics) {
  // Check for comments that were never in the input, have no topics, or non-matching topic names.
  const { commentsPassedValidation, commentsWithInvalidTopics } = validateCommentRecords(
    commentRecords,
    inputComments,
    topics
  );
  // Check for comments completely missing in the model's response
  const missingComments = findMissingComments(commentRecords, uncategorized);
  // Remove invalid topics from comments to prepare for retry.
  let invalidComments = (0, sensemaker_utils_1.hydrateCommentRecord)(
    commentsWithInvalidTopics,
    inputComments
  );
  invalidComments = invalidComments.map((comment) => {
    comment.topics = undefined;
    return comment;
  });
  // Combine all invalid comments for retry
  return {
    commentRecords: commentsPassedValidation,
    uncategorizedComments: [...missingComments, ...invalidComments],
  };
}
/**
 * Assigns the default "Other" topic and optionally "Uncategorized" subtopic to comments that
 * failed categorization.
 *
 * @param uncategorized The array of comments that failed categorization.
 * @returns the uncategorized comments now categorized into a "Other" category.
 */
function assignDefaultCategory(uncategorized) {
  console.warn(
    `Failed to categorize ${uncategorized.length} comments after maximum number of retries. Assigning "Other" topic and "Uncategorized" subtopic to failed comments.`
  );
  console.warn("Uncategorized comments:", JSON.stringify(uncategorized));
  return uncategorized.map((comment) => {
    return Object.assign(Object.assign({}, comment), { topics: [{ name: "Other" }] });
  });
}
function getTopicDepthFromTopics(topics, currentDepth = 1) {
  if (!topics || topics.length === 0) {
    return currentDepth - 1; // avoid infinite recursion for empty topics
  }
  return topics.every((topic) => {
    return "subtopics" in topic && topic.subtopics.length > 0;
  })
    ? getTopicDepthFromTopics(
        topics.map((topic) => ("subtopics" in topic ? topic.subtopics : [])).flat(),
        currentDepth + 1
      )
    : currentDepth;
}
/**
 * Get the minimum topic depth across all comments.
 */
function getTopicDepth(comments) {
  return comments
    .map((comment) => {
      return comment.topics ? getTopicDepthFromTopics(comment.topics, 1) : 0;
    })
    .reduce((minDepth, depth) => Math.min(minDepth, depth), Number.MAX_VALUE);
}
// Return a flat list of topics representing all the topics at a depth
function getTopicsAtDepth(topics, depth) {
  if (depth === 1) {
    return topics;
  } else if (depth >= 2) {
    return getTopicsAtDepth(
      topics
        .map((topic) => {
          return "subtopics" in topic ? topic.subtopics : [];
        })
        .flat(),
      depth - 1
    );
  } else {
    throw Error("Invalid depth value provided, depth: " + depth);
  }
}
function getCommentsWithTopic(comments, topicName) {
  return comments.filter(
    (comment) => comment.topics && comment.topics.map((topic) => topic.name).includes(topicName)
  );
}
/**
 * Gets the comment texts and ids with a topic at a given level.
 *
 * Note the comment topics are from the given depth level and have been modified.
 *
 * @param comments the categorized comments to search
 * @param topicName the name of the topic to match
 * @param depth the depth to search at
 * @returns the comments with the given topicName at the given depth
 */
function getCommentTextsWithTopicsAtDepth(comments, topicName, depth = 1) {
  if (depth === 1) {
    return getCommentsWithTopic(comments, topicName);
  } else if (depth >= 2) {
    return getCommentTextsWithTopicsAtDepth(
      comments
        .filter((comment) => {
          return comment.topics !== undefined;
        })
        .map((comment) => {
          return {
            id: comment.id,
            text: comment.text,
            topics: comment.topics
              .map((topic) => ("subtopics" in topic ? topic.subtopics : []))
              .flat(),
          };
        }),
      topicName,
      depth - 1
    );
  } else {
    throw Error("Invalid depth value provided, depth: " + depth);
  }
}
/**
 * Add subtopics to an existing topic
 * @param topic the topic to add the subtopics to
 * @param parentSubtopic the topic that is the parent of the new subtopics
 * @param newSubtopics the new subtopics to add to topic
 * @returns the topic with the new subtopics added at the right level
 */
function addNewLevelToTopic(topic, parentSubtopic, newSubtopics) {
  if ("subtopics" in topic) {
    if (!("subtopics" in parentSubtopic)) {
      throw Error("Expected parent topic to have subtopics");
    }
    for (let i = 0; i < topic.subtopics.length; i++) {
      if (topic.subtopics[i].name === parentSubtopic.name) {
        topic.subtopics[i] = addNewLevelToTopic(
          topic.subtopics[i],
          parentSubtopic.subtopics[0],
          newSubtopics
        );
      }
    }
    return topic;
  } else {
    return { name: topic.name, subtopics: newSubtopics };
  }
}
/**
 * Combine full comments with newly categorized comments with one extra level of categorization
 * @param comments the existing comments to merge into
 * @param categorizedComments a subset of comments that have been newly categorized. The
 * categorization is always topics only but should be merged at the topicDepth level
 * @param topic the parent topic to the topics associated with categorizedComments
 * @param topicDepth the depth of the newly categorizedComments on the comment object
 * @returns all the comments with the one new level of categorization added
 */
function mergeCommentTopics(comments, categorizedComments, topic, topicDepth) {
  const commentIdsInTopic = getCommentTextsWithTopicsAtDepth(comments, topic.name, topicDepth).map(
    (comment) => comment.id
  );
  for (const commentId of commentIdsInTopic) {
    const matchingCategorized = categorizedComments.find(
      (categorized) => categorized.id === commentId
    );
    if (!matchingCategorized || !matchingCategorized.topics) {
      continue;
    }
    // Iterate through comments using indices so that the value can be changed.
    for (let i = 0; i < comments.length; i++) {
      const currentComment = comments[i];
      if (currentComment.id !== commentId || currentComment.topics === undefined) {
        continue;
      }
      // Merge in matchingCategorized either as a new subtopic or a new subsubtopic.
      for (let j = 0; j < currentComment.topics.length; j++) {
        const existingTopic = currentComment.topics[j];
        if (existingTopic.name === topic.name) {
          currentComment.topics[j] = addNewLevelToTopic(
            existingTopic,
            topic,
            matchingCategorized.topics
          );
        } else if ("subtopics" in existingTopic) {
          for (let k = 0; k < existingTopic.subtopics.length; k++) {
            const existingSubtopic = existingTopic.subtopics[k];
            if (existingSubtopic.name === topic.name) {
              if ("subtopics" in currentComment.topics[j]) {
                currentComment.topics[j] = {
                  name: existingTopic.name,
                  subtopics: [
                    ...existingTopic.subtopics.slice(0, k),
                    addNewLevelToTopic(existingSubtopic, topic, matchingCategorized.topics),
                    ...existingTopic.subtopics.slice(k + 1),
                  ],
                };
              }
            }
          }
        }
      }
    }
  }
  return comments;
}
/**
 * Merge an existing topic with new subtopics into a list of all topics.
 * @param topics the existing topics to merge into
 * @param topicAndNewSubtopics the existing topic (must match a topic name from topics) with the
 * new subtopics to add to it
 * @returns the list of existing topics with the new subtopics added to the appropriate topic
 */
function mergeTopics(topics, topicAndNewSubtopics) {
  if (!("subtopics" in topicAndNewSubtopics)) {
    return topics;
  }
  for (let i = 0; i < topics.length; i++) {
    if (topics[i].name === topicAndNewSubtopics.name) {
      topics[i] = { name: topics[i].name, subtopics: topicAndNewSubtopics.subtopics };
      return topics;
    }
  }
  return topics;
}
/**
 * Categorize comments one level at a time.
 *
 * For comments without topics, first all the topics are learned, then the comments are
 * categorized into the topics, then for each topic the subset of relevant comments are selected
 * and this is repeated recursively.
 *
 * @param comments the comments to categorize to the given depthLevel
 * @param topicDepth the depth of categorization and topic learning, 1 is topic only; 2 is topics
 * and subtopics; 3 is topics, subtopics, and subsubtopics
 * @param model the model to use for topic learning and categorization
 * @param topics a given set of topics to categorize the comments into
 * @param additionalContext information to give the model
 * @param theme the theme to pass to learnOneLevelOfTopics
 * @param factor the factor to pass to learnOneLevelOfTopics
 * @returns the comments categorized to the level specified by topicDepth
 */
function categorizeCommentsRecursive(
  comments,
  topicDepth,
  model,
  topics,
  additionalContext,
  theme,
  factor,
  prompt_categorise_comments,
  prompt_learn_factors,
  prompt_learn_metrics,
  prompt_learn_themes
) {
  return __awaiter(this, void 0, void 0, function* () {
    const currentTopicDepth = getTopicDepth(comments);
    console.log("Identifying topics and categorizing statements at depth=", currentTopicDepth);
    if (currentTopicDepth >= topicDepth) {
      return comments;
    }
    if (!topics) {
      // Case where no topics are provided (used for Factor and Metric Analysis, and Thematic Analysis when theme learning is required)
      // If block does both topic learning and categorisation.
      console.log("Learn topics branch triggered");
      topics = yield (0, topic_modeling_1.learnOneLevelOfTopics)(
        comments,
        model,
        undefined,
        undefined,
        additionalContext,
        theme,
        factor,
        prompt_learn_factors,
        prompt_learn_metrics,
        prompt_learn_themes
      );
      let topicsCategorise = [];
      if (prompt_learn_themes) {
        topicsCategorise = topics.map((t) => ({ name: t.name }));
      } else {
        topicsCategorise = topics.flatMap((t) =>
          "subtopics" in t && t.subtopics ? t.subtopics : []
        );
      }
      comments = yield oneLevelCategorization(
        comments,
        model,
        topicsCategorise,
        additionalContext,
        prompt_categorise_comments
      );
      // Sometimes comments are categorized into an "Other" topic if no given topics are a good fit.
      // This needs included in the list of topics so these are processed downstream.
      topics.push({ name: "Other" });
      return categorizeCommentsRecursive(comments, topicDepth, model, topics, additionalContext);
    }
    if (topics && currentTopicDepth === 0) {
      // Cases where topics ARE provided (used for Thematic Analysis)
      // If block does categorisation only.
      comments = yield oneLevelCategorization(
        comments,
        model,
        topics,
        additionalContext,
        prompt_categorise_comments
      );
      // Sometimes comments are categorized into an "Other" topic if no given topics are a good fit.
      // This needs included in the list of topics so these are processed downstream.
      topics.push({ name: "Other" });
      return categorizeCommentsRecursive(comments, topicDepth, model, topics, additionalContext);
    }
    let index = 0;
    const parentTopics = getTopicsAtDepth(topics, currentTopicDepth);
    for (let topic of parentTopics) {
      console.log(
        "Categorizing statements into subtopics under: ",
        topic.name,
        ` (${++index}/${parentTopics.length} topics)`
      );
      const commentsInTopic = structuredClone(
        getCommentTextsWithTopicsAtDepth(comments, topic.name, currentTopicDepth)
      );
      if (commentsInTopic.length === 0) {
        continue;
      }
      if (!("subtopics" in topic)) {
        // The subtopics are added to the existing topic, so a list of length one is returned.
        const newTopicAndSubtopics = (yield (0, topic_modeling_1.learnOneLevelOfTopics)(
          commentsInTopic,
          model,
          topic,
          parentTopics,
          additionalContext
        ))[0];
        if (!("subtopics" in newTopicAndSubtopics)) {
          throw Error("Badly formed LLM response - expected 'subtopics' to be in topics ");
        }
        topic = { name: topic.name, subtopics: newTopicAndSubtopics.subtopics };
      }
      // Use the subtopics as high-level topics and merge them in later.
      const categorizedComments = yield oneLevelCategorization(
        commentsInTopic,
        model,
        topic.subtopics,
        additionalContext
      );
      comments = mergeCommentTopics(comments, categorizedComments, topic, currentTopicDepth);
      // Sometimes comments are categorized into an "Other" subtopic if no given subtopics are a good fit.
      // This needs included in the list of subtopics so these are processed downstream.
      const topicWithNewSubtopics = topic;
      topicWithNewSubtopics.subtopics.push({ name: "Other" });
      topics = mergeTopics(topics, topicWithNewSubtopics);
    }
    return categorizeCommentsRecursive(comments, topicDepth, model, topics, additionalContext);
  });
}
function oneLevelCategorization(
  comments,
  model,
  topics,
  additionalContext,
  prompt_categorise_comments
) {
  return __awaiter(this, void 0, void 0, function* () {
    const instructions = topicCategorizationPrompt(topics, prompt_categorise_comments);
    // TODO: Consider the effects of smaller batch sizes. 1 comment per batch was much faster, but
    // the distribution was significantly different from what we're currently seeing. More testing
    // is needed to determine the ideal size and distribution.
    const batchesToCategorize = []; // callbacks
    for (let i = 0; i < comments.length; i += model.categorizationBatchSize) {
      const uncategorizedBatch = comments.slice(i, i + model.categorizationBatchSize);
      // Create a callback function for each batch and add it to the list, preparing them for parallel execution.
      batchesToCategorize.push(() =>
        categorizeWithRetry(model, instructions, uncategorizedBatch, topics, additionalContext)
      );
    }
    // categorize comment batches, potentially in parallel
    const totalBatches = Math.ceil(comments.length / model.categorizationBatchSize);
    console.log(
      `Categorizing ${comments.length} statements in batches (${totalBatches} batches of ${model.categorizationBatchSize} statements)`
    );
    const CategorizedBatches = yield (0, sensemaker_utils_1.executeConcurrently)(
      batchesToCategorize
    );
    // flatten categorized batches
    const categorized = [];
    CategorizedBatches.forEach((batch) => categorized.push(...batch));
    const categorizedComments = (0, sensemaker_utils_1.hydrateCommentRecord)(categorized, comments);
    return categorizedComments;
  });
}
