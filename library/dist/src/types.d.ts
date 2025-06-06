import { TSchema, type Static } from "@sinclair/typebox";
/**
 * TypeBox JSON Schema representation of a single topic record as a name, with no subtopics.
 */
export declare const FlatTopic: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
}>;
/**
 * Type representation of a single topic record as a name, with no subtopics.
 */
export type FlatTopic = Static<typeof FlatTopic>;
/**
 * TypeBox JSON Schema representation of a topic record as a name, with flat subtopics.
 */
export declare const NestedTopic: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    subtopics: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
    }>>;
}>;
/**
 * Type representation of a topic record as a name, with flat subtopics.
 */
export type NestedTopic = Static<typeof NestedTopic>;
/**
 * TypeBox JSON Schema representation of an abstract topic, either with or without subtopics.
 */
export declare const Topic: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
}>, import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    subtopics: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
    }>>;
}>]>;
/**
 * Type representation of an abstract topic, either with or without subtopics.
 */
export type Topic = Static<typeof Topic>;
/**
 * TypeBox JSON Schema representation of a comment id, together with a list of associated topics.
 */
export declare const TopicCategorizedComment: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    topics: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
    }>>;
}>;
/**
 * Type representation of a comment id, together with a list of associated topics.
 */
export type TopicCategorizedComment = Static<typeof TopicCategorizedComment>;
/**
 * TypeBox JSON Schema representation of a comment id, together with a list of associated topics and subtopics.
 */
export declare const SubtopicCategorizedComment: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    topics: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
        subtopics: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            name: import("@sinclair/typebox").TString;
        }>>;
    }>>;
}>;
/**
 * Type representation of a comment id, together with a list of associated topics and subtopics.
 */
export type SubtopicCategorizedComment = Static<typeof SubtopicCategorizedComment>;
/**
 * TypeBox JSON Schema representation of a comment id, together with a list of associated topics and possibly subtopics.
 */
export declare const CommentRecord: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    topics: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
    }>>;
}>, import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    topics: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
        subtopics: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            name: import("@sinclair/typebox").TString;
        }>>;
    }>>;
}>]>;
/**
 * Type representation of a comment id, together with a list of associated topics and possibly subtopics.
 */
export type CommentRecord = Static<typeof CommentRecord>;
/**
 * Describes the type of summarization to use.
 *
 * GROUP_INFORMED_CONSENSUS - summarizes the comments with the highest group informed consensus
 * AGGREGATE_VOTE - summarizes the comments based on the majority vote. Does not use votes.
 */
export declare enum SummarizationType {
    GROUP_INFORMED_CONSENSUS = 0,
    AGGREGATE_VOTE = 1
}
/**
 * Represents a portion of a summary, optionally linked to representative comments.
 */
export interface SummaryContent {
    /**
     * Optional data type, for filtering (etc.) operations based on non-displayed data
     */
    type?: string;
    /**
     * The name of the section
     */
    title?: string;
    /**
     * The text content for this part of the summary.
     */
    text: string;
    /**
     * An optional array of comment IDs that are representative of this content.
     * These IDs can be used for grounding and providing context.
     * Could be empty for fluffy/connecting text (e.g., ", and also" between two verifiable points).
     */
    citations?: string[];
    /**
     * Summaries that belong underneath this summary. This is meant to capture relations like
     * topic/subtopic.
     */
    subContents?: SummaryContent[];
}
/**
 * Specifies the format for citations within a summary.
 *
 * XML includes ID only, MARKDOWN includes text and votes as well.
 *
 * EXAMPLES:
 *
 * Input contents:
 *  - "Members of Group A want cleaner parks." with comment IDs [123, 345]
 *  - " However, they disagree..." with comment ID [678]
 *  - " and others favoring..." with comment ID [912]
 *
 * Output (XML format):
 *  Members of Group A want cleaner parks.<citation comment_id=123><citation comment_id=345>
 *   However, they disagree...<citation comment_id=678>
 *   and others favoring...<citation comment_id=912>
 *
 * Output (MARKDOWN format):
 *  Members of Group A want cleaner parks.[[123](## "I want a cleaner park\nVotes: group-1(Agree=15, Disagree=2, Pass=3)")[[345](## "Clean parks are essential.\nVotes: group-2(Agree=10, Disagree=5)")]
 *   However, they disagree...[[678](## "More trash cans would help.\nVotes: group-1(Agree=20, Disagree=1)")]
 *   and others favoring...[[912](## "Littering fines are the solution.\nVotes: group-2(Agree=12, Disagree=3, Pass=2)")]
 */
