import { Comment, SummarizationType, Summary, Topic } from "./types";
import { ModelSettings, Model } from "./models/model";
export declare class Sensemaker {
    private modelSettings;
    /**
     * Creates a Sensemaker object
     * @param modelSettings what models to use for what tasks, a default model can be set.
     */
    constructor(modelSettings: ModelSettings);
    /**
     * Get corresponding model from modelSettings object, or defaultModel if none specified.
     * @param modelSetting the key of the modelSettings options you want the Model for (corresponding to task)
     * @return The model to use for the corresponding ModelSetting key
     */
    getModel(modelSetting: keyof ModelSettings): Model;
    /**
     * Generates a conversation summary, optionally incorporating vote data.
     *
     * It offers flexibility in how topics for the summary are determined:
     * 1. Categorized Comments: If the input `comments` are already categorized (i.e., they have a
     *    `topics` property), those topics are used directly for the summary structure.
     * 2. Provided Topics:  If `topics` are explicitly provided, they are used to categorize the
     *    comments before summarization. This ensures the summary has statistics based on the
     *    specified topics (like comments count per topic).
     * 3. Learned Topics: If neither categorized comments nor explicit topics are provided, the
     *    function will automatically learn topics from the comments using an LLM. This is the most
     *    automated option but requires more processing time.
     *
     * The function supports different summarization types (e.g., basic summarization,
     * vote-tally-based summarization), and allows for additional instructions to guide the
     * summarization process. The generated summary is then grounded in the original comments to
     * ensure accuracy and relevance.
     *
     * @param comments An array of `Comment` objects representing the public conversation comments. If
     *  these comments are already categorized (have a `topics` property), the summarization will be
     *  based on those existing categories.
     * @param summarizationType  The type of summarization to perform (e.g.,
     *  `SummarizationType.GROUP_INFORMED_CONSENSUS`).
     * @param topics  An optional array of `Topic` objects. If provided, these topics will be used for
     *  comment categorization before summarization, ensuring that the summary addresses the specified
     *  topics. If `comments` are already categorized, this parameter is ignored.
     * @param additionalContext Optional additional context to provide to the LLM for
     *  summarization. The context will be appended verbatim to the summarization prompt. This
     * should be 1-2 sentences on what the conversation is about and where it takes place.
     * @returns A Promise that resolves to a `Summary` object, containing the generated summary text
     *  and metadata.
     */
    summarize(comments: Comment[], summarizationType?: SummarizationType, topics?: Topic[], additionalContext?: string): Promise<Summary>;
    /**
     * Extracts topics from the comments using a LLM on Vertex AI. Retries if the LLM response is invalid.
     * @param comments The comments data for topic modeling
     * @param includeSubtopics Whether to include subtopics in the topic modeling
     * @param topics Optional. The user provided top-level topics, if these are specified only
     * subtopics will be learned.
     * @param additionalContext Optional additional context to provide to the LLM for
     *  topic learning. The context will be appended verbatim to the prompt. This
     * should be 1-2 sentences on what the conversation is about and where it takes place.
     * @param topicDepth how many levels of topics to learn, from topic to sub-sub-topic
     * @returns: Topics (optionally containing subtopics) representing what is discussed in the
     * comments.
     */
    learnTopics(comments: Comment[], includeSubtopics: boolean, topics?: Topic[], additionalContext?: string, topicDepth?: 1 | 2 | 3): Promise<Topic[]>;
    /**
     * Categorize the comments by topics using a LLM on Vertex.
     * @param comments The data to summarize
     * @param includeSubtopics Whether to include subtopics in the categorization.
     * @param topics The user provided topics (and optionally subtopics).
     * @param additionalContext Optional additional context to provide to the LLM for
     * categorization. The context will be appended verbatim to the prompt. This
     * should be 1-2 sentences on what the conversation is about and where it takes place.
     * @param topicDepth how many levels of topics to learn, from topic to sub-sub-topic
     * @param theme Optional theme to pass to categorizeCommentsRecursive
     * @param factor Optional factor to pass to categorizeCommentsRecursive
     * @returns: The LLM's categorization.
     */
    categorizeComments(comments: Comment[], includeSubtopics: boolean, topics?: Topic[], additionalContext?: string, topicDepth?: 1 | 2 | 3, theme?: string, factor?: string, prompt_categorise_comments?: string, prompt_learn_factor?: string, prompt_learn_metrics?: string): Promise<Comment[]>;
}
