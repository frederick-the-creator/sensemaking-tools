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
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
Object.defineProperty(exports, "__esModule", { value: true });
const runner_utils_1 = require("./runner_utils");
const types_1 = require("../src/types");
// Mock FileStream to be able to test the reading of CSVs.
jest.mock("fs", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Readable } = require("stream");
  const actualFs = jest.requireActual("fs");
  let mockCsvData = "";
  let mockHeaderData = "";
  const mockCreateReadStream = jest.fn().mockImplementation(() => {
    const stream = new Readable();
    stream.push(mockCsvData);
    stream.push(null);
    return stream;
  });
  const mockReadFileSync = jest.fn().mockImplementation(() => {
    return mockHeaderData;
  });
  return Object.assign(Object.assign({}, actualFs), {
    readFileSync: mockReadFileSync,
    createReadStream: mockCreateReadStream,
    __setMockCsvData: (data) => {
      mockCsvData = data;
    },
    __setMockHeaderData: (data) => {
      mockHeaderData = data;
    },
  });
});
describe("getCommentsFromCsv", () => {
  const mockFilePath = "mock-file.csv";
  let mockFs;
  beforeEach(() => {
    mockFs = jest.requireMock("fs");
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should read comments with group vote tallies from a CSV file", () =>
    __awaiter(void 0, void 0, void 0, function* () {
      const mockCsvContent = `comment-id,comment_text,group-0-agree-count,group-0-disagree-count,group-0-pass-count,group-1-agree-count,group-1-disagree-count,group-1-pass-count
1,comment1,10,5,0,5,10,5
2,comment2,2,5,3,5,3,2`;
      const mockHeader = mockCsvContent.split("\n")[0];
      mockFs.__setMockHeaderData(mockHeader);
      mockFs.__setMockCsvData(mockCsvContent);
      const comments = yield (0, runner_utils_1.getCommentsFromCsv)(mockFilePath);
      expect(comments).toHaveLength(2);
      expect(comments[0].id).toBe("1");
      expect(comments[0].text).toBe("comment1");
      expect(comments[0].voteInfo).toEqual({
        "group-0": new types_1.VoteTally(10, 5, 0),
        "group-1": new types_1.VoteTally(5, 10, 5),
      });
      expect(comments[1].id).toBe("2");
      expect(comments[1].text).toBe("comment2");
      expect(comments[1].voteInfo).toEqual({
        "group-0": new types_1.VoteTally(2, 5, 3),
        "group-1": new types_1.VoteTally(5, 3, 2),
      });
    }));
  it("should read comments with no group vote tallies from a CSV file", () =>
    __awaiter(void 0, void 0, void 0, function* () {
      const mockCsvContent = `comment-id,comment_text,agrees,disagrees,passes
1,comment1,10,5,0
2,comment2,2,5,3`;
      mockFs.__setMockHeaderData(mockCsvContent.split("\n")[0]);
      mockFs.__setMockCsvData(mockCsvContent);
      const comments = yield (0, runner_utils_1.getCommentsFromCsv)(mockFilePath);
      expect(comments).toHaveLength(2);
      expect(comments[0].id).toBe("1");
      expect(comments[0].text).toBe("comment1");
      expect(comments[0].voteInfo).toEqual(new types_1.VoteTally(10, 5, 0));
      expect(comments[1].id).toBe("2");
      expect(comments[1].text).toBe("comment2");
      expect(comments[1].voteInfo).toEqual(new types_1.VoteTally(2, 5, 3));
    }));
});
describe("parseTopicsString", () => {
  it("should parse a single topic string", () => {
    const topicsString = "Topic A:Subtopic A.1";
    const expectedTopics = [
      { name: "Topic A", subtopics: [{ name: "Subtopic A.1", subtopics: [] }] },
    ];
    expect((0, runner_utils_1.parseTopicsString)(topicsString)).toEqual(expectedTopics);
  });
  it("should parse multiple topic strings", () => {
    const topicsString = "Topic A:Subtopic A.1;Topic B:Subtopic B.1;Topic C";
    const expectedTopics = [
      { name: "Topic A", subtopics: [{ name: "Subtopic A.1", subtopics: [] }] },
      { name: "Topic B", subtopics: [{ name: "Subtopic B.1", subtopics: [] }] },
      { name: "Topic C" },
    ];
    expect((0, runner_utils_1.parseTopicsString)(topicsString)).toEqual(expectedTopics);
  });
  it("should handle topic strings with only topic names", () => {
    const topicsString = "Topic A;Topic B;Topic C";
    const expectedTopics = [{ name: "Topic A" }, { name: "Topic B" }, { name: "Topic C" }];
    expect((0, runner_utils_1.parseTopicsString)(topicsString)).toEqual(expectedTopics);
  });
  it("should handle topic strings with only topic names, including : separators", () => {
    const topicsString = "Topic A:;Topic B:;Topic C:";
    const expectedTopics = [{ name: "Topic A" }, { name: "Topic B" }, { name: "Topic C" }];
    expect((0, runner_utils_1.parseTopicsString)(topicsString)).toEqual(expectedTopics);
  });
  it("should handle topic strings with only subtopic names", () => {
    const topicsString = "Topic A:Subtopic A.1;Topic B:Subtopic B.1";
    const expectedTopics = [
      { name: "Topic A", subtopics: [{ name: "Subtopic A.1", subtopics: [] }] },
      { name: "Topic B", subtopics: [{ name: "Subtopic B.1", subtopics: [] }] },
    ];
    expect((0, runner_utils_1.parseTopicsString)(topicsString)).toEqual(expectedTopics);
  });
  it("should handle topic strings with multiple subtopics", () => {
    const topicsString =
      "Topic A:Subtopic A.1;Topic A:Subtopic A.2;Topic B:Subtopic B.1;Topic B:Subtopic B.2";
    const expectedTopics = [
      {
        name: "Topic A",
        subtopics: [
          { name: "Subtopic A.1", subtopics: [] },
          { name: "Subtopic A.2", subtopics: [] },
        ],
      },
      {
        name: "Topic B",
        subtopics: [
          { name: "Subtopic B.1", subtopics: [] },
          { name: "Subtopic B.2", subtopics: [] },
        ],
      },
    ];
    expect((0, runner_utils_1.parseTopicsString)(topicsString)).toEqual(expectedTopics);
  });
  it("should handle topic strings with themes", () => {
    const topicsString = "Topic A:Subtopic A:Theme A;Topic A:Subtopic A:Theme B";
    const expectedTopics = [
      {
        name: "Topic A",
        subtopics: [{ name: "Subtopic A", subtopics: [{ name: "Theme A" }, { name: "Theme B" }] }],
      },
    ];
    expect((0, runner_utils_1.parseTopicsString)(topicsString)).toEqual(expectedTopics);
  });
});
