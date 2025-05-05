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
exports.TopSubtopicsSummary = void 0;
const recursive_summarization_1 = require("./recursive_summarization");
const sensemaker_utils_1 = require("../../sensemaker_utils");
class TopSubtopicsSummary extends recursive_summarization_1.RecursiveSummary {
    getSummary() {
        return __awaiter(this, void 0, void 0, function* () {
            const allSubtopics = getFlattenedSubtopics(this.input.getStatsByTopic());
            const topSubtopics = getTopSubtopics(allSubtopics);
            const subtopicSummaryContents = [];
            for (let i = 0; i < topSubtopics.length; ++i) {
                subtopicSummaryContents.push(yield this.getSubtopicSummary(topSubtopics[i], i));
            }
            return Promise.resolve({
                title: `## Top ${topSubtopics.length} Most Discussed Subtopics`,
                text: `${allSubtopics.length} subtopics of discussion emerged. These ${topSubtopics.length} subtopics had the most statements submitted.`,
                subContents: subtopicSummaryContents,
            });
        });
    }
    getSubtopicSummary(st, index) {
        return __awaiter(this, void 0, void 0, function* () {
            const subtopicComments = st.summaryStats.comments;
            console.log(`Generating PROMINENT THEMES for top 5 subtopics: "${st.name}"`);
            const text = yield this.model.generateText((0, sensemaker_utils_1.getPrompt)(`Please generate a concise bulleted list identifying up to 5 prominent themes across all statements. Each theme should be less than 10 words long.  Do not use bold text.  These statements are all about ${st.name}`, subtopicComments.map((comment) => comment.text), this.additionalContext));
            const themesSummary = { title: "Prominent themes were:", text: text };
            return Promise.resolve({
                title: `### ${index + 1}. ${st.name} (${st.commentCount} statements)`,
                text: "",
                subContents: [themesSummary],
            });
        });
    }
}
exports.TopSubtopicsSummary = TopSubtopicsSummary;
function getTopSubtopics(allSubtopics, max = 5) {
    // Sort all subtopics by comment count, desc
    allSubtopics.sort((a, b) => b.commentCount - a.commentCount);
    // Get top subtopics, skipping other
    const topSubtopics = [];
    for (const st of allSubtopics) {
        if (st.name == "Other") {
            continue;
        }
        topSubtopics.push(st);
        if (topSubtopics.length >= max) {
            break;
        }
    }
    return topSubtopics;
}
// Returns all subtopics in a flat array.
function getFlattenedSubtopics(allTopicStats) {
    const allSubtopics = [];
    for (const t of allTopicStats) {
        if (t.subtopicStats) {
            for (const st of t.subtopicStats) {
                allSubtopics.push(st);
            }
        }
    }
    return allSubtopics;
}
