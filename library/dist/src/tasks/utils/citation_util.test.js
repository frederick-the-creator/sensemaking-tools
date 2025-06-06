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
const types_1 = require("../../types");
const citation_utils_1 = require("./citation_utils");
describe("Citation Utils Test", () => {
    describe("voteInfoToString", () => {
        it("should return an empty string if voteInfo is undefined", () => {
            const comment = {
                id: "123",
                text: "test comment",
            };
            expect((0, citation_utils_1.voteInfoToString)(comment)).toBe("");
        });
        it("should return a formatted string with vote tallies when voteInfo is defined with groups", () => {
            const comment = {
                id: "123",
                text: "test comment",
                voteInfo: {
                    group1: new types_1.VoteTally(10, 5),
                    group2: new types_1.VoteTally(15, 2, 3),
                },
            };
            expect((0, citation_utils_1.voteInfoToString)(comment)).toBe("Votes: group1(Agree=10, Disagree=5) group2(Agree=15, Disagree=2, Pass=3)");
        });
        it("should return a formatted string with vote tallies when voteInfo is defined without groups", () => {
            const comment = {
                id: "123",
                text: "test comment",
                voteInfo: new types_1.VoteTally(10, 5),
            };
            expect((0, citation_utils_1.voteInfoToString)(comment)).toBe("Votes: (Agree=10, Disagree=5)");
        });
    });
});
describe("commentCitation", () => {
    it("should format a comment citation correctly without vote tallies", () => {
        const comment = {
            id: "123",
            text: "This is a test comment.",
        };
        expect((0, citation_utils_1.commentCitation)(comment)).toBe(`[123](## "This is a test comment.")`);
    });
    it("should format a comment citation correctly with vote tallies", () => {
        const comment = {
            id: "123",
            text: "This is a test comment.",
            voteInfo: {
                group1: new types_1.VoteTally(10, 5, 1),
                group2: new types_1.VoteTally(15, 2, 3),
            },
        };
        expect((0, citation_utils_1.commentCitation)(comment)).toBe(`[123](## "This is a test comment.\nVotes: group1(Agree=10, Disagree=5, Pass=1) group2(Agree=15, Disagree=2, Pass=3)")`);
    });
    it("should handle comments with single quotes", () => {
        const comment = {
            id: "123",
            text: "This is a 'test' comment with 'single quotes'.",
        };
        expect((0, citation_utils_1.commentCitation)(comment)).toBe(`[123](## "This is a 'test' comment with 'single quotes'.")`);
    });
    it("should handle comments with double quotes", () => {
        const comment = {
            id: "123",
            text: 'This is a "test" comment with "double quotes".',
        };
        expect((0, citation_utils_1.commentCitation)(comment)).toBe(`[123](## "This is a \\"test\\" comment with \\"double quotes\\".")`);
    });
    it("should handle comments with newlines", () => {
        const comment = {
            id: "123",
            text: "This is a test comment\nwith newlines.",
        };
        expect((0, citation_utils_1.commentCitation)(comment)).toBe(`[123](## "This is a test comment with newlines.")`);
    });
});
