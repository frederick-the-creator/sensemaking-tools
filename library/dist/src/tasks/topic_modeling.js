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
exports.LEARN_TOPICS_PROMPT = void 0;
exports.learnOneLevelOfTopicsPrompt = learnOneLevelOfTopicsPrompt;
exports.generateTopicModelingPrompt = generateTopicModelingPrompt;
exports.learnOneLevelOfTopics = learnOneLevelOfTopics;
exports.learnedTopicsValid = learnedTopicsValid;
const typebox_1 = require("@sinclair/typebox");
const model_util_1 = require("../models/model_util");
const sensemaker_utils_1 = require("../sensemaker_utils");
const types_1 = require("../types");
// import fs from "fs";
// import path from "path";
/**
 * @fileoverview Helper functions for performing topic modeling on sets of comments.
 */
exports.LEARN_TOPICS_PROMPT = `
Analyze the following comments and identify common topics.
Consider the granularity of topics: too few topics may oversimplify the content and miss important nuances, while too many topics may lead to redundancy and make the overall structure less clear.
Aim for a balanced number of topics that effectively summarizes the key themes without excessive detail.
After analysis of the comments, determine the optimal number of topics to represent the content effectively.
Justify why having fewer topics would be less optimal (potentially oversimplifying and missing key nuances), and why having more topics would also be less optimal (potentially leading to redundancy and a less clear overall structure).
After determining the optimal number of topics, identify those topics.
`;
function learnOneLevelOfTopicsPrompt(
  parentTopic,
  otherTopics,
  prompt_learn_themes,
  prompt_learn_factors,
  prompt_learn_metrics
) {
  var _a;
  const otherTopicNames =
    (_a =
      otherTopics === null || otherTopics === void 0
        ? void 0
        : otherTopics.map((topic) => topic.name).join(", ")) !== null && _a !== void 0
      ? _a
      : "";
  if (prompt_learn_factors) {
    prompt_learn_factors = prompt_learn_factors
      .replace(/{{parentTopicName}}/g, parentTopic.name)
      .replace(/{{otherTopicNames}}/g, otherTopicNames);
    return prompt_learn_factors;
  } else if (prompt_learn_metrics) {
    prompt_learn_metrics = prompt_learn_metrics
      .replace(/{{parentTopicName}}/g, parentTopic.name)
      .replace(/{{otherTopicNames}}/g, otherTopicNames);
    return prompt_learn_metrics;
  } else if (prompt_learn_themes) {
    return prompt_learn_themes;
  } else {
    return "No prompt provided";
  }
}
/**
 * Generates an LLM prompt for topic modeling of a set of comments.
 *
 * @param parentTopics - Optional. An array of top-level topics to use.
 * @param theme - Optional theme string to include in the prompt.
 * @param factor - Optional factor string to include in the prompt.
 * @returns The generated prompt string.
 */
function generateTopicModelingPrompt(
  parentTopic,
  otherTopics,
  theme,
  factor,
  prompt_learn_themes,
  prompt_learn_factors,
  prompt_learn_metrics
) {
  if (theme) {
    return learnOneLevelOfTopicsPrompt(
      { name: theme },
      otherTopics,
      undefined,
      prompt_learn_factors,
      undefined
    );
  } else if (factor) {
    return learnOneLevelOfTopicsPrompt(
      { name: factor },
      otherTopics,
      undefined,
      undefined,
      prompt_learn_metrics
    );
  } else if (prompt_learn_themes) {
    return learnOneLevelOfTopicsPrompt(
      { name: "NA" },
      otherTopics,
      prompt_learn_themes,
      undefined,
      undefined
    );
  } else {
    return exports.LEARN_TOPICS_PROMPT;
  }
}
/**
 * Learn either topics or subtopics from the given comments.
 * @param comments the comments to consider
 * @param model the LLM to use
 * @param topic given or learned topic that subtopics will fit under
 * @param otherTopics other topics that are being used, this is used
 * to avoid duplicate topic/subtopic names
 * @param additionalContext more info to give the model
 * @param theme optional theme string to include in the prompt
 * @param factor optional factor string to include in the prompt
 * @returns the topics that are present in the comments.
 */
function learnOneLevelOfTopics(
  comments,
  model,
  topic,
  otherTopics,
  additionalContext,
  theme,
  factor,
  prompt_learn_themes,
  prompt_learn_factors,
  prompt_learn_metrics
) {
  const instructions = generateTopicModelingPrompt(
    topic,
    otherTopics,
    theme,
    factor,
    prompt_learn_themes,
    prompt_learn_factors,
    prompt_learn_metrics
  );
  const schema =
    theme || factor
      ? typebox_1.Type.Array(types_1.NestedTopic)
      : typebox_1.Type.Array(types_1.FlatTopic);
  return (0, sensemaker_utils_1.retryCall)(
    function (model) {
      return __awaiter(this, void 0, void 0, function* () {
        const promptData = prompt_learn_metrics ? [] : comments.map((comment) => comment.text);
        const finalPrompt = (0, sensemaker_utils_1.getPrompt)(
          instructions,
          promptData,
          additionalContext
        );
        const llmOutput = yield model.generateData(finalPrompt, schema);
        return llmOutput;
      });
    },
    function (response) {
      return learnedTopicsValid(response, topic);
    },
    model_util_1.MAX_RETRIES,
    "Topic identification failed.",
    undefined,
    [model],
    []
  );
}
/**
 * Validates the topic modeling response from the LLM.
 *
 * @param response The topic modeling response from the LLM.
 * @param parentTopics Optional. An array of parent topic names to validate against.
 * @returns True if the response is valid, false otherwise.
 */
function learnedTopicsValid(response, parentTopic) {
  const topicNames = response.map((topic) => topic.name);
  // 1. If a parentTopic is provided, ensure no other top-level topics exist except "Other".
  if (parentTopic) {
    const allowedTopicNames = [parentTopic]
      .map((topic) => topic.name.toLowerCase())
      .concat("other");
    if (!topicNames.every((name) => allowedTopicNames.includes(name.toLowerCase()))) {
      topicNames.forEach((topicName) => {
        if (!allowedTopicNames.includes(topicName.toLowerCase())) {
          console.warn(
            "Invalid response: Found top-level topic not present in the provided topics. Provided topics: ",
            allowedTopicNames,
            " Found topic: ",
            topicName
          );
        }
      });
      return false;
    }
  }
  // 2. Ensure no subtopic has the same name as any main topic.
  for (const topic of response) {
    const subtopicNames =
      "subtopics" in topic ? topic.subtopics.map((subtopic) => subtopic.name) : [];
    for (const subtopicName of subtopicNames) {
      if (topicNames.includes(subtopicName) && subtopicName !== "Other") {
        console.warn(
          `Invalid response: Subtopic "${subtopicName}" has the same name as a main topic.`
        );
        return false;
      }
    }
  }
  return true;
}
