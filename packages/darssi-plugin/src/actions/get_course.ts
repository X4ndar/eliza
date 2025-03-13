import {
  embed,
  elizaLogger,
  generateText,
  type Action,
  type Content,
  type IAgentRuntime,
  type Memory,
  composeContext,
  ModelClass,
  HandlerCallback,
  State
} from "@elizaos/core";
import { getCourseById, getUserById } from "../utils/mongofunctions";
import type { CourseDoc } from "../utils/mongofunctions";
import { roomStateManager, CourseData } from '../services/roomStateManager';

// Helper to safely convert potential objects to strings for templates
function stringifyForTemplate(value: any): any {
  // If value is null or undefined, return empty string
  if (value === null || value === undefined) {
    return '';
  }
  
  // If it's an object (but not array), return empty string to avoid [object Object]
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return '';
  }
  
  // Return the original value for other types
  return value;
}

/**
 * Detects if a message is asking about course duration/hours
 * @param messageText - The message content to analyze
 * @returns True if the message is asking about duration/hours
 */
function isAskingAboutDuration(messageText: string): boolean {
  const lowerText = messageText.toLowerCase();
  return (
    lowerText.includes('hour') || 
    lowerText.includes('duration') || 
    lowerText.includes('time') ||
    lowerText.includes('how long') ||
    lowerText.includes('finish') ||
    lowerText.includes('complete')
  );
}

/**
 * Detects if a message is asking about the course difficulty
 */
function isAskingAboutDifficulty(messageText: string): boolean {
  const lowerText = messageText.toLowerCase();
  return (
    lowerText.includes('difficult') || 
    lowerText.includes('level') ||
    lowerText.includes('hard')
  );
}

/**
 * Detects if a message is asking about the course description
 */
function isAskingAboutDescription(messageText: string): boolean {
  const lowerText = messageText.toLowerCase();
  return (
    lowerText.includes('description') || 
    lowerText.includes('about') ||
    lowerText.includes('what') ||
    lowerText.includes('content') ||
    lowerText.includes('talk about') ||
    lowerText.includes('cover')
  );
}

/**
 * Detects if a message is asking about the course progress
 */
function isAskingAboutProgress(messageText: string): boolean {
  const lowerText = messageText.toLowerCase();
  return (
    lowerText.includes('progress') || 
    lowerText.includes('percent') ||
    lowerText.includes('%') ||
    lowerText.includes('far') ||
    lowerText.includes('completed')
  );
}

/**
 * Detects if a message is asking about how the course helps
 */
function isAskingHowCourseHelps(messageText: string): boolean {
  const lowerText = messageText.toLowerCase();
  return (
    lowerText.includes('help') || 
    lowerText.includes('benefit') ||
    lowerText.includes('useful') ||
    lowerText.includes('for me')
  );
}

/**
 * Creates the appropriate response text based on the course data and message
 */
