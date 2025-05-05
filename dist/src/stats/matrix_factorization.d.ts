export interface Rating {
    userId: number;
    noteId: number;
    rating: number;
}
/**
 * Given ratings, return helpfulness scores and other model parameters for the given set of ratings.
 * @param ratings A collection of Rating values
 * @param numFactors The factor dimensionality
 * @param epochs Number of training iterations to run per learningRate
 * @param learningRate Either a single learning rate value, or an array of values for a learning rate schedule
 * @param lambdaI Intercept term regularization parameter
 * @param lambdaF Factor term regularization parameter
 * @returns Helpfulness scores
 */
export declare function communityNotesMatrixFactorization(ratings: Rating[], numFactors?: number, epochs?: number, learningRate?: number | number[], lambdaI?: number, lambdaF?: number): Promise<number[]>;
