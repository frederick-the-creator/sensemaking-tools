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
exports.GroupedSummaryStats = void 0;
const sensemaker_utils_1 = require("../sensemaker_utils");
const types_1 = require("../types");
const stats_util_1 = require("./stats_util");
const summary_stats_1 = require("./summary_stats");
// Stats basis for summary that uses groups and group informed consensus based algorithms.
/**
 * This child class of the SummaryStats class provides the same abstract purpose
 * (that is, serving as the interface to the RecursiveSummary abstraction),
 * but is specifically tailored to group based summarization.
 */
class GroupedSummaryStats extends summary_stats_1.SummaryStats {
  constructor() {
    super(...arguments);
    // This outlier protection is needed since although we filter out comments with too few votes,
    // sometimes group sizes are skewed so one group will have very few votes.
    this.asProbabilityEstimate = true;
  }
  /**
   * An override of the SummaryStats static factory method,
   * to allow for GroupedSummaryStats specific initialization.
   */
  static create(comments) {
    return new GroupedSummaryStats(comments);
  }
  /**
   * Returns the top k comments according to the given metric.
   */
  topK(sortBy, k = this.maxSampleSize, filterFn = () => true) {
    return this.filteredComments
      .filter(filterFn)
      .sort((a, b) => sortBy(b) - sortBy(a))
      .slice(0, k);
  }
  /** Returns a score indicating how well a comment represents the common ground. */
  getCommonGroundScore(comment) {
    return Math.max(
      (0, stats_util_1.getGroupInformedDisagreeConsensus)(comment),
      this.getCommonGroundAgreeScore(comment)
    );
  }
  /**
   * Gets the topK agreed upon comments across all groups.
   *
   * This is measured via the getGroupInformedConsensus metric, subject to the constraints of
   * this.minVoteCount and this.minAgreeProbCommonGround settings.
   * @param k dfaults to this.maxSampleSize
   * @returns the top agreed on comments
   */
  getCommonGroundComments(k = this.maxSampleSize) {
    return this.topK(
      (comment) => this.getCommonGroundScore(comment),
      k,
      // Before getting the top agreed comments, enforce a minimum level of agreement
      (comment) =>
        this.meetsCommonGroundAgreeThreshold(comment) ||
        this.meetsCommonGroundDisagreeThreshold(comment)
    );
  }
  meetsCommonGroundAgreeThreshold(comment) {
    return (0, stats_util_1.getMinAgreeProb)(comment) >= this.minCommonGroundProb;
  }
  getCommonGroundAgreeScore(comment) {
    return (0, stats_util_1.getGroupInformedConsensus)(comment);
  }
  /**
   * Gets the topK agreed upon comments across all groups.
   *
   * This is measured via the getGroupInformedConsensus metric, subject to the constraints of
   * this.minVoteCount and this.minAgreeProbCommonGround settings.
   * @param k dfaults to this.maxSampleSize
   * @returns the top agreed on comments
   */
  getCommonGroundAgreeComments(k = this.maxSampleSize) {
    return this.topK(
      (comment) => this.getCommonGroundAgreeScore(comment),
      k,
      (comment) => this.meetsCommonGroundAgreeThreshold(comment)
    );
  }
  getCommonGroundNoCommentsMessage() {
    return (
      `No statements met the thresholds necessary to be considered as a point of common ` +
      `ground (at least ${this.minVoteCount} votes, and at least ` +
      `${(0, sensemaker_utils_1.decimalToPercent)(this.minCommonGroundProb)} agreement across groups).`
    );
  }
  /**
   * Gets the topK disagreed upon comments across all groups.
   *
   * This is measured via the getGroupInformedDisagreeConsensus metric, subject to the constraints of
   * this.minVoteCount and this.minAgreeProbCommonGround settings.
   * @param k dfaults to this.maxSampleSize
   * @returns the top disagreed on comments
   */
  getCommonGroundDisagreeComments(k = this.maxSampleSize) {
    return this.topK(
      (comment) => (0, stats_util_1.getGroupInformedDisagreeConsensus)(comment),
      k,
      // Before using Group Informed Consensus a minimum bar of agreement between groups is enforced
      (comment) => this.meetsCommonGroundDisagreeThreshold(comment)
    );
  }
  meetsCommonGroundDisagreeThreshold(comment) {
    return (0, stats_util_1.getMinDisagreeProb)(comment) >= this.minCommonGroundProb;
  }
  /**
   * Sort through the comments with the highest getGroupAgreeDifference for the corresponding group,
   * subject to this.minVoteCount, not matching the common ground comment set by this.minAgreeProbCommonGround,
   * and this.minAgreeProbDifference
   * @param group The name of a single group
   * @param k dfaults to this.maxSampleSize
   * @returns The corresponding set of comments
   */
  getGroupRepresentativeComments(group, k = this.maxSampleSize) {
    return this.topK(
      (comment) => (0, stats_util_1.getGroupAgreeProbDifference)(comment, group),
      k,
      (comment) =>
        (0, stats_util_1.getMinAgreeProb)(comment) < this.minCommonGroundProb &&
        (0, stats_util_1.getGroupAgreeProbDifference)(comment, group) > this.minAgreeProbDifference
    );
  }
  /** Returns a score indicating how well a comment represents a difference of opinions. */
  getDifferenceOfOpinionScore(comment) {
    return (0, stats_util_1.getMaxGroupAgreeProbDifference)(comment);
  }
  /**
   * Returns the top K comments that best distinguish differences of opinion between groups.
   *
   * This is computed as the difference in how likely each group is to agree with a given comment
   * as compared with the rest of the participant body, as computed by the getGroupAgreeDifference method,
   * and subject to this.minVoteCount, this.minAgreeProbCommonGround and this.minAgreeProbDifference.
   *
   * @param k the number of comments to find, this is a maximum and is not guaranteed
   * @returns the top disagreed on comments
   */
  getDifferenceOfOpinionComments(k = this.maxSampleSize) {
    return this.topK(
      // Get the maximum absolute group agree difference for any group.
      (comment) => this.getDifferenceOfOpinionScore(comment),
      k,
      (comment) =>
        // Some group must agree with the comment less than the minAgreeProbCommonGround
        // threshold, so that this comment doesn't also qualify as a common ground comment.
        (0, stats_util_1.getMinAgreeProb)(comment) < this.minCommonGroundProb &&
        // Some group must disagree with the rest by a margin larger than the
        // getGroupAgreeProbDifference.
        (0, stats_util_1.getMaxGroupAgreeProbDifference)(comment) < this.minAgreeProbDifference
    );
  }
  getDifferencesOfOpinionNoCommentsMessage() {
    return (
      `No statements met the thresholds necessary to be considered as a significant ` +
      `difference of opinion (at least ${this.minVoteCount} votes, and more than ` +
      `${(0, sensemaker_utils_1.decimalToPercent)(this.minAgreeProbDifference)} difference in agreement rate between groups).`
    );
  }
  /** Returns a score indicating how well a comment represents an uncertain viewpoint based on pass
   *  votes. This is not based on groups. */
  getUncertainScore(comment) {
    return (0, stats_util_1.getTotalPassRate)(comment.voteInfo, this.asProbabilityEstimate);
  }
  /**
   * Gets the topK uncertain comments based on pass votes.
   *
   * @param k the number of comments to get
   * @returns the top uncertain comments
   */
  getUncertainComments(k = this.maxSampleSize) {
    return this.topK(
      (comment) => this.getUncertainScore(comment),
      k,
      // Before getting the top comments, enforce a minimum level of uncertainty
      (comment) =>
        (0, stats_util_1.getTotalPassRate)(comment.voteInfo, this.asProbabilityEstimate) >
        this.minUncertaintyProb
    );
  }
  getStatsByGroup() {
    const groupNameToStats = {};
    for (const comment of this.comments) {
      // Check that the voteInfo contains group data and update the type.
      (0, types_1.isGroupVoteTalliesType)(comment.voteInfo);
      const voteInfo = comment.voteInfo;
      for (const groupName in voteInfo) {
        const commentVoteCount = voteInfo[groupName].getTotalCount(true);
        if (groupName in groupNameToStats) {
          groupNameToStats[groupName].voteCount += commentVoteCount;
        } else {
          groupNameToStats[groupName] = { name: groupName, voteCount: commentVoteCount };
        }
      }
    }
    return Object.values(groupNameToStats);
  }
}
exports.GroupedSummaryStats = GroupedSummaryStats;
