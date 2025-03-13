import { Evaluator,IAgentRuntime,Memory } from "@elizaos/core";

 const getUserDataEvaluator:Evaluator ={
    name: "getUserDataEvaluator",
    description: "Get user data",
    similes: ["GET_INFORMATION","EXTRACT_INFORMATION","GET_USER_DATA"],
    
    validate:async(runtime:IAgentRuntime,message:Memory,)=>{
        //After goal is complete, Provider shows that information is complete, evaluator no longer validates



        return true;
    },
    handler:async(runtime:IAgentRuntime,message:Memory,)=>{
        //Steps:
        //Evaluate for new info and store in the database if there is any
        //once we have all information, complete the goal and send off the data to some API 
        
        
        
        
        ;
        return true;
    },
    examples:[],
};

export{getUserDataEvaluator};