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
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
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
// Autorating prep runner
// Command to run:
// npx ts-node evals/autorating/autorating-prep/run_prep.ts -s <path/to/summary.txt> -c <path/to/comments.csv> -o <path/to/output.csv>
const commander_1 = require("commander");
const summary_splitter_1 = require("./summary_splitter");
const path = __importStar(require("path"));
function main() {
  return __awaiter(this, void 0, void 0, function* () {
    const program = new commander_1.Command();
    program
      .requiredOption(
        "-s, --summaryFile <file>",
        "Path to the summary file",
        "evals/autorating/autorating-prep/summary.txt"
      )
      .requiredOption(
        "-c, --commentsFile <file>",
        "Path to the comments CSV file",
        "evals/autorating/autorating-prep/comments.csv"
      )
      .option(
        "-o, --outputFile <file>",
        "Path to the output CSV file",
        "evals/autorating/autorating-prep/summary_statements.csv"
      );
    program.parse(process.argv);
    const options = program.opts();
    const summaryFilePath = path.resolve(options.summaryFile);
    const commentsFilePath = path.resolve(options.commentsFile);
    const outputFilePath = path.resolve(options.outputFile);
    (0, summary_splitter_1.splitSummaryAndLinkComments)(
      summaryFilePath,
      commentsFilePath,
      outputFilePath
    );
  });
}
main();
