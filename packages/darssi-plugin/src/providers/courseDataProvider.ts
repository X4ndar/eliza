import type { Provider, IAgentRuntime, Memory } from "@elizaos/core";
import { getCourseById, getUserById } from "../utils/mongofunctions";
import { elizaLogger } from "@elizaos/core";

export const courseDataProvider: Provider = {
  get: async (runtime: IAgentRuntime, message: Memory) => {
    if (!message.content.text.trim().startsWith("{")) {
      // If not JSON, just skip or return an empty string
      return "";
    }
    // 1. Parse JSON from the message content
    let data: { CourseId?: string; userid?: string; userName?: string };
    try {
      data = JSON.parse(message.content.text);
    } catch (error) {
      elizaLogger.error("Invalid or missing JSON in the message:", error);
      return "I couldn't parse the JSON data for the course. Please send a valid JSON format.";
    }

    const { CourseId, userid, userName: providedName } = data;
    if (!CourseId || !userid) {
      elizaLogger.error("Course ID or User ID is missing in the provided JSON.");
      return "Course ID or User ID is missing from the JSON data.";
    }

    // 2. Build a cache key using the agent name and ephemeral user ID (from the message)
    const agentName = runtime.character.name || "agent";
    const ephemeralId = message.userId || "unknownEphemeral";
    const cacheKey = `${agentName}/${ephemeralId}/courseData`;

    // 3. Store the JSON data in the cache
    try {
      await (runtime.databaseAdapter as any).setCache({
        key: cacheKey,
        agentId: runtime.agentId,
        value: JSON.stringify({
          value: {
            CourseId,
            userid,
            userName: providedName
          }
        })
      });
    } catch (error) {
      elizaLogger.error("Error setting course data in cache:", error);
    }

    // 4. If the user's actual name is not provided, fetch from DB
    let userName = providedName || "";
    if (!userName) {
      try {
        const account = await getUserById(runtime, userid);
        userName = account?.name || "there";
      } catch (error) {
        elizaLogger.error("Error fetching user account:", error);
        userName = "there";
      }
    }

    // 5. Retrieve the course title from the DB
    let courseTitle: string;
    try {
      const course = await getCourseById(runtime, CourseId);
      courseTitle = course.title || (course as any).name || CourseId;
    } catch (error) {
      elizaLogger.error("Error fetching course details:", error);
      courseTitle = CourseId;
    }

    // 6. Construct the final instruction message
    const instruction = `the user name is ${userName}, the course he is studying is ${courseTitle}.`;

    // 7. Remove the JSON memory entry from main memory.
// If message.id is missing, search for it by matching the content.
if (message.id) {
  try {
    await runtime.messageManager.removeMemory(message.id);
    elizaLogger.debug(`Removed JSON message with id ${message.id} from main memory`);
  } catch (err) {
    elizaLogger.error("Failed to remove JSON message from main memory", err);
  }
} else {
  // If message.id is not present, look up the memory by matching the text in the same room.
  try {
    const memories = await runtime.messageManager.getMemories({ roomId: message.roomId, count: 50 });
    const jsonMemory = memories.find(mem => mem.content.text.trim() === message.content.text.trim());
    if (jsonMemory && jsonMemory.id) {
      await runtime.messageManager.removeMemory(jsonMemory.id);
      elizaLogger.debug(`Removed JSON message found by content with id ${jsonMemory.id} from main memory`);
    } else {
      elizaLogger.debug("JSON memory entry not found for deletion by content");
    }
  } catch (err) {
    elizaLogger.error("Error searching for JSON memory to delete", err);
  }
}


    // 8. Return the final instruction message
    return instruction;
  }
};
