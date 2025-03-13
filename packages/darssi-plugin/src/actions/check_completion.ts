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
 * Action to check course completion status
 * This action allows checking if a user has completed a course
 */
export const checkCompletionAction: Action = {
  name: "CHECK_COURSE_COMPLETION",
  similes: ["VERIFY_COMPLETION", "IS_COURSE_COMPLETED"],
  description:
    "Checks if a user has completed a course and provides completion status.",
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
      elizaLogger.debug("Checking course completion status...");
      
      // Step 1: Check if we have course data
      let courseData = roomStateManager.getCourseData(message.roomId);
      if (!courseData?.hasCourseData) {
        callback({ 
          text: "I don't have any course information yet. Please use the FETCH_COURSE_DETAILS action first." 
        });
        return true;
      }
      
      // Step 2: Try to extract user ID from message or use stored one
      const userIdMatch = message.content.text.match(/user\s+id\s*[:=]?\s*([a-zA-Z0-9-_]+)/i);
      let userId = userIdMatch && userIdMatch[1] 
        ? userIdMatch[1] 
        : roomStateManager.getUserId(message.roomId);
      
      if (!userId) {
        // Default test user ID
        userId = "user123";
        roomStateManager.setUserId(message.roomId, userId);
      }
      
      // Step 3: Get course ID
      const courseId = courseData.courseId || "COURSE-123";
      
      // Step 4: Check completion status
      const isCompleted = await roomStateManager.checkCourseCompletion(
        runtime, 
        message.roomId, 
        userId, 
        courseId
      );
      
      // Refresh course data
      courseData = roomStateManager.getCourseData(message.roomId);
      
      // Step 5: Create response based on completion status
      let responseText: string;
      
      if (isCompleted) {
        const completionDate = courseData?.completionDate 
          ? new Date(courseData.completionDate).toLocaleDateString() 
          : "recently";
          
        responseText = `Congratulations! You have completed the course "${courseData?.courseTitle}" on ${completionDate}.`;
        
        if (courseData?.progress === 100) {
          responseText += " You've finished 100% of the course content.";
        }
      } else {
        responseText = `You have not yet completed the course "${courseData?.courseTitle}".`;
        
        if (courseData?.progress !== undefined) {
          responseText += ` You're currently at ${courseData.progress}% completion.`;
          
          if (courseData.currentChapter !== undefined && courseData.chapters?.length) {
            responseText += ` You're on chapter ${courseData.currentChapter} of ${courseData.chapters.length}.`;
          }
        }
        
        responseText += " Keep up the good work!";
      }
      
      callback({ text: responseText });
      return true;
    } catch (error) {
      elizaLogger.error("Error checking course completion:", error);
      callback({ text: "I apologize, but I couldn't check your course completion status at this time. Please try again later." });
      return true;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Have I completed this course?" }
      },
      {
        user: "{{user2}}",
        content: {
          text: "Congratulations! You have completed the course \"Introduction to AI\" on 2023-05-15. You've finished 100% of the course content.",
          action: "checkCompletionAction"
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Check if I finished the machine learning course" }
      },
      {
        user: "{{user2}}",
        content: {
          text: "You have not yet completed the course \"Machine Learning Basics\". You're currently at 40% completion. You're on chapter 4 of 10. Keep up the good work!",
          action: "checkCompletionAction"
        }
      }
    ]
  ]
}; 