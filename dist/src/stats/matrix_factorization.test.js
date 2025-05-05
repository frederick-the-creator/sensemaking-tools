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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const tf = __importStar(require("@tensorflow/tfjs-core"));
const matrix_factorization_1 = require("./matrix_factorization");
describe("Matrix Factorization Tests", () => {
    // Mock console.log to avoid cluttering the test output
    const originalConsoleLog = console.log;
    beforeEach(() => {
        console.log = jest.fn();
    });
    afterEach(() => {
        console.log = originalConsoleLog;
        // Also be sure to restore all other mocks to avoid errors with minimize mocks
        // not being cleared
        jest.restoreAllMocks();
    });
    it("should perform matrix factorization and return note helpfulness scores", () => __awaiter(void 0, void 0, void 0, function* () {
        const ratings = [
            { userId: 0, noteId: 0, rating: 1.0 },
            { userId: 0, noteId: 1, rating: 0.5 },
            { userId: 1, noteId: 0, rating: 0.0 },
            { userId: 1, noteId: 2, rating: 1.0 },
            { userId: 2, noteId: 1, rating: 1.0 },
            { userId: 2, noteId: 2, rating: 0.5 },
            { userId: 3, noteId: 0, rating: 0.0 },
            { userId: 3, noteId: 1, rating: 0.0 },
            { userId: 3, noteId: 2, rating: 0.0 },
        ];
        const numNotes = 3;
        const helpfulnessScores = yield (0, matrix_factorization_1.communityNotesMatrixFactorization)(ratings, 1, 10, 0.05);
        expect(helpfulnessScores).toBeInstanceOf(Array);
        expect(helpfulnessScores.length).toBe(numNotes);
        helpfulnessScores.forEach((score) => {
            expect(typeof score).toBe("number");
        });
    }));
    it("should handle different numbers of factors", () => __awaiter(void 0, void 0, void 0, function* () {
        const ratings = [
            { userId: 0, noteId: 0, rating: 1.0 },
            { userId: 0, noteId: 1, rating: 0.5 },
            { userId: 1, noteId: 0, rating: 0.0 },
            { userId: 1, noteId: 2, rating: 1.0 },
            { userId: 2, noteId: 1, rating: 1.0 },
            { userId: 2, noteId: 2, rating: 0.5 },
            { userId: 3, noteId: 0, rating: 0.0 },
            { userId: 3, noteId: 1, rating: 0.0 },
            { userId: 3, noteId: 2, rating: 0.0 },
        ];
        const numNotes = 3;
        const helpfulnessScores2 = yield (0, matrix_factorization_1.communityNotesMatrixFactorization)(ratings, 2, 10, 0.05);
        const helpfulnessScores3 = yield (0, matrix_factorization_1.communityNotesMatrixFactorization)(ratings, 3, 10, 0.05);
        expect(helpfulnessScores2).toBeInstanceOf(Array);
        expect(helpfulnessScores2.length).toBe(numNotes);
        expect(helpfulnessScores3).toBeInstanceOf(Array);
        expect(helpfulnessScores3.length).toBe(numNotes);
    }));
    it("should handle different numbers of epochs", () => __awaiter(void 0, void 0, void 0, function* () {
        const ratings = [
            { userId: 0, noteId: 0, rating: 1.0 },
            { userId: 0, noteId: 1, rating: 0.5 },
            { userId: 1, noteId: 0, rating: 0.0 },
        ];
        const numNotes = 2;
        const numFactors = 1;
        const numEpocs = 33;
        const learningRate = 0.05;
        // Mock out the minimize function so we can count how many times it gets called
        const mockMinimize = jest.fn();
        /* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
        jest.spyOn(tf.train, "adam").mockReturnValue({ minimize: mockMinimize });
        const helpfulnessScores = yield (0, matrix_factorization_1.communityNotesMatrixFactorization)(ratings, numFactors, numEpocs, learningRate);
        // Check how many times it was called
        expect(mockMinimize).toHaveBeenCalledTimes(numEpocs);
        // Check that we're still getting an array, etc out (this could be more
        // meaningful if our mock was also doing the normal job of minimize)
        expect(helpfulnessScores).toBeInstanceOf(Array);
        expect(helpfulnessScores.length).toBe(numNotes);
    }));
    it("should handle different numbers of epochs, and multiple learning rates", () => __awaiter(void 0, void 0, void 0, function* () {
        const ratings = [
            { userId: 0, noteId: 0, rating: 1.0 },
            { userId: 0, noteId: 1, rating: 0.5 },
            { userId: 1, noteId: 0, rating: 0.0 },
        ];
        const numNotes = 2;
        const numFactors = 1;
        const numEpocs = 33;
        const learningRate = [0.05, 0.01];
        // Mock out the minimize function so we can count how many times it gets called
        const mockMinimize = jest.fn();
        /* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
        jest.spyOn(tf.train, "adam").mockReturnValue({ minimize: mockMinimize });
        const helpfulnessScores = yield (0, matrix_factorization_1.communityNotesMatrixFactorization)(ratings, numFactors, numEpocs, learningRate);
        // Check how many times it was called
        expect(mockMinimize).toHaveBeenCalledTimes(numEpocs * 2);
        // Check that we're still getting an array, etc out (this could be more
        // meaningful if our mock was also doing the normal job of minimize)
        expect(helpfulnessScores).toBeInstanceOf(Array);
        expect(helpfulnessScores.length).toBe(numNotes);
    }));
    it("should handle all notes having identical ratings", () => __awaiter(void 0, void 0, void 0, function* () {
        const ratings = [
            { userId: 0, noteId: 0, rating: 1.0 },
            { userId: 1, noteId: 0, rating: 1.0 },
            { userId: 2, noteId: 0, rating: 1.0 },
            { userId: 0, noteId: 1, rating: 1.0 },
            { userId: 1, noteId: 1, rating: 1.0 },
            { userId: 2, noteId: 1, rating: 1.0 },
            { userId: 0, noteId: 2, rating: 1.0 },
            { userId: 1, noteId: 2, rating: 1.0 },
            { userId: 2, noteId: 2, rating: 1.0 },
        ];
        const numNotes = 3;
        const helpfulnessScores = yield (0, matrix_factorization_1.communityNotesMatrixFactorization)(ratings, 1, 100, 0.05);
        expect(helpfulnessScores).toBeInstanceOf(Array);
        expect(helpfulnessScores.length).toBe(numNotes);
        helpfulnessScores.forEach((score) => {
            expect(typeof score).toBe("number");
        });
    }));
    it("should be okay to have a skipped userId", () => __awaiter(void 0, void 0, void 0, function* () {
        const ratings = [
            { userId: 0, noteId: 0, rating: 1.0 },
            { userId: 1, noteId: 0, rating: 1.0 },
            { userId: 3, noteId: 0, rating: 1.0 },
            { userId: 0, noteId: 1, rating: 1.0 },
            { userId: 1, noteId: 1, rating: 1.0 },
            { userId: 3, noteId: 1, rating: 1.0 },
            { userId: 0, noteId: 2, rating: 1.0 },
            { userId: 1, noteId: 2, rating: 1.0 },
            { userId: 3, noteId: 2, rating: 1.0 },
        ];
        const numNotes = 3;
        const helpfulnessScores = yield (0, matrix_factorization_1.communityNotesMatrixFactorization)(ratings, 1, 100, 0.05);
        expect(helpfulnessScores).toBeInstanceOf(Array);
        expect(helpfulnessScores.length).toBe(numNotes);
        helpfulnessScores.forEach((score) => {
            expect(typeof score).toBe("number");
        });
    }));
    it("should be okay to have a skipped noteId", () => __awaiter(void 0, void 0, void 0, function* () {
        const ratings = [
            { userId: 0, noteId: 0, rating: 1.0 },
            { userId: 1, noteId: 0, rating: 1.0 },
            { userId: 2, noteId: 0, rating: 1.0 },
            { userId: 0, noteId: 1, rating: 1.0 },
            { userId: 1, noteId: 1, rating: 1.0 },
            { userId: 2, noteId: 1, rating: 1.0 },
            { userId: 0, noteId: 3, rating: 1.0 },
            { userId: 1, noteId: 3, rating: 1.0 },
            { userId: 2, noteId: 3, rating: 1.0 },
        ];
        const numNotes = 4;
        const helpfulnessScores = yield (0, matrix_factorization_1.communityNotesMatrixFactorization)(ratings, 1, 100, 0.05);
        expect(helpfulnessScores).toBeInstanceOf(Array);
        expect(helpfulnessScores.length).toBe(numNotes);
        helpfulnessScores.forEach((score) => {
            expect(typeof score).toBe("number");
        });
    }));
    it("should be okay to have skipped noteId and userIds", () => __awaiter(void 0, void 0, void 0, function* () {
        const ratings = [
            { userId: 0, noteId: 0, rating: 1.0 },
            { userId: 1, noteId: 0, rating: 1.0 },
            { userId: 3, noteId: 0, rating: 1.0 },
            { userId: 0, noteId: 1, rating: 1.0 },
            { userId: 1, noteId: 1, rating: 1.0 },
            { userId: 3, noteId: 1, rating: 1.0 },
            { userId: 0, noteId: 3, rating: 1.0 },
            { userId: 1, noteId: 3, rating: 1.0 },
            { userId: 3, noteId: 3, rating: 1.0 },
        ];
        const numNotes = 4;
        const helpfulnessScores = yield (0, matrix_factorization_1.communityNotesMatrixFactorization)(ratings, 1, 100, 0.05);
        expect(helpfulnessScores).toBeInstanceOf(Array);
        expect(helpfulnessScores.length).toBe(numNotes);
        helpfulnessScores.forEach((score) => {
            expect(typeof score).toBe("number");
        });
    }));
});