export type CitationFormat = "XML" | "MARKDOWN";
/**
 * Represents a summary composed of multiple SummaryContents.
 * If a SummaryContent contains a claim, it should be grounded by representative comments.
 */
export declare class Summary {
    /**
     * An array of SummaryContent objects, each representing a part of the summary.
     */
    contents: SummaryContent[];
    comments: Comment[];
    constructor(contents: SummaryContent[], comments: Comment[]);
    /**
     * Returns the text of the summary, formatted according to the specified citation format.
     * @param format The desired format for citations. Can be "XML" or "MARKDOWN".
     * @returns The formatted summary text.  Throws an error if an unsupported format is provided.
     */
    getText(format: CitationFormat): string;
    /**
     * Filter the contents according to removeFn, using sensemaker utils filterSummaryContent
     * @param removeFn Decides whether SummaryContent object should be removed or not
     * @returns boolean
     */
    withoutContents(removeFn: (sc: SummaryContent) => boolean): Summary;
    private getContentText;
    private getCitationText;
}
/**
 * Aggregates a number of individual votes.
 */
export declare class VoteTally {
    agreeCount: number;
    disagreeCount: number;
    passCount?: number;
    constructor(agreeCount: number, disagreeCount: number, passCount?: number);
    getTotalCount(includePasses: boolean): number;
}
/**
 * Checks if the data is a VoteTally object.
 *
 * It has the side effect of changing the type of the object to VoteTally if applicable.
 *
 * @param data - the object to check
 * @returns - true if the object is a VoteTally
 */
export declare function isVoteTallyType(data: any): data is VoteTally;
/**
 * A text that was voted on by different groups.
 */
export interface Comment {
    id: string;
    text: string;
    voteInfo?: VoteInfo;
    topics?: Topic[];
}
export type VoteInfo = GroupVoteTallies | VoteTally;
export interface CommentWithVoteInfo extends Comment {
    voteInfo: GroupVoteTallies | VoteTally;
}
export type GroupVoteTallies = {
    [key: string]: VoteTally;
};
/**
 * Checks if the given data is a CommentWithVoteInfo object (that is, a Comment object that includes VoteTallies), and sets the type as such if it passes.
 * @param data the object to check
 * @returns true if the object is a CommentWithVoteInfo, and false otherwise.
 */
export declare function isCommentWithVoteInfoType(data: any): data is CommentWithVoteInfo;
/**
 * Checks if the given object is a dictionary of group names to VoteTally objects.
 * @param data the object to check
 * @returns true if the object is a dictionary of groups to VoteTallys.
 */
export declare function isGroupVoteTalliesType(data: any): data is GroupVoteTallies;
/**
 * Checks if the data is a Comment object.
 *
 * It has the side effect of changing the type of the object to Comment if applicable.
 *
 * @param data - the object to check
 * @returns - true if the object is a Comment
 */
export declare function isCommentType(data: any): data is Comment;
/**
 * Check that the given data matches the corresponding TSchema specification. Caches type checking compilation.
 * @param schema The schema to check by
 * @param response The response to check
 * @returns Boolean for whether or not the data matches the schema
 */
export declare function checkDataSchema(schema: TSchema, response: any): boolean;
/**
 * Checks if the data is a CategorizedComment object.
 *
 * It has the side effect of changing the type of the object to CommentRecord if applicable.
 *
 * @param data - the object to check
 * @returns - true if the object is a Comment
 */
export declare function isCommentRecordType(data: any): data is CommentRecord;
/**
 * Checks if the data is a Topic object.
 *
 * It has the side effect of changing the type of the object to Topic if applicable.
 *
 * @param data - the object to check
 * @returns - true if the object is a Topic
 */
export declare function isTopicType(data: any): data is Topic;
