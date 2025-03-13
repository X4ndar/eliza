import { type Plugin, elizaLogger } from "@elizaos/core";
import { fetchCourseDetailsAction } from "./actions/get_course";
import { courseContextProvider } from "./providers/courseContextProvider";
import { courseDataProvider } from "./providers/courseDataProvider";
import { roomStateManager, RoomStateManager, CourseData } from "./services/roomStateManager";

// Export Room State Manager for use by other plugins
export { roomStateManager, RoomStateManager, CourseData };

export const darssiPlugin: Plugin = {
  name: "darssi",
  description: "Educational support plugin for the Darssi platform.",
  actions: [fetchCourseDetailsAction],
  evaluators: [],
  providers: [courseDataProvider, courseContextProvider],
  services: [roomStateManager]
};

export default darssiPlugin;
