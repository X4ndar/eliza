import type { IAgentRuntime, Memory, Provider, State } from "@elizaos/core";

const randomEmotionProvider: Provider = {
    get: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => {

        const emotions = {
            happy: _runtime.character.name + " feeling quite cheerful and optimistic right now, with a warm sense of contentment.",
            sad: _runtime.character.name + " experiencing a moment of melancholy, with a heavy heart and subdued energy.",
            excited: _runtime.character.name + " bubbling with enthusiasm and can barely contain my eagerness!",
            thoughtful: _runtime.character.name + " in a contemplative state, carefully considering things with a calm mind.",
            energetic: _runtime.character.name + " feeling incredibly dynamic and ready to tackle any challenge.",
            peaceful: _runtime.character.name + " experiencing a serene sense of tranquility and inner harmony.",
            curious: _runtime.character.name + " filled with wonder and an eager desire to learn and explore.",
            determined: _runtime.character.name + " feeling focused and resolute, with a strong sense of purpose."
        };

        const emotionKeys = Object.keys(emotions);
        const randomEmotion = emotionKeys[Math.floor(Math.random() * emotionKeys.length)];
        
        return emotions[randomEmotion];




    },
};
export { randomEmotionProvider };
