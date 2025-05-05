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
// Run the summarizer based on CSV data as output from the processing scripts in the `bin`
// directory, and as documented in `runner_utils.ts`.
const commander_1 = require("commander");
const fs_1 = require("fs");
const runner_utils_1 = require("./runner_utils");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Parse command line arguments.
        const program = new commander_1.Command();
        program
            .option("-o, --outputBasename <file>", "The output basename, this will be prepended to the output file names.")
            .option("-i, --inputFile <file>", "The input file name.")
            .option("-a, --additionalContext <context>", "A short description of the conversation to add context.")
            .option("-v, --vertexProject <project>", "The Vertex Project name.");
        program.parse(process.argv);
        const options = program.opts();
        const comments = yield (0, runner_utils_1.getCommentsFromCsv)(options.inputFile);
        const summary = yield (0, runner_utils_1.getSummary)(options.vertexProject, comments, undefined, options.additionalContext);
        const markdownContent = summary.getText("MARKDOWN");
        (0, fs_1.writeFileSync)(options.outputBasename + "-summary.md", markdownContent);
        (0, runner_utils_1.writeSummaryToHtml)(summary, options.outputBasename + "-summary.html");
        (0, runner_utils_1.writeSummaryToGroundedCSV)(summary, options.outputBasename + "-summaryAndSource.csv");
        const jsonContent = JSON.stringify(summary, null, 2);
        (0, fs_1.writeFileSync)(options.outputBasename + "-summary.json", jsonContent);
    });
}
main();
