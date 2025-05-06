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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VertexModel = void 0;
// Module to interact with models available on Google Cloud's Model Garden, including Gemini and
// Gemma models. All available models are listed here: https://cloud.google.com/model-garden?hl=en
const p_limit_1 = __importDefault(require("p-limit"));
const vertexai_1 = require("@google-cloud/vertexai");
const model_1 = require("./model");
const types_1 = require("../types");
const sensemaker_utils_1 = require("../sensemaker_utils");
const model_util_1 = require("./model_util");
/**
 * Class to interact with models available through Google Cloud's Model Garden.
 */
class VertexModel extends model_1.Model {
    /**
     * Create a model object.
     * @param project - the Google Cloud Project ID, not the numberic project name
     * @param location - The Google Cloud Project location
     * @param modelName - the name of the model from Vertex AI's Model Garden to connect with, see
     * the full list here: https://cloud.google.com/model-garden
     */
    constructor(project, location, modelName = "gemini-2.0-flash-lite") {
        super();
        this.vertexAI = new vertexai_1.VertexAI({
            project: project,
            location: location,
        });
        this.modelName = modelName;
        console.log("Creating VertexModel with ", model_util_1.DEFAULT_VERTEX_PARALLELISM, " parallel workers...");
        this.limit = (0, p_limit_1.default)(model_util_1.DEFAULT_VERTEX_PARALLELISM);
    }
    /**
     * Get generative model corresponding to structured data output specification as a JSON Schema specification.
     */
    getGenerativeModel(schema) {
        return this.vertexAI.getGenerativeModel(getModelParams(this.modelName, schema));
    }
    /**
     * Generate text based on the given prompt.
     * @param prompt the text including instructions and/or data to give the model
     * @returns the model response as a string
     */
    generateText(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.callLLM(prompt, this.getGenerativeModel());
        });
    }
    /**
     * Generate structured data based on the given prompt.
     * @param prompt the text including instructions and/or data to give the model
     * @param schema a JSON Schema specification (generated from TypeBox)
     * @returns the model response as data structured according to the JSON Schema specification
     */
    generateData(prompt, schema) {
        return __awaiter(this, void 0, void 0, function* () {
            const validateResponse = (response) => {
                let parsedResponse;
                try {
                    parsedResponse = JSON.parse(response);
                }
                catch (e) {
                    console.error(`Model returned a non-JSON response:\n${response}\n${e}`);
                    return false;
                }
                if (!(0, types_1.checkDataSchema)(schema, parsedResponse)) {
                    console.error("Model response does not match schema: " + response);
                    return false;
                }
                return true;
            };
            return JSON.parse(yield this.callLLM(prompt, this.getGenerativeModel(schema), validateResponse));
        });
    }
    // TODO: Switch from a `validator` fn to a `conformer` fn.
    /**
     * Calls an LLM to generate text based on a given prompt and handles rate limiting, response validation and retries.
     *
     * Concurrency: To take advantage of concurrent execution, invoke this function as a batch of callbacks,
     * and pass it to the `executeConcurrently` function. It will run multiple `callLLM` functions concurrently,
     * up to the limit set by `p-limit` in `VertexModel`'s constructor.
     *
     * @param prompt - The text prompt to send to the language model.
     * @param model - The specific language model that will be called.
     * @param validator - optional check for the model response.
     * @returns A Promise that resolves with the text generated by the language model.
     */
    callLLM(prompt_1, model_2) {
        return __awaiter(this, arguments, void 0, function* (prompt, model, validator = () => true) {
            const req = getRequest(prompt);
            // Wrap the entire retryCall sequence with the `p-limit` limiter,
            // so we don't let other calls to start until we're done with the current one
            // (in case it's failing with rate limits error and needs to be waited on and retried first)
            const rateLimitedCall = () => this.limit(() => __awaiter(this, void 0, void 0, function* () {
                return yield (0, sensemaker_utils_1.retryCall)(
                // call LLM
                function () {
                    return __awaiter(this, void 0, void 0, function* () {
                        return (yield model.generateContentStream(req)).response;
                    });
                }, 
                // Check if the response exists and contains a text field.
                function (response) {
                    var _a, _b;
                    if (!response) {
                        console.error("Failed to get a model response.");
                        return false;
                    }
                    const responseText = response.candidates[0].content.parts[0].text;
                    if (!responseText) {
                        console.error(`Model returned an empty response:`, response.candidates[0].content);
                        return false;
                    }
                    if (!validator(responseText)) {
                        return false;
                    }
                    console.log(`✓ Completed LLM call (input: ${(_a = response.usageMetadata) === null || _a === void 0 ? void 0 : _a.promptTokenCount} tokens, output: ${(_b = response.usageMetadata) === null || _b === void 0 ? void 0 : _b.candidatesTokenCount} tokens)`);
                    return true;
                }, model_util_1.MAX_LLM_RETRIES, "Failed to get a valid model response.", model_util_1.RETRY_DELAY_MS, [], // Arguments for the LLM call
                [] // Arguments for the validator function
                );
            }));
            const response = yield rateLimitedCall();
            return response.candidates[0].content.parts[0].text;
        });
    }
}
exports.VertexModel = VertexModel;
const safetySettings = [
    {
        category: vertexai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: vertexai_1.HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: vertexai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: vertexai_1.HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: vertexai_1.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: vertexai_1.HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: vertexai_1.HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: vertexai_1.HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: vertexai_1.HarmCategory.HARM_CATEGORY_UNSPECIFIED,
        threshold: vertexai_1.HarmBlockThreshold.BLOCK_NONE,
    },
];
/**
 * Creates a model specification object for Vertex AI generative models.
 *
 * @param schema Optional. The JSON schema for the response. Only used if responseMimeType is 'application/json'.
 * @returns A model specification object ready to be used with vertex_ai.getGenerativeModel().
 */
function getModelParams(modelName, schema) {
    const modelParams = {
        model: modelName,
        generationConfig: {
            // Param docs: http://cloud/vertex-ai/generative-ai/docs/model-reference/inference#generationconfig
            temperature: 0,
            topP: 0,
        },
        safetySettings: safetySettings,
    };
    if (schema && modelParams.generationConfig) {
        modelParams.generationConfig.responseMimeType = "application/json";
        modelParams.generationConfig.responseSchema = schema;
    }
    return modelParams;
}
function getRequest(prompt) {
    return {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    };
}
