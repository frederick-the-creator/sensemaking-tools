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

import { Sensemaker } from "./sensemaker";
import { Comment } from "./types";
import { VertexModel } from "./models/vertex_model";
import { ModelSettings } from "./models/model";

// mock retry timeout
jest.mock("./models/model_util", () => {
  const originalModule = jest.requireActual("./models/model_util");
  return {
    __esModule: true,
    ...originalModule,
    RETRY_DELAY_MS: 0,
  };
});

const TEST_MODEL_SETTINGS: ModelSettings = {
  defaultModel: new VertexModel("project", "location", "Gemma1234"),
};
// Mock the model response. This mock needs to be set up to return response specific for each test.
let mockGenerateData: jest.SpyInstance;

describe("SensemakerTest", () => {
  beforeEach(() => {
    mockGenerateData = jest.spyOn(VertexModel.prototype, "generateData");
  });

  afterEach(() => {
    mockGenerateData.mockRestore();
  });

  describe("CategorizeTest", () => {
    it("should batch comments correctly", async () => {
      const comments: Comment[] = [
        { id: "1", text: "Comment 1" },
        { id: "2", text: "Comment 2" },
      ];
      const topics = [{ name: "Topic 1" }];
      const includeSubtopics = false;
      mockGenerateData
        .mockReturnValueOnce(
          Promise.resolve([
            {
              id: "1",
              topics: [{ name: "Topic 1" }],
            },
          ])
        )
        .mockReturnValueOnce(
          Promise.resolve([
            {
              id: "2",
              topics: [{ name: "Topic 1" }],
            },
          ])
        );

      const actualComments = await new Sensemaker(TEST_MODEL_SETTINGS).categorizeComments(
        comments,
        includeSubtopics,
        topics,
        undefined
      );

      expect(mockGenerateData).toHaveBeenCalledTimes(2);

      // Assert that the categorized comments are correct
      const expected = [
        {
          id: "1",
          text: "Comment 1",
          topics: [{ name: "Topic 1" }],
        },
        {
          id: "2",
          text: "Comment 2",
          topics: [{ name: "Topic 1" }],
        },
      ];
      expect(actualComments).toEqual(expected);
    });
  });

  describe("TopicModelingTest", () => {
    it.skip("should retry topic modeling when the subtopic is the same as a main topic", async () => {
      const comments: Comment[] = [
        { id: "1", text: "Comment about Roads" },
        { id: "2", text: "Another comment about Roads" },
      ];
      const includeSubtopics = true;

      const validResponse = [
        {
          name: "Infrastructure",
          subtopics: [{ name: "Roads" }],
        },
      ];

      // Mock LLM call incorrectly returns a subtopic that matches and existing
      // topic at first, and then on retry returns a correct categorization.
      mockGenerateData
        .mockReturnValueOnce(
          Promise.resolve([
            {
              name: "Infrastructure",
            },
          ])
        )
        .mockReturnValueOnce(
          Promise.resolve([
            { id: "1", text: "Comment about Roads", topics: [{ name: "Infrastructure" }] },
            { id: "2", text: "Another comment about Roads", topics: [{ name: "Infrastructure" }] },
          ])
        )
        .mockReturnValueOnce(
          Promise.resolve([
            {
              name: "Infrastructure",
              subtopics: [{ name: "Roads" }, { name: "Infrastructure" }],
            },
          ])
        )
        .mockReturnValueOnce(
          Promise.resolve([
            {
              name: "Infrastructure",
              subtopics: [{ name: "Roads" }],
            },
          ])
        )
        .mockReturnValueOnce(
          Promise.resolve([
            {
              id: "1",
              text: "Comment about Roads",
              topics: [{ name: "Roads" }],
            },
            {
              id: "2",
              text: "Another comment about Roads",
              topics: [{ name: "Roads" }],
            },
          ])
        );

      const commentRecords = await new Sensemaker(TEST_MODEL_SETTINGS).learnTopics(
        comments,
        includeSubtopics,
        undefined
      );

      expect(mockGenerateData).toHaveBeenCalledTimes(5);
      expect(commentRecords).toEqual(validResponse);
    });

    it.skip("should retry topic modeling when a new topic is added", async () => {
      const comments: Comment[] = [
        { id: "1", text: "Comment about Roads" },
        { id: "2", text: "Another comment about Roads" },
      ];
      const includeSubtopics = true;
      const topics = [{ name: "Infrastructure" }];

      const validResponse = [
        {
          name: "Infrastructure",
          subtopics: [{ name: "Roads" }],
        },
      ];

      // Mock LLM call returns an incorrectly added new topic at first, and then
      // is correct on retry.
      mockGenerateData
        .mockReturnValueOnce(
          Promise.resolve([
            { id: "1", text: "Comment about Roads", topics: [{ name: "Infrastructure" }] },
            { id: "2", text: "Another comment about Roads", topics: [{ name: "Infrastructure" }] },
          ])
        )
        .mockReturnValueOnce(
          Promise.resolve([
            {
              name: "Infrastructure",
              subtopics: [{ name: "Roads" }],
            },
            {
              name: "Environment",
              subtopics: [{ name: "Parks" }],
            },
          ])
        )
        .mockReturnValueOnce(
          Promise.resolve([
            {
              name: "Infrastructure",
              subtopics: [{ name: "Roads" }],
            },
          ])
        )
        .mockReturnValueOnce(
          Promise.resolve([
            {
              id: "1",
              text: "Comment about Roads",
              topics: [{ name: "Roads" }],
            },
            {
              id: "2",
              text: "Another comment about Roads",
              topics: [{ name: "Roads" }],
            },
          ])
        );

      const commentRecords = await new Sensemaker(TEST_MODEL_SETTINGS).learnTopics(
        comments,
        includeSubtopics,
        topics
      );

      expect(mockGenerateData).toHaveBeenCalledTimes(4);
      expect(commentRecords).toEqual(validResponse);
    });
  });
});
