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

import { Type } from "@sinclair/typebox";
import { Model } from "../models/model";
import { MAX_RETRIES } from "../models/model_util";
import { getPrompt, retryCall } from "../sensemaker_utils";
import { Comment, FlatTopic, NestedTopic, Topic } from "../types";

/**
 * @fileoverview Helper functions for performing topic modeling on sets of comments.
 */

export const LEARN_TOPICS_PROMPT = `
Identify a 1-tiered hierarchical topic modeling of the following comments.

Important Considerations:
- Use Title Case for topic names.
- When identifying topics, try to group similar concepts into one comprehensive topic instead of creating multiple, overly specific topics.
- Create as few topics as possible while covering all the comments.
- Example topic names are: "Education", "Environmental Sustainability", "Transportation"
- Bad topic names are like "Community" which is too vague
`;

export function learnOneLevelOfTopicsPrompt(
  parentTopic: Topic,
  otherTopics?: Topic[],
  prompt_learn_factor?: string,
  prompt_learn_metrics?: string
): string {
  const otherTopicNames = otherTopics?.map((topic) => topic.name).join(", ") ?? "";
  console.log("Running Special Factor Prompt");

  if (prompt_learn_factor) {
    console.log("Running Special Factor Generation Prompt - Prompt_learn_factor");
    console.log("prompt_learn_factor", prompt_learn_factor);
    prompt_learn_factor = prompt_learn_factor
      .replace(/{{parentTopicName}}/g, parentTopic.name)
      .replace(/{{otherTopicNames}}/g, otherTopicNames);
    return prompt_learn_factor;
  } else if (prompt_learn_metrics) {
    console.log("Running Special Metric Generation Prompt - Prompt_learn_metrics");
    console.log("prompt_learn_metrics", prompt_learn_metrics);
    prompt_learn_metrics = prompt_learn_metrics
      .replace(/{{parentTopicName}}/g, parentTopic.name)
      .replace(/{{otherTopicNames}}/g, otherTopicNames);
    return prompt_learn_metrics;
  } else {
    return "No prompt provided";
  }
}

// export function learnFactorForOneTopicPrompt(parentTopic: Topic, otherTopics?: Topic[]): string {
//   const otherTopicNames = otherTopics?.map((topic) => topic.name).join(", ") ?? "";
//   console.log("Running Special Factor Prompt");
//   return `
// These comments are related to the topic "${parentTopic.name}" and need to be categorized into factors.
// factors are the main levers or determinants that shape progress toward a topic. They explain how the topic can be advanced.
// For something to classify as a factor:
//   - There must be defensible evidence (research or lived experience) that changing the factor moves the topic.
//   - Stakeholders can design programmes or policies that influence it.
//   - Example path: topic "Community Resilience" has factor "Social Capital";

//   Analyze the following comments and identify relevant factors within the following topic:
// "${parentTopic.name}"

// Important Considerations:
// - Use Title Case for names. Do not use capital case like "name": "INFRASTRUCTURE".
// - When identifying factors, try to group similar concepts into one comprehensive factor instead of creating multiple, overly specific factors.
// - Try to create as few factors as possible
// - factors absolutely cannot have the same name as the main topic.
// - Do not change the name of the main topic ("${parentTopic.name}").
// - There are other topics that are being used on different sets of comments, do not use these topic names as factor names: ${otherTopicNames}

// Example of Incorrect Output:

// [
//   {
//     "name": "Economic Development",
//     "factors": [
//         { "name": "Job Creation" },
//         { "name": "Business Growth" },
//         { "name": "Small Business Development" },
//         { "name": "Small Business Marketing" } // Incorrect: Too closely related to the "Small Business Development" factor
//         { "name": "Economic Development" } // Incorrect: This is the name of a main topic
//       ]
//   }
// ]
// `;
// }

// export function learnMetricsForOneTopicPrompt(parentTopic: Topic, otherTopics?: Topic[]): string {
//   const otherTopicNames = otherTopics?.map((topic) => topic.name).join(", ") ?? "";
//   console.log("Running Special Metric Prompt");
//   return `
// These comments are related to the factor "${parentTopic.name}" and need to be categorized into metrics.
// Metrics are concrete data points or statistics that directly operationalise a Factor.
// Each metric is the number you place on a chart to monitor change in that factor.
// A factor may be tracked by a suite of complementary metrics, each highlighting a distinct facet of the factor.

