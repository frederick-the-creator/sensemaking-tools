import { TSchema, type Static } from "@sinclair/typebox";
export interface ModelSettings {
  defaultModel: Model;
  summarizationModel?: Model;
  categorizationModel?: Model;
  groundingModel?: Model;
}
export declare abstract class Model {
  readonly categorizationBatchSize: number;
  /**
   * Abstract method for generating a text response based on the given prompt.
   * @param prompt - the instructions and data to process as a prompt
   * @returns the model response
   */
  abstract generateText(prompt: string): Promise<string>;
  /**
   * Abstract method for generating structured data based on the given prompt.
   * @param prompt - the instructions and data to process as a prompt
   * @param schema - the schema to use for the structured data
   * @returns the model response
   */
  abstract generateData(prompt: string, schema: TSchema): Promise<Static<typeof schema>>;
}
