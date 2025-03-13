import { type Provider, elizaLogger, IAgentRuntime, Memory, State } from "@elizaos/core";
import { roomStateManager, CourseData } from "../services/roomStateManager";

/**
 * Debugs an object by outputting its complete structure
 * @param obj - The object to debug
 * @returns A descriptive string with object properties
 */
function debugObject(obj: any): string {
  if (!obj) return "undefined or null";
  
  try {
    if (typeof obj === 'object') {
      return JSON.stringify(obj, null, 2);
    } else {
      return `${typeof obj}: ${obj.toString()}`;
    }
  } catch (e) {
    return `Error debugging object: ${e}`;
  }
}

/**
 * Formats course information into a concise summary
 * @param courseData - The course data to format
 * @returns Formatted course summary text
 */
function formatCourseInfo(courseData: CourseData): string {
  if (!courseData || !courseData.hasCourseData) {
    return "No course information is available.";
  }
  
  let result = `Course: ${courseData.courseTitle}\n`;
  
  if (courseData.courseDescription) {
    // If description is long, truncate it
    const desc = courseData.courseDescription.length > 150 
      ? courseData.courseDescription.substring(0, 150) + "..." 
      : courseData.courseDescription;
    result += `Description: ${desc}\n`;
  }
  
  if (courseData.courseDuration) {
    result += `Duration: ${courseData.courseDuration}\n`;
  }
  
  if (courseData.courseDifficulty) {
    result += `Difficulty: ${courseData.courseDifficulty}\n`;
  }
  
  if (courseData.progress !== undefined) {
    result += `Current Progress: ${courseData.progress}%\n`;
  }
  
  if (courseData.studentName) {
    result += `Student: ${courseData.studentName}\n`;
  }
  
  return result;
}

export const courseContextProvider: Provider = {
  get: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<any> => {
    try {
      const roomId = message?.roomId;
      elizaLogger.debug("courseContextProvider: Checking for course data", { roomId });
      
      if (!roomId) {
        elizaLogger.warn("courseContextProvider: No roomId provided");
        return undefined;
      }
      
      // Get course data from room state
      const courseData = roomStateManager.getCourseData(roomId);
      
      if (!courseData || !courseData.hasCourseData) {
        elizaLogger.debug(`courseContextProvider: No course data found for room ${roomId}`);
        return undefined;
      }
      
      elizaLogger.debug(`courseContextProvider: Found course data for room ${roomId}`, debugObject(courseData));
      
      // Format the course information for use in character message templates
      const formattedInfo = formatCourseInfo(courseData);
      
      return `The student is currently accessing the following course information:
${formattedInfo}
You should reference this information directly when answering course-related questions.
If the student asks a specific question about the course like duration, difficulty, or description, respond with the exact information provided above.
When asking how the course can help them, connect the course content to their student needs, focusing on practical applications and skill development.`;
    } catch (error) {
      elizaLogger.error("courseContextProvider: Error getting course context", error);
      return undefined;
    }
  }
}; 