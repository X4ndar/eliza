// Import required types and utilities from the core package
import {
    type ActionExample,
    type IAgentRuntime,
    type Memory,
    type Action,
    type State,
    type HandlerCallback,
    type Content,
    composeContext,
    ModelClass,
    generateText,
} from "@elizaos/core";

// Define the current news action that fetches and returns news based on user queries
export const currentNewsAction : Action = {
    // Action identifier
    name: "CURRENT_NEWS",
    // Alternative names/triggers for this action
    similes: ["CURRENT_NEWS"],
    // Basic validation - always returns true for now
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },
    // Human readable description of what this action does
    description:
        "RESPONDING WITH THE CURRENT NEWS",
    // Main handler function that processes the news request
    handler: async ( 
        _runtime: IAgentRuntime,
        _message: Memory,
        _state: State,
        _options: { [key: string]: unknown },
        _callback: HandlerCallback
    ): Promise<boolean> => {

        // Helper function to fetch news articles from NewsAPI
        async function getCurrentNews(searchTerm: string) {
            const response = await fetch(
                `https://newsapi.org/v2/everything?q=${searchTerm}&apiKey=${process.env.NEWS_API_KEY}`);
            const data = await response.json();
            // Get first 5 articles and format them nicely
            return data.articles.slice(0, 5)
            .map((article: any) => `${article.title} - ${article.source.name}
            \n${article.description}\n${article.publishedAt}`)
            .join("\n");
        }

        // Create context for AI to extract search terms from user message
        const context = `Extract the search term from the {{userName}} message. The message is:
        ${_message.content.text}
        Only respond with the search term, nothing else.
        `;

        // Use AI to extract the search term from user's message
        const searchTerm=await generateText({
            runtime:_runtime,
            context,
            modelClass:ModelClass.SMALL,
            stop:["\n"],
        });

        // Fetch the news articles using the extracted search term
        const currentnews = await getCurrentNews(searchTerm);

        // Format the response text
        const responsetext = `Here are the latest news on ${searchTerm}:
        ${currentnews}`;

        // Create a new memory object to store the response
        const newmemory : Memory={
            userId: _message.agentId,
            agentId: _message.agentId,
            roomId: _message.roomId,
            content: {
                text: responsetext,
                 action: "CURRENT_NEWS",
                 source: _message.content?.source,
                } as Content,
        };

        // Save the response to memory
        await _runtime.messageManager.createMemory(newmemory);

        // Send the response back through the callback
        _callback(newmemory.content);
         
        return true;
    },
    // Example interactions to demonstrate how to use this action
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "What's the latest news about AI?", action: "CURRENT_NEWS" },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "CURRENT_NEWS" },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Show me news about climate change", action: "CURRENT_NEWS" },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "CURRENT_NEWS" },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Get me the latest news on SpaceX", action: "CURRENT_NEWS" },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "CURRENT_NEWS" },
            },
        ],
    ] as ActionExample[][],
} as Action;
