"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const group_informed_1 = require("../stats/group_informed");
const summarization_1 = require("./summarization");
describe("SummaryTest", () => {
  it("should quantify topic names", () => {
    const topicStats = [
      {
        name: "Topic A",
        commentCount: 5,
        summaryStats: new group_informed_1.GroupedSummaryStats([{ id: "1", text: "comment1" }]),
        subtopicStats: [
          {
            name: "Subtopic A.1",
            commentCount: 2,
            summaryStats: new group_informed_1.GroupedSummaryStats([{ id: "1", text: "comment1" }]),
          },
          {
            name: "Subtopic A.2",
            commentCount: 3,
            summaryStats: new group_informed_1.GroupedSummaryStats([{ id: "2", text: "comment2" }]),
          },
        ],
      },
    ];
    const expectedQuantified = {
      "Topic A (5 comments)": ["Subtopic A.1 (2 comments)", "Subtopic A.2 (3 comments)"],
    };
    expect((0, summarization_1._quantifyTopicNames)(topicStats)).toEqual(expectedQuantified);
  });
});
