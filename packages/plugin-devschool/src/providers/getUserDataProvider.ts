import { Provider,IAgentRuntime,Memory } from "@elizaos/core";

 const getUserDataProvider:Provider = {

    get:async(runtime:IAgentRuntime,message:Memory)=>{
        
        //TODO:
        //Check  database for the information we already have - ID should be agentname-username
        //if we don't have the info, indicate to the agent in the provider that we want it
        //Based on conditions, instruct the agent to ask for more information on a specific type
        
        
        
        
        return "SOME USER DATA!!!!!!!!!!!!!!!!!!!!!!! ";
    },


};

export{getUserDataProvider};