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
// import fs from "fs";
// import path from "path";

/**
 * @fileoverview Helper functions for performing topic modeling on sets of comments.
 */

export const LEARN_TOPICS_PROMPT = `
Analyze the following comments and identify common topics.
Consider the granularity of topics: too few topics may oversimplify the content and miss important nuances, while too many topics may lead to redundancy and make the overall structure less clear.
Aim for a balanced number of topics that effectively summarizes the key themes without excessive detail.
After analysis of the comments, determine the optimal number of topics to represent the content effectively.
Justify why having fewer topics would be less optimal (potentially oversimplifying and missing key nuances), and why having more topics would also be less optimal (potentially leading to redundancy and a less clear overall structure).
After determining the optimal number of topics, identify those topics.
`;

export function learnOneLevelOfTopicsPrompt(
  parentTopic: Topic,
  otherTopics?: Topic[],
  prompt_learn_factors?: string,
  prompt_learn_metrics?: string,
  prompt_learn_themes?: string
): string {
  const otherTopicNames = otherTopics?.map((topic) => topic.name).join(", ") ?? "";

  if (prompt_learn_factors) {
    prompt_learn_factors = prompt_learn_factors
      .replace(/{{parentTopicName}}/g, parentTopic.name)
      .replace(/{{otherTopicNames}}/g, otherTopicNames);
    return prompt_learn_factors;
  } else if (prompt_learn_metrics) {
    prompt_learn_metrics = prompt_learn_metrics
      .replace(/{{parentTopicName}}/g, parentTopic.name)
      .replace(/{{otherTopicNames}}/g, otherTopicNames);
    // console.log("prompt_learn_metrics", prompt_learn_metrics);
    return prompt_learn_metrics;
  } else if (prompt_learn_themes) {
    prompt_learn_themes = prompt_learn_themes;
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
export function generateTopicModelingPrompt(
  parentTopic?: Topic,
  otherTopics?: Topic[],
  theme?: string,
  factor?: string,
  prompt_learn_factors?: string,
  prompt_learn_metrics?: string,
  prompt_learn_themes?: string
): string {
  if (theme) {
    return learnOneLevelOfTopicsPrompt({ name: theme }, otherTopics, prompt_learn_factors);
  } else if (factor) {
    return learnOneLevelOfTopicsPrompt({ name: factor }, otherTopics, prompt_learn_metrics);
  } else if (prompt_learn_themes) {
    return learnOneLevelOfTopicsPrompt({ name: "NA" }, otherTopics, prompt_learn_themes);
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
  prompt_learn_factors?: string,
  prompt_learn_metrics?: string,
  prompt_learn_themes?: string
): Promise<Topic[]> {
  const instructions = generateTopicModelingPrompt(
    topic,
    otherTopics,
    theme,
    factor,
    prompt_learn_factors,
    prompt_learn_metrics,
    prompt_learn_themes
  );
  const schema = theme || factor ? Type.Array(NestedTopic) : Type.Array(FlatTopic);

  return retryCall(
    async function (model: Model): Promise<Topic[]> {
      // console.log(
      //   `Sensemaker topic_modeling.ts - Identifying topics for ${comments.length} statements`
      // );

      // if (prompt_learn_factors) {
      //   console.log("Sensemaker topic_modelling.ts - Learn factors prompt is being used");
      // } else if (prompt_learn_metrics) {
      //   console.log("Sensemaker topic_modelling.ts - Learn metrics prompt is being used");
      // } else {
      //   console.log("Sensemaker topic_modelling.ts - No prompt is being used");
      // }

      const finalPrompt = getPrompt(
        instructions,
        comments.map((comment) => comment.text),
        additionalContext
      );

      if (prompt_learn_metrics) {
        // console.log('METRIC BEING GENERATED')
      }

      const llmOutput = await model.generateData(finalPrompt, schema);

      // Persist run data for inspection
      // try {
      //   // When running from dist, write to apps/backend/evals/runs/topic_modelling_runs
      //   // __dirname is expected to be .../apps/backend/sensemaking-tools/library/dist/src/tasks
      //   const runsDir = path.join(
      //     __dirname,
      //     "../../../../../evals/runs/topic_modelling_runs_overwrite"
      //   );
      //   fs.mkdirSync(runsDir, { recursive: true });

      //   // Determine next numeric file id
      //   const files = fs.readdirSync(runsDir);
      //   const numericIds = files
      //     .map((name) => (name.match(/^(\d+)\.json$/)?.[1] ? Number(RegExp.$1) : null))
      //     .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
      //   const nextId = (numericIds.length ? Math.max(...numericIds) : 0) + 1;
      //   const outPath = path.join(runsDir, `${nextId}.json`);

      //   const fileContent = [
      //     {
      //       prompt: [
      //         {
      //           task: "These comments are related to a socio-economic factor and need to be categorized into metrics. Metrics are concrete data points or statistics that you can measure to see the change in that factor. A factor may be tracked by a suite of complementary metrics, each highlighting a distinct facet of the factor. Analyze the following comments and identify relevant metrics within the following factor",
      //           factor: factor,
      //           comments: comments.map((c) => c.text),
      //         },
      //       ],
      //       response: llmOutput,
      //     },
      //   ];

      //   fs.writeFileSync(outPath, JSON.stringify(fileContent, null, 2), "utf-8");
      // } catch (e) {
      //   // Best-effort; do not interrupt the main flow
      //   console.warn("Failed to write topic_modelling_runs file:", e);
      // }
      // console.log('llmOutput:')
      // console.dir(llmOutput, {depth:null})
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
