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
exports.MajoritySummaryStats = void 0;
const sensemaker_utils_1 = require("../sensemaker_utils");
const stats_util_1 = require("./stats_util");
const summary_stats_1 = require("./summary_stats");
// Stats basis for the summary that is based on majority vote algorithms. Does not use groups.
class MajoritySummaryStats extends summary_stats_1.SummaryStats {
    constructor() {
        super(...arguments);
        // Must be above this threshold to be considered high agreement.
        this.minCommonGroundProb = 0.7;
        // Agreement and Disagreement must be between these values to be difference of opinion.
        this.minDifferecenProb = 0.4;
        this.maxDifferenceProb = 0.6;
        this.groupBasedSummarization = false;
        // This outlier protection isn't needed since we already filter our comments without many votes.
        this.asProbabilityEstimate = false;
    }
    /**
     * An override of the SummaryStats static factory method,
     * to allow for MajoritySummaryStats specific initialization.
     */
    static create(comments) {
        return new MajoritySummaryStats(comments);
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
    /** Returns a score indicating how well a comment represents when everyone agrees. */
    getCommonGroundAgreeScore(comment) {
        return (0, stats_util_1.getTotalAgreeRate)(comment.voteInfo, this.asProbabilityEstimate);
    }
    /** Returns a score indicating how well a comment represents the common ground. */
    getCommonGroundScore(comment) {
        return Math.max(this.getCommonGroundAgreeScore(comment), (0, stats_util_1.getTotalDisagreeRate)(comment.voteInfo, this.asProbabilityEstimate));
    }
    meetsCommonGroundAgreeThreshold(comment) {
        return ((0, stats_util_1.getTotalAgreeRate)(comment.voteInfo, this.asProbabilityEstimate) >= this.minCommonGroundProb);
    }
    /**
     * Gets the topK agreed upon comments based on highest % of agree votes.
     *
     * @param k the number of comments to get
     * @returns the top agreed on comments
     */
    getCommonGroundAgreeComments(k = this.maxSampleSize) {
        return this.topK((comment) => this.getCommonGroundAgreeScore(comment), k, 
        // Before getting the top agreed comments, enforce a minimum level of agreement
        (comment) => this.meetsCommonGroundAgreeThreshold(comment));
    }
    /**
     * Gets the topK common ground comments where either everyone agrees or everyone disagrees.
     *
     * @param k the number of comments to get
     * @returns the top common ground comments
     */
    getCommonGroundComments(k = this.maxSampleSize) {
        return this.topK((comment) => this.getCommonGroundScore(comment), k, 
        // Before getting the top agreed comments, enforce a minimum level of agreement
        (comment) => this.meetsCommonGroundAgreeThreshold(comment) ||
            this.meetsCommonGroundDisagreeThreshold(comment));
    }
    getCommonGroundNoCommentsMessage() {
        return (`No statements met the thresholds necessary to be considered as a point of common ` +
            `ground (at least ${this.minVoteCount} votes, and at least ` +
            `${(0, sensemaker_utils_1.decimalToPercent)(this.minCommonGroundProb)} agreement).`);
    }
    /** Returns a score indicating how well a comment represents an uncertain viewpoint based on pass
     *  votes */
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
        return this.topK((comment) => this.getUncertainScore(comment), k, 
        // Before getting the top comments, enforce a minimum level of uncertainty
        (comment) => (0, stats_util_1.getTotalPassRate)(comment.voteInfo, this.asProbabilityEstimate) > this.minUncertaintyProb);
    }
    meetsCommonGroundDisagreeThreshold(comment) {
        return ((0, stats_util_1.getTotalDisagreeRate)(comment.voteInfo, this.asProbabilityEstimate) >= this.minCommonGroundProb);
    }
    /**
     * Gets the topK disagreed upon comments across.
     *
     * @param k dfaults to this.maxSampleSize
     * @returns the top disagreed on comments
     */
    getCommonGroundDisagreeComments(k = this.maxSampleSize) {
        return this.topK((comment) => (0, stats_util_1.getTotalDisagreeRate)(comment.voteInfo, this.asProbabilityEstimate), k, 
        // Before using Group Informed Consensus a minimum bar of agreement between groups is enforced
        (comment) => this.meetsCommonGroundDisagreeThreshold(comment));
    }
    /** Returns a score indicating how well a comment represents a difference of opinions. This
     * score prioritizes comments where the agreement rate and disagreement rate are
     * both high, and the pass rate is low.*/
    getDifferenceOfOpinionScore(comment) {
        return (1 -
            Math.abs((0, stats_util_1.getTotalAgreeRate)(comment.voteInfo, this.asProbabilityEstimate) -
                (0, stats_util_1.getTotalDisagreeRate)(comment.voteInfo, this.asProbabilityEstimate)) -
            (0, stats_util_1.getTotalPassRate)(comment.voteInfo, this.asProbabilityEstimate));
    }
    /**
     * Gets the topK agreed upon comments based on highest % of agree votes.
     *
     * @param k the number of comments to get
     * @returns the top differences of opinion comments
     */
    getDifferenceOfOpinionComments(k = this.maxSampleSize) {
        return this.topK(
        // Rank comments with the same agree and disagree rates the most highly and prefer when these
        // values are higher. So the best score would be when both the agree rate and the disagree
        // rate are 0.5.
        (comment) => this.getDifferenceOfOpinionScore(comment), k, 
        // Before getting the top differences comments, enforce a minimum level of difference of
        // opinion.
        (comment) => (0, stats_util_1.getTotalAgreeRate)(comment.voteInfo, this.asProbabilityEstimate) >= this.minDifferecenProb &&
            (0, stats_util_1.getTotalAgreeRate)(comment.voteInfo, this.asProbabilityEstimate) <= this.maxDifferenceProb &&
            (0, stats_util_1.getTotalDisagreeRate)(comment.voteInfo, this.asProbabilityEstimate) <=
                this.minDifferecenProb &&
            (0, stats_util_1.getTotalDisagreeRate)(comment.voteInfo, this.asProbabilityEstimate) <= this.maxDifferenceProb);
    }
    getDifferencesOfOpinionNoCommentsMessage() {
        const minThreshold = (0, sensemaker_utils_1.decimalToPercent)(this.minDifferecenProb);
        const maxThreshold = (0, sensemaker_utils_1.decimalToPercent)(this.maxDifferenceProb);
        return (`No statements met the thresholds necessary to be considered as a significant ` +
            `difference of opinion (at least ${this.minVoteCount} votes, and both an agreement rate ` +
            `and disagree rate between ${minThreshold}% and ${maxThreshold}%).`);
    }
}
exports.MajoritySummaryStats = MajoritySummaryStats;
