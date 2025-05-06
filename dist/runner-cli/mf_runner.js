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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// Runs the matrix factorization code in src/stats_utils/matrix_factorization.ts for an input dataset,
// and appends the helpfulness scores to the output data.
// Run like:
// npx ts-node ./evaluations/mf_runner.ts --outputFile "data1.csv" \
// --vertexProject "<your project name here>" \
// --inputFile "comments-with-vote-tallies.csv"
const commander_1 = require("commander");
const csv_writer_1 = require("csv-writer");
const matrix_factorization_1 = require("../src/stats/matrix_factorization");
const fs = __importStar(require("fs"));
const csv = __importStar(require("csv-parse"));
function getVotesFromCsv(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const votes = [];
            fs.createReadStream(filename)
                .pipe(csv.parse({ columns: true }))
                .on("data", (row) => {
                votes.push(Object.assign(Object.assign({}, row), { vote: parseInt(row.vote) }));
            })
                .on("end", () => {
                resolve(votes);
            })
                .on("error", (error) => {
                reject(error);
            });
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Parse command line arguments.
        const program = new commander_1.Command();
        program
            .option("-o, --outputFile <file>", "The output file name.")
            .option("-g, --votesFile <file>", "The votes file name.")
            .option("-e, --epochs <epochs>", "The number of epochs to train for.", (value) => parseInt(value, 10), 400)
            .option("-l, --learningRate <learningRate>", "The learning rate for training routine.", parseFloats, [0.05, 0.01, 0.002, 0.0004]);
        program.parse(process.argv);
        const options = program.opts();
        const votes = yield getVotesFromCsv(options.votesFile);
        // Sort and map user IDs to sequential indices
        const sortedUserIds = Array.from(new Set(votes.map((vote) => vote["voter-id"]))).sort((a, b) => parseInt(a) - parseInt(b));
        const userIdMap = {};
        sortedUserIds.forEach((userId, index) => {
            userIdMap[userId] = index;
        });
        console.log("sortedUserIds:", sortedUserIds);
        // Sort and map comment IDs to sequential indices
        const sortedCommentIds = Array.from(new Set(votes.map((vote) => vote["comment-id"]))).sort((a, b) => parseInt(a) - parseInt(b));
        const commentIdMap = {};
        sortedCommentIds.forEach((commentId, index) => {
            commentIdMap[commentId] = index;
        });
        console.log("sortedCommentIds:", sortedCommentIds);
        // First we do a straightforward ("verbatim") application of the community notes
        // matrix factorization algorithgm, using the votes exactly as we get them from
        // polis (-1, 0, 1).
        const verbatimRatings = votes.map((vote) => ({
            userId: userIdMap[vote["voter-id"]],
            noteId: commentIdMap[vote["comment-id"]],
            rating: vote["vote"],
        }));
        console.time("verbatim communityNotesMatrixFactorization:");
        const verbatimHelpfulnessScores = yield (0, matrix_factorization_1.communityNotesMatrixFactorization)(verbatimRatings, 1, options.epochs, options.learningRate);
        console.timeEnd("verbatim communityNotesMatrixFactorization:");
        // Next apply the method by sticking closer to the original implementation, where
        // scores are on a scale of 0 to 1, so that the values will be easier to interpret
        // in terms of the thresholds listed in the original paper. Here, disagree and pass
        // votes are collapsed to 0, since we don't quite want to treat pass as 0.5.
        const agreeRatings = votes.map((vote) => ({
            userId: userIdMap[vote["voter-id"]],
            noteId: commentIdMap[vote["comment-id"]],
            rating: vote["vote"] == 1 ? 1 : 0,
        }));
        console.time("agree communityNotesMatrixFactorization:");
        const agreeHelpfulnessScores = yield (0, matrix_factorization_1.communityNotesMatrixFactorization)(agreeRatings, 1, options.epochs, options.learningRate);
        console.timeEnd("agree communityNotesMatrixFactorization:");
        // Similarly as above, but for pass votes, which we can potentially use as a signal for
        // "areas of uncertainty"
        const passRatings = votes.map((vote) => ({
            userId: userIdMap[vote["voter-id"]],
            noteId: commentIdMap[vote["comment-id"]],
            rating: vote["vote"] == 0 ? 1 : 0,
        }));
        console.time("pass communityNotesMatrixFactorization:");
        const passHelpfulnessScores = yield (0, matrix_factorization_1.communityNotesMatrixFactorization)(passRatings, 1, options.epochs, options.learningRate);
        console.timeEnd("pass communityNotesMatrixFactorization:");
        // And finally, for disagree consensus, or "common ground against", treated separately
        // from agree and pass votes
        const disagreeRatings = votes.map((vote) => ({
            userId: userIdMap[vote["voter-id"]],
            noteId: commentIdMap[vote["comment-id"]],
            rating: vote["vote"] == -1 ? 1 : 0,
        }));
        console.time("disagree communityNotesMatrixFactorization:");
        const disagreeHelpfulnessScores = yield (0, matrix_factorization_1.communityNotesMatrixFactorization)(disagreeRatings, 1, options.epochs, options.learningRate);
        console.timeEnd("disagree communityNotesMatrixFactorization:");
        const outputData = sortedCommentIds.map((commentId) => ({
            "comment-id": commentId,
            "helpfulness-verbatim": verbatimHelpfulnessScores[commentIdMap[commentId]],
            "helpfulness-agree": agreeHelpfulnessScores[commentIdMap[commentId]],
            "helpfulness-pass": passHelpfulnessScores[commentIdMap[commentId]],
            "helpfulness-disagree": disagreeHelpfulnessScores[commentIdMap[commentId]],
        }));
        // Write the updated rows to the output file
        const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
            path: options.outputFile,
            header: [
                { id: "comment-id", title: "comment-id" },
                { id: "helpfulness-verbatim", title: "helpfulness-verbatim" },
                { id: "helpfulness-agree", title: "helpfulness-agree" },
                { id: "helpfulness-disagree", title: "helpfulness-disagree" },
                { id: "helpfulness-pass", title: "helpfulness-pass" },
            ],
        });
        yield csvWriter.writeRecords(outputData).then(() => {
            console.log("CSV file written successfully.");
        });
    });
}
function parseFloats(value) {
    return value.split(",").map(parseFloat);
}
main();
