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
exports.LEARN_TOPICS_PROMPT = void 0;
exports.learnSubtopicsForOneTopicPrompt = learnSubtopicsForOneTopicPrompt;
exports.generateTopicModelingPrompt = generateTopicModelingPrompt;
exports.learnOneLevelOfTopics = learnOneLevelOfTopics;
exports.learnedTopicsValid = learnedTopicsValid;
const typebox_1 = require("@sinclair/typebox");
const model_util_1 = require("../models/model_util");
const sensemaker_utils_1 = require("../sensemaker_utils");
const types_1 = require("../types");
/**
 * @fileoverview Helper functions for performing topic modeling on sets of comments.
 */
exports.LEARN_TOPICS_PROMPT = `
Identify a 1-tiered hierarchical topic modeling of the following comments.

Important Considerations:
- Use Title Case for topic names.
- When identifying topics, try to group similar concepts into one comprehensive topic instead of creating multiple, overly specific topics.
- Create as few topics as possible while covering all the comments.
- Example topic names are: "Education", "Environmental Sustainability", "Transportation"
- Bad topic names are like "Community" which is too vague
`;
function learnSubtopicsForOneTopicPrompt(parentTopic, otherTopics) {
    var _a;
    const otherTopicNames = (_a = otherTopics === null || otherTopics === void 0 ? void 0 : otherTopics.map((topic) => topic.name).join(", ")) !== null && _a !== void 0 ? _a : "";
    return `
Analyze the following comments and identify relevant subtopics within the following topic:
"${parentTopic.name}"

Important Considerations:
- Use Title Case for topic and subtopic names. Do not use capital case like "name": "INFRASTRUCTURE".
- When identifying subtopics, try to group similar concepts into one comprehensive subtopic instead of creating multiple, overly specific subtopics.
- Try to create as few subtopics as possible
- No subtopic should have the same name as the main topic.
- Do not change the name of the main topic ("${parentTopic.name}").
- There are other topics that are being used on different sets of comments, do not use these topic names as subtopic names: ${otherTopicNames}

Example of Incorrect Output:

[
  {
    "name": "Economic Development",
    "subtopics": [
        { "name": "Job Creation" },
        { "name": "Business Growth" },
        { "name": "Small Business Development" },
        { "name": "Small Business Marketing" } // Incorrect: Too closely related to the "Small Business Development" subtopic
        { "name": "Infrastructure & Transportation" } // Incorrect: This is the name of a main topic
      ]
  }
]
`;
}
/**
 * Generates an LLM prompt for topic modeling of a set of comments.
 *
 * @param parentTopics - Optional. An array of top-level topics to use.
 * @returns The generated prompt string.
 */
function generateTopicModelingPrompt(parentTopic, otherTopics) {
    if (parentTopic) {
        return learnSubtopicsForOneTopicPrompt(parentTopic, otherTopics);
    }
    else {
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
 * @returns the topics that are present in the comments.
 */
function learnOneLevelOfTopics(comments, model, topic, otherTopics, additionalContext) {
    const instructions = generateTopicModelingPrompt(topic, otherTopics);
    const schema = topic ? typebox_1.Type.Array(types_1.NestedTopic) : typebox_1.Type.Array(types_1.FlatTopic);
    return (0, sensemaker_utils_1.retryCall)(function (model) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Identifying topics for ${comments.length} statements`);
            return (yield model.generateData((0, sensemaker_utils_1.getPrompt)(instructions, comments.map((comment) => comment.text), additionalContext), schema));
        });
    }, function (response) {
        return learnedTopicsValid(response, topic);
    }, model_util_1.MAX_RETRIES, "Topic identification failed.", undefined, [model], []);
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
                    console.warn("Invalid response: Found top-level topic not present in the provided topics. Provided topics: ", allowedTopicNames, " Found topic: ", topicName);
                }
            });
            return false;
        }
    }
    // 2. Ensure no subtopic has the same name as any main topic.
    for (const topic of response) {
        const subtopicNames = "subtopics" in topic ? topic.subtopics.map((subtopic) => subtopic.name) : [];
        for (const subtopicName of subtopicNames) {
            if (topicNames.includes(subtopicName) && subtopicName !== "Other") {
                console.warn(`Invalid response: Subtopic "${subtopicName}" has the same name as a main topic.`);
                return false;
            }
        }
    }
    return true;
}
