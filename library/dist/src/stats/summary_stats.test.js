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
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const summary_stats_1 = require("./summary_stats");
class TestSummaryStats extends summary_stats_1.SummaryStats {
  static create(comments) {
    return new TestSummaryStats(comments);
  }
  getCommonGroundComments(k) {
    return this.comments.slice(0, k);
  }
  getCommonGroundScore() {
    return 1;
  }
  getCommonGroundAgreeComments(k) {
    return this.comments.slice(0, k);
  }
  getCommonGroundDisagreeComments(k) {
    return this.comments.slice(0, k);
  }
  getDifferenceOfOpinionScore() {
    return 1;
  }
  getUncertainComments(k) {
    return this.comments.slice(0, k);
  }
  getUncertainScore() {
    return 1;
  }
  getCommonGroundNoCommentsMessage() {
    return "There are no common ground comments.";
  }
  getDifferenceOfOpinionComments(k) {
    return this.comments.slice(0, k);
  }
  getDifferencesOfOpinionNoCommentsMessage() {
    return "There are no difference of opinion comments.";
  }
}
describe("Summary Stats methods", () => {
  it("should have a minimum uncertainty thresholds of 0.2", () => {
    // Test comments have no uncertain comments.
    const summaryStats = new TestSummaryStats([
      { id: "1", text: "test", voteInfo: new types_1.VoteTally(100, 0, 0) },
      { id: "2", text: "test", voteInfo: new types_1.VoteTally(100, 0, 0) },
    ]);
    expect(summaryStats.minUncertaintyProb).toEqual(0.2);
  });
  it("should have an uncertainty threshold based on the data", () => {
    const summaryStats = new TestSummaryStats([
      { id: "1", text: "test", voteInfo: new types_1.VoteTally(90, 0, 10) },
      { id: "2", text: "test", voteInfo: new types_1.VoteTally(80, 0, 20) },
      { id: "3", text: "test", voteInfo: new types_1.VoteTally(70, 0, 30) },
      { id: "4", text: "test", voteInfo: new types_1.VoteTally(60, 0, 40) },
      { id: "4", text: "test", voteInfo: new types_1.VoteTally(60, 0, 50) },
    ]);
    // The 75th percentile pass rate should be the 4th entry at 40%.
    expect(summaryStats.minUncertaintyProb).toEqual(0.4);
  });
  it("should get stats by topic", () => {
    const comment = {
      text: "More clinicians/support providers.",
      id: "7610",
      voteTalliesByGroup: {
        "Group-1": new types_1.VoteTally(2, 0, 6),
      },
      topics: [
        {
          name: "Healthcare",
          subtopics: [{ name: "Childcare and Family Support" }, { name: "Senior Care" }],
        },
      ],
    };
    const summaryStats = new TestSummaryStats([comment]);
    const actual = summaryStats.getStatsByTopic();
    expect(actual.length).toEqual(1);
    expect(actual[0]).toEqual({
      name: "Healthcare",
      commentCount: 1,
      subtopicStats: [
        {
          name: "Childcare and Family Support",
          commentCount: 1,
          summaryStats: expect.any(TestSummaryStats),
        },
        {
          name: "Senior Care",
          commentCount: 1,
          summaryStats: expect.any(TestSummaryStats),
        },
      ],
      summaryStats: expect.any(TestSummaryStats),
    });
  });
});
