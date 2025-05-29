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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_VERTEX_PARALLELISM =
  exports.RETRY_DELAY_MS =
  exports.MAX_LLM_RETRIES =
  exports.MAX_RETRIES =
    void 0;
// Util class for models
// The maximum number of times a task should be retried.
exports.MAX_RETRIES = 3;
// The maximum number of times an LLM call should be retried (it's higher to avoid rate limits).
exports.MAX_LLM_RETRIES = 9;
// How long in milliseconds to wait between API calls.
exports.RETRY_DELAY_MS = 1000; // 1 seconds
// Set default vertex parallelism based on similarly named environment variable, or default to 2
exports.DEFAULT_VERTEX_PARALLELISM = parseInt(process.env["DEFAULT_VERTEX_PARALLELISM"] || "4");