// For something to classify as a metric:
//   - Clearly and directly reflects an aspect of the factor's concept.
//   - Sourced from a credible, regularly updated dataset.
//   - Transparent methodology, adequate sample size, and clear metadata
//   - Direction of "good" or "bad" is obvious to non-experts

//   Analyze the following comments and identify relevant metrics within the following factor:
// "${parentTopic.name}"

// Important Considerations:
// - Do not change the name of the main factor ("${parentTopic.name}").
// - There are other factors that are being used on different sets of comments, do not use these factor names as metric names: ${otherTopicNames}

// Example Output:

// [
//   {
//     "name": "Industry and Sector Diversification",
//     "subtopics": [
//         { "name": "Percentage of all local jobs found in the single largest industry" },
//         { "name": "Count of industries that each employ at least 5 % of the workforce." },
//         { "name": "Combined share of jobs in the three biggest industries." },
//         { "name": "Share of annual start-ups that fall outside the current top three sectors." }
//         { "name": "Proportion of jobs in industries that sell goods or services beyond the local area (e.g., manufacturing, software, tourism)." }
//       ]
//   }
// ]
// `;
// }

/**
 * Generates an LLM prompt for topic modeling of a set of comments.
 *
 * @param parentTopics - Optional. An array of top-level topics to use.
 * @param theme - Optional theme string to include in the prompt.
 * @param factor - Optional factor string to include in the prompt.
 * @returns The generated prompt string.
 */
export function generateTopicModelingPrompt(
  parentTopic?: Topic,
  otherTopics?: Topic[],
  theme?: string,
  factor?: string,
  prompt_learn_factor?: string,
  prompt_learn_metrics?: string
): string {
  if (theme) {
    return learnOneLevelOfTopicsPrompt({ name: theme }, otherTopics, prompt_learn_factor);
  } else if (factor) {
    return learnOneLevelOfTopicsPrompt({ name: factor }, otherTopics, prompt_learn_metrics);
  } else {
    return LEARN_TOPICS_PROMPT;
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
export function learnOneLevelOfTopics(
  comments: Comment[],
  model: Model,
  topic?: Topic,
  otherTopics?: Topic[],
  additionalContext?: string,
  theme?: string,
  factor?: string,
  prompt_learn_factor?: string,
  prompt_learn_metrics?: string
): Promise<Topic[]> {
  const instructions = generateTopicModelingPrompt(
    topic,
    otherTopics,
    theme,
    factor,
    prompt_learn_factor,
    prompt_learn_metrics
  );
  const schema = theme || factor ? Type.Array(NestedTopic) : Type.Array(FlatTopic);

  return retryCall(
    async function (model: Model): Promise<Topic[]> {
      console.log(`Identifying topics for ${comments.length} statements`);
      const finalPrompt = getPrompt(
        instructions,
        comments.map((comment) => comment.text),
        additionalContext
      );
      console.log("Final prompt sent to LLM:", finalPrompt);
      const llmOutput = await model.generateData(finalPrompt, schema);
      console.log(
        "LLM output (topics/metrics/factors) returned:",
        JSON.stringify(llmOutput, null, 2)
      );
      return llmOutput as Topic[];
    },
    function (response: Topic[]): boolean {
      return learnedTopicsValid(response, topic);
    },
    MAX_RETRIES,
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
export function learnedTopicsValid(response: Topic[], parentTopic?: Topic): boolean {
  const topicNames = response.map((topic) => topic.name);

  // 1. If a parentTopic is provided, ensure no other top-level topics exist except "Other".
  if (parentTopic) {
    const allowedTopicNames = [parentTopic]
      .map((topic: Topic) => topic.name.toLowerCase())
      .concat("other");
    if (!topicNames.every((name) => allowedTopicNames.includes(name.toLowerCase()))) {
      topicNames.forEach((topicName: string) => {
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
