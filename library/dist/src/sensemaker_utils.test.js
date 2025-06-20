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
const sensemaker_utils_1 = require("./sensemaker_utils");
const types_1 = require("./types");
// mock retry timeout
jest.mock("./models/model_util", () => {
    const originalModule = jest.requireActual("./models/model_util");
    return Object.assign(Object.assign({ __esModule: true }, originalModule), { RETRY_DELAY_MS: 0 });
});
const TEST_COMMENTS = [
    {
        id: "1",
        text: "comment1",
        voteInfo: {
            "0": new types_1.VoteTally(10, 5, 0),
            "1": new types_1.VoteTally(5, 10, 5),
        },
    },
    {
        id: "2",
        text: "comment2",
        voteInfo: {
            "0": new types_1.VoteTally(2, 5, 3),
            "1": new types_1.VoteTally(5, 3, 2),
        },
    },
];
describe("SensemakerUtilsTest", () => {
    it("should create a prompt", () => {
        expect((0, sensemaker_utils_1.getPrompt)("Summarize this.", ["comment1", "comment2"])).toEqual(`
<instructions>
  Summarize this.
</instructions>

<data>
  <comment>comment1</comment>
  <comment>comment2</comment>
</data>`);
    });
    it("should include additional instructions in the prompt", () => {
        expect((0, sensemaker_utils_1.getPrompt)("Summarize this.", ["comment1", "comment2"], "This is for a town hall style conversation")).toEqual(`
<instructions>
  Summarize this.
</instructions>

<additionalContext>
  This is for a town hall style conversation
</additionalContext>

<data>
  <comment>comment1</comment>
  <comment>comment2</comment>
</data>`);
    });
    describe("groupCommentsByTopic", () => {
        it("should group comments by topic and subtopic", () => {
            const comment1 = {
                id: "1",
                text: "Comment 1",
                topics: [
                    { name: "Topic 1", subtopics: [{ name: "Subtopic 1.1" }] },
                    { name: "Topic 2", subtopics: [{ name: "Subtopic 2.1" }] },
                ],
            };
            const comment2 = {
                id: "2",
                text: "Comment 2",
                topics: [
                    { name: "Topic 1", subtopics: [{ name: "Subtopic 1.1" }] },
                    { name: "Topic 1", subtopics: [{ name: "Subtopic 1.2" }] },
                ],
            };
            const categorizedComments = [comment1, comment2];
            const expectedOutput = {
                "Topic 1": {
                    "Subtopic 1.1": {
                        "1": comment1,
                        "2": comment2,
                    },
                    "Subtopic 1.2": {
                        "2": comment2,
                    },
                },
                "Topic 2": {
                    "Subtopic 2.1": {
                        "1": comment1,
                    },
                },
            };
            const result = (0, sensemaker_utils_1.groupCommentsBySubtopic)(categorizedComments);
            expect(result).toEqual(expectedOutput);
        });
        it("should skip comment if it has no topics", () => {
            const categorizedComments = [
                {
                    id: "1",
                    text: "Comment 1",
                    topics: [], // No topics assigned
                },
            ];
            expect((0, sensemaker_utils_1.groupCommentsBySubtopic)(categorizedComments)).toEqual({});
        });
    });
    it("should format comments with vote tallies via formatCommentsWithVotes", () => {
        expect((0, sensemaker_utils_1.formatCommentsWithVotes)(TEST_COMMENTS)).toEqual([
            `comment1
      vote info per group: {"0":{"agreeCount":10,"disagreeCount":5,"passCount":0},"1":{"agreeCount":5,"disagreeCount":10,"passCount":5}}`,
            `comment2
      vote info per group: {"0":{"agreeCount":2,"disagreeCount":5,"passCount":3},"1":{"agreeCount":5,"disagreeCount":3,"passCount":2}}`,
        ]);
    });
    it("Should get unique topics from a list of comments", () => {
        expect((0, sensemaker_utils_1.getUniqueTopics)([
            { id: "1", text: "hi", topics: [{ name: "topic1", subtopics: [{ name: "subtopic1" }] }] },
            {
                id: "2",
                text: "hello",
                topics: [{ name: "topic1", subtopics: [{ name: "subtopic1" }, { name: "subtopic2" }] }],
            },
            {
                id: "3",
                text: "hola",
                topics: [{ name: "topic2", subtopics: [{ name: "subtopic3" }] }],
            },
        ])).toEqual([
            { name: "topic1", subtopics: [{ name: "subtopic1" }, { name: "subtopic2" }] },
            { name: "topic2", subtopics: [{ name: "subtopic3" }] },
        ]);
    });
    describe("decimalToPercent", () => {
        it("should convert decimal to percent", () => expect((0, sensemaker_utils_1.decimalToPercent)(0.5)).toEqual("50%"));
        it("should convert decimal to percent with precision", () => expect((0, sensemaker_utils_1.decimalToPercent)(0.55555, 2)).toEqual("55.56%"));
    });
});
describe("executeConcurrently", () => {
    let consoleErrorSpy;
    beforeEach(() => {
        // Suppress console.error
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { });
    });
    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });
    it("should execute all callbacks and return their results in order", () => __awaiter(void 0, void 0, void 0, function* () {
        const callbacks = [
            () => Promise.resolve(1),
            () => Promise.resolve(2),
            () => Promise.resolve(3),
        ];
        const results = yield (0, sensemaker_utils_1.executeConcurrently)(callbacks);
        expect(results).toEqual([1, 2, 3]);
    }));
});
