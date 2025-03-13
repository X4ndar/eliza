import type {
    ActionExample,
    IAgentRuntime,
    Memory,
    Action,
    State,
    HandlerCallback,
} from "@elizaos/core";

export const helloWorldAction : Action = {
    name: "HELLO_WOLRD",
    similes: ["HELLO_WORLD"],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },
    description:
        "RESPONDING WITH A HELLO WORLD",
    handler: async ( 
        _runtime: IAgentRuntime,
        _message: Memory,
        _state: State,
        _options: { [key: string]: unknown },
        _callback: HandlerCallback
    ): Promise<boolean> => {

        const helloworld = "hello world im the futur darssi plugin";

        _callback({ text: helloworld });
         
        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "hello world", action: "HELLO_WORLD" },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "HELLO_WORLD" },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "hi world", action: "HELLO_WORLD" },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "HELLO_WORLD" },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "hey world", action: "HELLO_WORLD" },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "HELLO_WORLD" },
            },
        ],
    ] as ActionExample[][],
} as Action;
