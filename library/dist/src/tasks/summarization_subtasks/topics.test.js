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
const vertex_model_1 = require("../../models/vertex_model");
const group_informed_1 = require("../../stats/group_informed");
const types_1 = require("../../types");
const topics_1 = require("./topics");
// Mock the model response. This mock needs to be set up to return response specific for each test.
let mockThemesSummary;
let mockCommonGroundSummary;
let mockDifferencesSummary;
let mockGenerateText;
const TEST_COMMENTS = [
  {
    id: "1",
    text: "comment 1",
    voteInfo: {
      0: new types_1.VoteTally(10, 5, 0),
      1: new types_1.VoteTally(5, 10, 5),
    },
    topics: [{ name: "Topic A", subtopics: [{ name: "Subtopic A.1" }] }],
  },
  {
    id: "2",
    text: "comment 2",
    voteInfo: {
      0: new types_1.VoteTally(10, 5, 0),
      1: new types_1.VoteTally(5, 10, 5),
    },
    topics: [{ name: "Topic A", subtopics: [{ name: "Subtopic A.1" }] }],
  },
  {
    id: "3",
    text: "comment 3",
    voteInfo: {
      0: new types_1.VoteTally(10, 5, 0),
      1: new types_1.VoteTally(5, 10, 5),
    },
    topics: [{ name: "Topic A", subtopics: [{ name: "Subtopic A.2" }] }],
  },
  {
    id: "4",
    text: "comment 4",
    voteInfo: {
      0: new types_1.VoteTally(10, 5, 0),
      1: new types_1.VoteTally(5, 10, 5),
    },
    topics: [{ name: "Topic B", subtopics: [{ name: "Subtopic B.1" }] }],
  },
  {
    id: "5",
    text: "comment 5",
    voteInfo: {
      0: new types_1.VoteTally(10, 5, 0),
      1: new types_1.VoteTally(5, 10, 5),
    },
    topics: [{ name: "Topic B", subtopics: [{ name: "Subtopic B.1" }] }],
  },
];
describe("AllTopicsSummaryTest", () => {
  beforeEach(() => {
    mockThemesSummary = jest.spyOn(topics_1.TopicSummary.prototype, "getThemesSummary");
    mockCommonGroundSummary = jest.spyOn(topics_1.TopicSummary.prototype, "getCommonGroundSummary");
    mockDifferencesSummary = jest.spyOn(
      topics_1.TopicSummary.prototype,
      "getDifferencesOfOpinionSummary"
    );
    mockGenerateText = jest
      .spyOn(vertex_model_1.VertexModel.prototype, "generateText")
      .mockResolvedValue("A recursive summary...");
  });
  afterEach(() => {
    mockThemesSummary.mockRestore();
    mockCommonGroundSummary.mockRestore();
    mockDifferencesSummary.mockRestore();
    mockGenerateText.mockRestore();
  });
  it("should create a properly formatted topics summary", () =>
    __awaiter(void 0, void 0, void 0, function* () {
      // Mock the LLM calls
      mockThemesSummary.mockReturnValue(
        Promise.resolve({
          text: "Themes were...",
        })
      );
      mockCommonGroundSummary.mockReturnValue(
        Promise.resolve({
          text: "Some points of common ground...",
          title: "Common ground between groups: ",
        })
      );
      mockDifferencesSummary.mockReturnValue(
        Promise.resolve({
          text: "Areas of disagreement between groups...",
          title: "Differences of opinion: ",
        })
      );
      expect(
        yield new topics_1.AllTopicsSummary(
          new group_informed_1.GroupedSummaryStats(TEST_COMMENTS),
          new vertex_model_1.VertexModel("project123", "usa")
        ).getSummary()
      ).toEqual({
        title: "## Topics",
        text: "From the statements submitted, 2 high level topics were identified, as well as 3 subtopics. Based on voting patterns between the opinion groups described above, both points of common ground as well as differences of opinion between the groups have been identified and are described below.\n",
        subContents: [
          {
            title: "### Topic A (3 statements)",
            text: "This topic included 1 subtopic, comprising a total of 3 statements.",
            subContents: [
              {
                text: "A recursive summary...",
                type: "TopicSummary",
              },
              {
                text: "This subtopic had high alignment compared to the other subtopics.",
                title: "#### Subtopic A.1 (2 statements)",
                subContents: [
                  {
                    text: "Themes were...",
                  },
                  {
                    text: "Some points of common ground...",
                    title: "Common ground between groups: ",
                  },
                  {
                    text: "Areas of disagreement between groups...",
                    title: "Differences of opinion: ",
                  },
                ],
              },
            ],
          },
          {
            title: "### Topic B (2 statements)",
            text: "This topic included 1 subtopic, comprising a total of 2 statements.",
            subContents: [
              {
                text: "A recursive summary...",
                type: "TopicSummary",
              },
              {
                text: "This subtopic had high alignment compared to the other subtopics.",
                title: "#### Subtopic B.1 (2 statements)",
                subContents: [
                  {
                    text: "Themes were...",
                  },
                  {
                    text: "Some points of common ground...",
                    title: "Common ground between groups: ",
                  },
                  {
                    text: "Areas of disagreement between groups...",
                    title: "Differences of opinion: ",
                  },
                ],
              },
            ],
          },
        ],
      });
    }));
});
