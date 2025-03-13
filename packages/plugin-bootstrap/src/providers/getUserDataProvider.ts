import { Provider,IAgentRuntime,Memory } from "@elizaos/core";

 const getUserDataProvider:Provider = {

    get:async(runtime:IAgentRuntime,message:Memory)=>{
        return "SOME USER DATA!!!!!!!!!!!!!!!!!!!!!!! ";
    },


};

export{getUserDataProvider};