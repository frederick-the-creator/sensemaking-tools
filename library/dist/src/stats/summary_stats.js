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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryStats = void 0;
const sensemaker_utils_1 = require("../sensemaker_utils");
const types_1 = require("../types");
const stats_util_1 = require("./stats_util");
function get75thPercentile(arr) {
  const sortedArr = [...arr].sort((a, b) => a - b);
  const index = (sortedArr.length - 1) * 0.75;
  if (Math.floor(index) === index) {
    return sortedArr[index];
  }
  const lowerIndex = Math.floor(index);
  const upperIndex = lowerIndex + 1;
  return (sortedArr[lowerIndex] + sortedArr[upperIndex]) / 2;
}
// Base class for statistical basis for summaries
/**
 * This class is the input interface for the RecursiveSummary abstraction, and
 * therefore the vessel through which all data is ultimately communicated to
 * the individual summarization routines.
 */
class SummaryStats {
  constructor(comments) {
    this.minCommonGroundProb = 0.6;
    this.minAgreeProbDifference = 0.3;
    // Must be above this threshold to be considered an uncertain comment. This can be overriden in
    // the constructor if the particular conversation has relatively high passes.
    this.minUncertaintyProb = 0.2;
    this.asProbabilityEstimate = false;
    this.maxSampleSize = 12;
    this.minVoteCount = 20;
    // Whether group data is used as part of the summary.
    this.groupBasedSummarization = true;
    this.comments = comments;
    this.filteredComments = comments.filter(types_1.isCommentWithVoteInfoType).filter((comment) => {
      return (0, stats_util_1.getCommentVoteCount)(comment, true) >= this.minVoteCount;
    });
    const topQuartilePassRate = get75thPercentile(
      this.filteredComments.map((comment) =>
        (0, stats_util_1.getTotalPassRate)(comment.voteInfo, this.asProbabilityEstimate)
      )
    );
    // Uncertain comments must have at least a certain minimum pass rate.
    this.minUncertaintyProb = Math.max(topQuartilePassRate, this.minUncertaintyProb);
  }
  /**
   * A static factory method that creates a new instance of SummaryStats
   * or a subclass. This is meant to be overriden by subclasses.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static create(comments) {
    throw new Error("Cannot instantiate abstract class SummaryStats");
  }
  // The total number of votes across the entire set of input comments
  get voteCount() {
    return this.comments.reduce((sum, comment) => {
      return sum + (0, stats_util_1.getCommentVoteCount)(comment, true);
    }, 0);
  }
  // The total number of comments in the set of input comments
  get commentCount() {
    return this.comments.length;
  }
  get containsSubtopics() {
    for (const comment of this.comments) {
      if (comment.topics) {
        for (const topic of comment.topics) {
          // Check if the topic matches the 'NestedTopic' type
          if ("subtopics" in topic && Array.isArray(topic.subtopics)) {
            return true;
          }
        }
      }
    }
    return false;
  }
  /**
   * Returns the top k comments according to the given metric.
   */
  topK(sortBy, k = this.maxSampleSize, filterFn = () => true) {
    return this.comments
      .filter(filterFn)
      .sort((a, b) => sortBy(b) - sortBy(a))
      .slice(0, k);
  }
  /**
   * Sorts topics and their subtopics based on comment count, with
   * "Other" topics and subtopics going last in sortByDescendingCount order.
   * @param topicStats what to sort
   * @param sortByDescendingCount whether to sort by comment count sortByDescendingCount or ascending
   * @returns the topics and subtopics sorted by comment count
   */
  sortTopicStats(topicStats, sortByDescendingCount = true) {
    topicStats.sort((a, b) => {
      if (a.name === "Other") return sortByDescendingCount ? 1 : -1;
      if (b.name === "Other") return sortByDescendingCount ? -1 : 1;
      return sortByDescendingCount
        ? b.commentCount - a.commentCount
        : a.commentCount - b.commentCount;
    });
    topicStats.forEach((topic) => {
      if (topic.subtopicStats) {
        topic.subtopicStats.sort((a, b) => {
          if (a.name === "Other") return sortByDescendingCount ? 1 : -1;
          if (b.name === "Other") return sortByDescendingCount ? -1 : 1;
          return sortByDescendingCount
            ? b.commentCount - a.commentCount
            : a.commentCount - b.commentCount;
        });
      }
    });
    return topicStats;
  }
  /**
   * Gets a sorted list of stats for each topic and subtopic.
   *
   * @returns A list of TopicStats objects sorted by comment count with "Other" topics last.
   */
  getStatsByTopic() {
    const commentsByTopic = (0, sensemaker_utils_1.groupCommentsBySubtopic)(this.comments);
    const topicStats = [];
    for (const topicName in commentsByTopic) {
      const subtopics = commentsByTopic[topicName];
      const subtopicStats = [];
      const topicComments = new Set();
      for (const subtopicName in subtopics) {
        // get corresonding comments, and update counts
        const comments = new Set(Object.values(subtopics[subtopicName]));
        const commentCount = comments.size;
        // aggregate comment objects
        comments.forEach((comment) => topicComments.add(comment));
        subtopicStats.push({
          name: subtopicName,
          commentCount,
          summaryStats: this.constructor.create([...comments]),
        });
      }
      topicStats.push({
        name: topicName,
        commentCount: topicComments.size,
        subtopicStats: subtopicStats,
        summaryStats: this.constructor.create([...topicComments]),
      });
    }
    return this.sortTopicStats(topicStats);
  }
}
exports.SummaryStats = SummaryStats;