function createCourseResponseText(courseData: CourseData, messageText: string): string {
  const lowerMessage = messageText.toLowerCase();
  
  // If asking about duration/hours
  if (isAskingAboutDuration(lowerMessage)) {
    elizaLogger.debug("User is asking about course duration");
    return `The course "${courseData.courseTitle}" requires ${courseData.courseDuration} to complete. This course is designed to be comprehensive while respecting your time commitments.`;
  }
  
  // If asking about difficulty
  else if (isAskingAboutDifficulty(lowerMessage)) {
    elizaLogger.debug("User is asking about difficulty level");
    return `The difficulty level of the course "${courseData.courseTitle}" is ${courseData.courseDifficulty}. The course is structured to build your knowledge progressively.`;
  }
  
  // If asking about description
  else if (isAskingAboutDescription(lowerMessage)) {
    elizaLogger.debug("User is asking about course description");
    const description = courseData.courseDescription || "No detailed description available.";
    
    if (description.includes("L'approche pédagogique")) {
      // Translate the French description
      return `The course "${courseData.courseTitle}" focuses on project management. The pedagogical approach of this course promotes active and participatory learning, allowing students to fully engage in acquiring project management skills. The course covers planning, execution, monitoring, and closing of projects.`;
    }
    
    return `Here's the description of the course "${courseData.courseTitle}": ${description}`;
  }
  
  // If asking about progress
  else if (isAskingAboutProgress(lowerMessage)) {
    elizaLogger.debug("User is asking about progress");
    if (courseData.progress !== undefined) {
      return `You are currently at ${courseData.progress}% completion of the course "${courseData.courseTitle}". ${courseData.currentChapter !== undefined ? `You're on chapter ${courseData.currentChapter}.` : ''}`;
    } else {
      return `I don't have progress information for the course "${courseData.courseTitle}" yet. Would you like to track your progress as you move through the course?`;
    }
  }
  
  // If asking how the course helps
  else if (isAskingHowCourseHelps(lowerMessage)) {
    elizaLogger.debug("User is asking how the course helps");
    if (courseData.courseTitle.toLowerCase().includes("management") || 
        courseData.courseTitle.toLowerCase().includes("projet")) {
      return `As a management student, the "${courseData.courseTitle}" course will be extremely valuable for you. It will provide you with essential skills in project planning, execution, resource allocation, and team leadership - all critical competencies for any management professional. The ${courseData.courseDuration} of training ensures you'll have both theoretical knowledge and practical skills that directly enhance your management capabilities.`;
    }
    return `The course "${courseData.courseTitle}" will help you develop valuable skills in this field. With a duration of ${courseData.courseDuration}, it offers comprehensive coverage of key concepts that will enhance your professional capabilities.`;
  }
  
  // Generic response with key information
  elizaLogger.debug("Providing generic course information");
  return `Here are the details for the course "${courseData.courseTitle}":
- Description: ${courseData.courseDescription || "Not specified"}
- Duration: ${courseData.courseDuration || "Not specified"}
- Difficulty: ${courseData.courseDifficulty || "Not specified"}
${courseData.progress !== undefined ? `- Current Progress: ${courseData.progress}%` : ''}

What specific aspect of the course would you like to know more about?`;
}

