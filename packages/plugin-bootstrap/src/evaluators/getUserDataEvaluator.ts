import { Evaluator,IAgentRuntime,Memory } from "@elizaos/core";

 const getUserDataEvaluator:Evaluator ={
    name: "getUserDataEvaluator",
    description: "Get user data",
    similes: ["GET_INFORMATION","EXTRACT_INFORMATION","GET_USER_DATA"],
    
    validate:async(runtime:IAgentRuntime,message:Memory,)=>{
        return true;
    },
    handler:async(runtime:IAgentRuntime,message:Memory,)=>{
        console.log("evaluator called!!!!!!!!!!!!!!!!!!!!");
        return true;
    },
    examples:[],
};

export{getUserDataEvaluator};