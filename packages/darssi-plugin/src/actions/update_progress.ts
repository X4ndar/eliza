import {
  elizaLogger,
  type Action,
  type IAgentRuntime,
  type Memory,
  HandlerCallback,
  State
} from "@elizaos/core";
import { roomStateManager } from '../services/roomStateManager';

/**
 * Action to update course progress
 * This action allows updating the current chapter and tracking progress in a course
 */
export const updateProgressAction: Action = {
  name: "UPDATE_COURSE_PROGRESS",
  similes: ["UPDATE_CHAPTER", "TRACK_PROGRESS"],
  description:
    "Updates the current chapter or lesson in a course and calculates progress.",
  validate: async (_runtime: IAgentRuntime, _message: Memory): Promise<boolean> => {
    // Always run if triggered
    return true;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: { [key: string]: unknown },
    callback: HandlerCallback
  ): Promise<boolean> => {
    try {
      elizaLogger.debug("Updating course progress...");
      
      // Step 1: Check if we have course data
      const courseData = roomStateManager.getCourseData(message.roomId);
      if (!courseData?.hasCourseData) {
        callback({ 
          text: "I don't have any course information yet. Please use the FETCH_COURSE_DETAILS action first." 
        });
        return true;
      }
      
      // Step 2: Try to extract chapter number from message
      const chapterMatch = message.content.text.match(/chapter\s*(\d+)/i);
      let chapterNumber: number | null = null;
      
      if (chapterMatch && chapterMatch[1]) {
        chapterNumber = parseInt(chapterMatch[1], 10);
      }
      
      // If no chapter specified, try to increment current chapter
      if (chapterNumber === null && courseData.currentChapter !== undefined) {
        chapterNumber = courseData.currentChapter + 1;
      } else if (chapterNumber === null) {
        // Default to chapter 1 if no current chapter
        chapterNumber = 1;
      }
      
      // Step 3: Update the current chapter
      roomStateManager.updateCurrentChapter(message.roomId, chapterNumber);
      
      // Get updated course data with progress calculation
      const updatedCourseData = roomStateManager.getCourseData(message.roomId);
      
      // Step 4: Create response
      const totalChapters = updatedCourseData?.chapters?.length || 0;
      const progress = updatedCourseData?.progress || 0;
      
      let responseText: string;
      
      if (totalChapters > 0) {
        responseText = `I've updated your progress to Chapter ${chapterNumber} of ${totalChapters}. You are now ${progress}% through the course "${updatedCourseData?.courseTitle}".`;
      } else {
        responseText = `I've recorded that you're now on Chapter ${chapterNumber} of the course "${updatedCourseData?.courseTitle}".`;
      }
      
      callback({ text: responseText });
      return true;
    } catch (error) {
      elizaLogger.error("Error updating course progress:", error);
      callback({ text: "I apologize, but I couldn't update your course progress at this time. Please try again later." });
      return true;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "I've completed chapter 3" }
      },
      {
        user: "{{user2}}",
        content: {
          text: "I've updated your progress to Chapter 3 of 10. You are now 30% through the course \"Introduction to AI\".",
          action: "updateProgressAction"
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Mark the next chapter as complete" }
      },
      {
        user: "{{user2}}",
        content: {
          text: "I've updated your progress to Chapter 4 of 10. You are now 40% through the course \"Machine Learning Basics\".",
          action: "updateProgressAction"
        }
      }
    ]
  ]
}; 