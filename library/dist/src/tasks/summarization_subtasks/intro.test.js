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
const vertex_model_1 = require("../../models/vertex_model");
const group_informed_1 = require("../../stats/group_informed");
const intro_1 = require("./intro");
const TEST_COMMENTS = [
    {
        id: "1",
        text: "comment 1",
        topics: [{ name: "Topic A", subtopics: [{ name: "Subtopic A.1" }] }],
    },
    {
        id: "2",
        text: "comment 2",
        topics: [{ name: "Topic A", subtopics: [{ name: "Subtopic A.1" }] }],
    },
    {
        id: "3",
        text: "comment 3",
        topics: [{ name: "Topic A", subtopics: [{ name: "Subtopic A.2" }] }],
    },
    {
        id: "4",
        text: "comment 4",
        topics: [{ name: "Topic B", subtopics: [{ name: "Subtopic B.1" }] }],
    },
];
describe("IntroTest", () => {
    it("should create an intro section", () => __awaiter(void 0, void 0, void 0, function* () {
        expect(yield new intro_1.IntroSummary(new group_informed_1.GroupedSummaryStats(TEST_COMMENTS), new vertex_model_1.VertexModel("project123", "usa")).getSummary()).toEqual({
            title: "## Introduction",
            text: `This report summarizes the results of public input, encompassing:
 * __4 statements__
 * __0 votes__
 * 2 topics
 * 3 subtopics

All voters were anonymous.`,
        });
    }));
});