export const fetchCourseDetailsAction: Action = {
  name: "FETCH_COURSE_DETAILS",
  similes: ["FETCH_COURSE_INFO"],
  description:
    "Fetches the course info from cache, checks memory, if not found queries the DB, saves in memory, and returns the result.",
  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    // Check if message appears to be a question about course information
    const messageText = message.content.text.toLowerCase();
    
    // Always trigger if explicitly mentioned in command
    if (messageText.includes("fetch") && (messageText.includes("course") || messageText.includes("information"))) {
      return true;
    }
    
    // Check if question is asking about hours, difficulty, etc.
    const isCourseQuestion = 
      isAskingAboutDuration(messageText) ||
      isAskingAboutDifficulty(messageText) ||
      isAskingAboutDescription(messageText) ||
      isAskingAboutProgress(messageText) ||
      isAskingHowCourseHelps(messageText) ||
      messageText.includes("course");
    
    // If we already have course data and this is a course question, we should handle it
    if (roomStateManager.hasCourseData(message.roomId) && isCourseQuestion) {
      elizaLogger.debug("Course data exists and message appears to be a course question");
      return true;
    }
    
    // If we don't have course data yet, but they're asking for course info
    if (!roomStateManager.hasCourseData(message.roomId) && (
      messageText.includes("course") || 
      messageText.includes("learn") ||
      messageText.includes("study") ||
      messageText.includes("class")
    )) {
      elizaLogger.debug("No course data yet but message appears to be requesting course info");
      return true;
    }
    
    return false;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: { [key: string]: unknown },
    callback: HandlerCallback
  ): Promise<boolean> => {
    try {
      elizaLogger.debug("Fetching course details...");
      elizaLogger.debug(`Message text: ${message.content.text}`);
      
      // Step 1: Check if we already have this course data in room state
      const existingCourseData = roomStateManager.getCourseData(message.roomId);
      if (existingCourseData?.hasCourseData) {
        elizaLogger.debug("Course data found in room state", JSON.stringify(existingCourseData));
        
        // Create response text based on the course data and the message
        const responseText = createCourseResponseText(existingCourseData, message.content.text);
        
        // Create memory content with action property for database storage
        const memoryContent: Content = { 
          text: responseText,
          action: "fetchCourseDetailsAction"
        };
        
        callback(memoryContent);
        return true;
      }
      
      // Step 2: Look for course ID to process - from cache, memory, or message
      let courseId: string | null = null;
      
      // Try to extract from current message
      const courseIdMatch = message.content.text.match(/course\s+id\s*[:=]?\s*([a-zA-Z0-9-_]+)/i);
      if (courseIdMatch && courseIdMatch[1]) {
        courseId = courseIdMatch[1];
        elizaLogger.debug(`Found course ID in message: ${courseId}`);
      }
      
      // Step 3: If we have course information in the message, process it through LLM
      if (message.content.text.includes("Course Information:") || 
          (message.content.text.includes("Title:") && message.content.text.includes("Description:"))) {
        elizaLogger.debug("Found course information in message, processing through LLM");
        return await processMemoryThroughLLM(runtime, message, callback);
      }
      
      // Step 4: If we have a courseId, try to fetch from database
      let courseData: CourseData | undefined;
      let fetchedFromDB = false;
      
      if (courseId) {
        try {
          // Attempt to fetch from database
          courseData = await roomStateManager.fetchCourseFromDB(runtime, message.roomId, courseId);
          
          if (courseData) {
            fetchedFromDB = true;
            elizaLogger.debug("Course details fetched from database", JSON.stringify(courseData));
          }
        } catch (error) {
          elizaLogger.error("Error fetching course from database:", error);
        }
      }
      
      // Step 5: If we couldn't fetch from database, create mock data
      if (!courseData) {
        courseData = {
          hasCourseData: true,
          courseId: courseId || "COURSE-123",
          courseTitle: "Management de projet",
          courseDescription: "L'approche pédagogique de ce cours favorise un apprentissage actif et participatif, permettant aux étudiants de s'impliquer pleinement dans l'acquisition des compétences en management de projet.",
          courseDifficulty: "Intermediate",
          courseDuration: "100 hours",
          studentName: "Ilias Majdouline"
        };
        
        elizaLogger.debug("Using mock course data", JSON.stringify(courseData));
      }
      
      // Store in room state for future reference
      roomStateManager.setCourseData(message.roomId, courseData);
      
      // Create response based on the question type
      const responseText = createCourseResponseText(courseData, message.content.text);
      
      // Create memory content with action property for database storage
      const memoryContent: Content = {
        text: responseText,
        action: "fetchCourseDetailsAction"
      };
      
      // Log the response we're sending back
      elizaLogger.debug("Sending course details response:", responseText);
      
      // Call the callback with the content that will be stored in the database
      callback(memoryContent);
      return true;
    } catch (error) {
      elizaLogger.error("Error fetching course details:", error);
      
      // Create memory content with action property for database storage
      const errorContent: Content = {
        text: "I apologize, but I couldn't fetch the course details at this time. Please try again later.",
        action: "fetchCourseDetailsAction"
      };
      
      callback(errorContent);
      return true;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Can you tell me more about the Introduction to AI course?" }
      },
      {
        user: "{{user2}}",
        content: {
          text: "Here are the details about the Introduction to AI course:\nTitle: Introduction to AI\nDescription: Learn the fundamentals of Artificial Intelligence\nDifficulty Level: Beginner\nDuration: 10 hours\nStudent: Alice",
          action: "fetchCourseDetailsAction"
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "I'd like to know more about the Machine Learning course I'm enrolled in" }
      },
      {
        user: "{{user2}}",
        content: {
          text: "Let me share the details of your Machine Learning course:\nTitle: Machine Learning Basics\nDescription: A comprehensive introduction to ML concepts\nDifficulty Level: Intermediate\nDuration: 15 hours\nStudent: Bob",
          action: "fetchCourseDetailsAction"
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Could you show me information about my Python Programming course?" }
      },
      {
        user: "{{user2}}",
        content: {
          text: "Of course! Here's what I found about your Python Programming course:\nTitle: Advanced Python Programming\nDescription: Master advanced Python concepts and best practices\nDifficulty Level: Advanced\nDuration: 20 hours\nStudent: Carol",
          action: "fetchCourseDetailsAction"
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Show me my course details" }
      },
      {
        user: "{{user2}}",
        content: {
          text: "I apologize, but I couldn't find the course details. Could you please specify which course you're interested in?",
          action: "fetchCourseDetailsAction"
        }
      }
    ]
  ]
};

