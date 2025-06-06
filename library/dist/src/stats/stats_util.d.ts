import { Comment, CommentWithVoteInfo, VoteTally, VoteInfo } from "../types";
/**
 * Compute the probability of an agree vote for a given vote tally entry.
 * @param voteTally the votes to use for the calculation
 * @param includePasses whether to include passes in the total count
 * @param asProbabilityEstimate whether to as add +1 and +2 to the numerator and demonenator
 * respectively as a psuedo-count prior so that probabilities tend to 1/2 in the absence of data,
 * and to avoid division/multiplication by zero. This is technically a simple maxima a priori (MAP)
 * probability estimate.
 * @returns the actual or estimated agree probability
 */
export declare function getAgreeRate(voteTally: VoteTally, includePasses: boolean, asProbabilityEstimate?: boolean): number;
/**
 * Compute the probability of an pass vote for a given vote tally entry.
 * @param voteTally the votes to use for the calculation
 * @param asProbabilityEstimate whether to as add +1 and +2 to the numerator and demonenator
 * respectively as a psuedo-count prior so that probabilities tend to 1/2 in the absence of data,
 * and to avoid division/multiplication by zero. This is technically a simple maxima a priori (MAP)
 * probability estimate.
 * @returns the actual or estimated pass probability
 */
export declare function getPassRate(voteTally: VoteTally, asProbabilityEstimate?: boolean): number;
export declare function getStandardDeviation(numbers: number[]): number;
/**
 * Compute the probability of an agree vote for a given set of vote tallies.
 * @param voteInfo the votes to use for the calculation
 * @param includePasses whether to include passes in the total count
 * @param asProbabilityEstimate whether to as add +1 and +2 to the numerator and demonenator
 * respectively as a psuedo-count prior so that probabilities tend to 1/2 in the absence of data,
 * and to avoid division/multiplication by zero. This is technically a simple maxima a priori (MAP)
 * probability estimate.
 * @returns the actual or estimated agree probability
 */
export declare function getTotalAgreeRate(voteInfo: VoteInfo, includePasses: boolean, asProbabilityEstimate?: boolean): number;
/**
 * Compute the probability of an pass vote for a given set of vote tallies.
 * @param voteInfo the votes to use for the calculation
 * @param asProbabilityEstimate whether to as add +1 and +2 to the numerator and demonenator
 * respectively as a psuedo-count prior so that probabilities tend to 1/2 in the absence of data,
 * and to avoid division/multiplication by zero. This is technically a simple maxima a priori (MAP)
 * probability estimate.
 * @returns the actual or estimated pass probability
 */
export declare function getTotalPassRate(voteInfo: VoteInfo, asProbabilityEstimate?: boolean): number;
/**
 * Compute the probability of an disagree vote for a given set of vote tallies.
 * @param voteInfo the votes to use for the calculation
 * @param includePasses whether to include passes in the total count
 * @param asProbabilityEstimate whether to as add +1 and +2 to the numerator and demonenator
 * respectively as a psuedo-count prior so that probabilities tend to 1/2 in the absence of data,
 * and to avoid division/multiplication by zero. This is technically a simple maxima a priori (MAP)
 * probability estimate.
 * @returns the actual or estimated disagree probability
 */
export declare function getTotalDisagreeRate(voteInfo: VoteInfo, includePasses: boolean, asProbabilityEstimate?: boolean): number;
/**
 * Computes group informed (agree) consensus for a comment's vote tallies,
 * computed as the product of the aggree probabilities across groups.
 */
export declare function getGroupInformedConsensus(comment: CommentWithVoteInfo): number;
/**
 * A function which returns the minimum aggree probability across groups
 * @param comment the comment with vote tallies to get the agree probability for
 * @param asProbabilityEstimate whether to as add +1 and +2 to the numerator and demonenator
 * respectively as a psuedo-count prior so that probabilities tend to 1/2 in the absence of data,
 * and to avoid division/multiplication by zero. This is technically a simple maxima a priori (MAP)
 * probability estimate.
 * @returns the minimum agree probability across all groups
 */
export declare function getMinAgreeProb(comment: CommentWithVoteInfo, asProbabilityEstimate?: boolean): number;
/**
 * Compute the probability of an disagree vote for a given vote tally entry.
 * @param voteTally the votes to use for the calculation
 * @param includePasses whether to include passes in the total count
 * @param asProbabilityEstimate whether to as add +1 and +2 to the numerator and demonenator
 * respectively as a psuedo-count prior so that probabilities tend to 1/2 in the absence of data,
 * and to avoid division/multiplication by zero. This is technically a simple maxima a priori (MAP)
 * probability estimate.
 * @returns the actual or estimated disagree probability
 */
export declare function getDisagreeRate(voteTally: VoteTally, includePasses: boolean, asProbabilityEstimate?: boolean): number;
/**
 * Computes group informed (disagree) consensus for a comment's vote tallies
 * computed as the product of disaggree probabilities across groups.
 * @param asProbabilityEstimate whether to as add +1 and +2 to the numerator and demonenator
 * respectively as a psuedo-count prior so that probabilities tend to 1/2 in the absence of data,
 * and to avoid division/multiplication by zero. This is technically a simple maxima a priori (MAP)
 * probability estimate.
 */
export declare function getGroupInformedDisagreeConsensus(comment: CommentWithVoteInfo, asProbabilityEstimate?: boolean): number;
/**
 * A function which returns the minimum disagree probability across groups
 * @param comment the comment with associated votes to get the probability for
 * @param asProbabilityEstimate whether to as add +1 and +2 to the numerator and demonenator
 * respectively as a psuedo-count prior so that probabilities tend to 1/2 in the absence of data,
 * and to avoid division/multiplication by zero. This is technically a simple maxima a priori (MAP)
 * probability estimate.
 */
export declare function getMinDisagreeProb(comment: CommentWithVoteInfo, asProbabilityEstimate?: boolean): number;
/**
 * Computes the difference between the MAP probability estimate of agreeing within
 * a given group as compared with the rest of the conversation.
 * @param comment A comment with vote tally data, broken down by opinion group
 * @param asProbabilityEstimate whether to as add +1 and +2 to the numerator and demonenator
 * respectively as a psuedo-count prior so that probabilities tend to 1/2 in the absence of data,
 * and to avoid division/multiplication by zero. This is technically a simple maxima a priori (MAP)
 * probability estimate.
 * @returns the numeric difference in estimated agree probabilities
 */
export declare function getGroupAgreeProbDifference(comment: CommentWithVoteInfo, group: string, asProbabilityEstimate?: boolean): number;
/**
 * Computes the maximal absolute value of `getGroupAgreeProbDifference` across
 * opinion groups present in comment.groupVoteTallies.
 * @param comment A Comment with vote tally data, broken down by opinion group
 * @returns the maximal difference in estimated agree probabilities
 */
export declare function getMaxGroupAgreeProbDifference(comment: CommentWithVoteInfo): number;
/**
 * Computes the total vote count across opinion groups. Note that this
 * consequently doesn't include any votes for participants not represented
 * in the opinion groups.
 * @param comment A Comment with vote data
 * @param includePasses whether to include passes in the total count
 * @returns the total number of votes
 */
export declare function getCommentVoteCount(comment: Comment, includePasses: boolean): number;
