import { mongoDBAdapter } from "./client";

const mongodbPlugin = {
    name: "mongodb",
    description: "MongoDB database adapter plugin",
    adapters: [mongoDBAdapter],
};
export default mongodbPlugin;