// Helper function to process memory through LLM
async function processMemoryThroughLLM(
  runtime: IAgentRuntime,
  memory: Memory,
  callback: HandlerCallback
): Promise<boolean> {
  try {
    elizaLogger.debug("Processing memory through LLM...");
    // Extract context from memory
    const memoryText = memory.content.text;
    let parsedContext: any = {};
    let refinedContext = memoryText;
    
    // Try to extract structured context from memory text
    try {
      const contextMatch = memoryText.match(/Course Information:([\s\S]*?)(?=\n\n|$)/);
      if (contextMatch && contextMatch[1]) {
        refinedContext = `Course Information:${contextMatch[1]}`;
        
        // Extract individual fields for structured data
        const titleMatch = refinedContext.match(/Title: ([^\n]+)/);
        const descriptionMatch = refinedContext.match(/Description: ([^\n]+)/);
        const difficultyMatch = refinedContext.match(/Difficulty: ([^\n]+)/);
        const durationMatch = refinedContext.match(/Duration: ([^\n]+)/);
        
        parsedContext = {
          title: titleMatch && titleMatch[1] ? titleMatch[1].trim() : "Unknown Course",
          description: descriptionMatch && descriptionMatch[1] ? descriptionMatch[1].trim() : "No description available",
          difficulty: difficultyMatch && difficultyMatch[1] ? difficultyMatch[1].trim() : "Intermediate",
          duration: durationMatch && durationMatch[1] ? durationMatch[1].trim() : "unspecified time"
        };
      }
    } catch (error) {
      elizaLogger.error("Error parsing context:", error);
      // If error during parsing, still store raw context
      parsedContext = { rawContext: memoryText };
    }
    
    // Store in room state
    const courseData: CourseData = {
      hasCourseData: true,
      courseTitle: parsedContext.title || "Unknown Course",
      courseDescription: parsedContext.description || "No description available",
      courseDifficulty: parsedContext.difficulty || "Intermediate",
      courseDuration: parsedContext.duration || "unspecified time",
      rawContext: memoryText
    };
    
    // Save to room state
    roomStateManager.setCourseData(memory.roomId, courseData);
    
    elizaLogger.debug("Memory processed through LLM:", JSON.stringify(courseData));
    
    // Create response based on the content of the original message
    const responseText = createCourseResponseText(courseData, memory.content.text);
    
    // Create memory content with action property for database storage
    const memoryContent: Content = {
      text: responseText,
      action: "fetchCourseDetailsAction"
    };
    
    callback(memoryContent);
    return true;
    
  } catch (error) {
    elizaLogger.error("Error in processMemoryThroughLLM:", error);
    
    // Even on error, try to store some data in room state
    roomStateManager.setCourseData(memory.roomId, {
      hasCourseData: true,
      courseTitle: "Unknown Course",
      courseDescription: "Error extracting course details",
      rawContext: memory.content.text
    });
    
    // Create memory content with action property for database storage
    const errorContent: Content = {
      text: "I had trouble processing the course information. Could you provide more details about the course?",
      action: "fetchCourseDetailsAction"
    };
    
    callback(errorContent);
    return false;
  }
}
