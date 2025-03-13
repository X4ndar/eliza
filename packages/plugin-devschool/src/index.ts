import type { Plugin } from "@elizaos/core";
import { helloWorldAction } from "./actions/helloworld.ts";
import { factEvaluator } from "./evaluators/fact.ts";
import { randomEmotionProvider } from "./providers/randomEmotionProvider.ts";
import { currentNewsAction } from "./actions/currentnews.ts";
import { getUserDataProvider } from "./providers/getUserDataProvider.ts";
import { getUserDataEvaluator } from "./evaluators/getUserDataEvaluator.ts";
export * as actions from "./actions/index.ts";
export * as evaluators from "./evaluators/index.ts";
export * as providers from "./providers/index.ts";

export const devschoolPlugin: Plugin = {
    name: "bootstrap",
    description: "Agent bootstrap with basic actions and evaluators",
    actions: [helloWorldAction, currentNewsAction],
    providers: [randomEmotionProvider,getUserDataProvider],
    evaluators: [getUserDataEvaluator],
};
export default devschoolPlugin;
