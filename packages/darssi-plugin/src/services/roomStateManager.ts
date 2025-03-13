import { elizaLogger, Service, ServiceType } from "@elizaos/core";
import type { IAgentRuntime } from "@elizaos/core";
import { getCourseById, getUserById, type CourseDoc, type UserDoc } from "../utils/mongofunctions";

/**
 * Interface for course data to provide type safety and documentation
 * This can be expanded as needed to include more course-specific information
 */
export interface CourseData {
  hasCourseData: boolean;
  courseId?: string;
  courseTitle?: string;
  courseDescription?: string;
  courseDifficulty?: string;
  courseDuration?: string;
  studentName?: string;
  userId?: string;
  isCompleted?: boolean;
  completionDate?: Date;
  // These fields can be expanded as the platform grows
  chapters?: any[];
  currentChapter?: number;
  quizzes?: any[];
  progress?: number;
  [key: string]: any; // Allow additional properties for flexibility
}

/**
 * Interface for the general room state
 * This defines the structure of data we maintain for each conversation room
 */
export interface RoomState {
  courseData?: CourseData;
  // Other state categories can be added here as the application grows
  quizData?: any;
  userPreferences?: any;
  sessionData?: any;
  userId?: string;
  [key: string]: any; // Allow additional categories
}

/**
 * RoomStateManager class
 * 
 * This service maintains state data for each conversation room,
 * allowing for persistent context across multiple messages within the same conversation.
 * 
 * It serves as an in-memory database for conversation-specific information
 * that needs to persist throughout the user interaction.
 */
export class RoomStateManager extends Service {
  /**
   * Define service type for registration
   */
  static get serviceType(): ServiceType {
    return ServiceType.BROWSER;
  }

  /**
   * Internal storage for room states
   * Maps room IDs to their respective state objects
   */
  private roomStates: Map<string, RoomState> = new Map();

  /**
   * Initialize the service
   * @param runtime - The agent runtime
   */
  async initialize(runtime: IAgentRuntime): Promise<void> {
    elizaLogger.debug("RoomStateManager: Initialized");
    // No special initialization needed, but method is required by Service interface
  }

  /**
   * Set course data for a specific room
   * @param roomId - The ID of the conversation room
   * @param courseData - The course data to store
   */
  setCourseData(roomId: string, courseData: CourseData): void {
    // Get existing state or create new one
    const state = this.getState(roomId);
    
    // Update the course data
    state.courseData = courseData;
    
    // Store updated state
    this.roomStates.set(roomId, state);
    
    elizaLogger.debug(`RoomStateManager: Course data set for room ${roomId}`, 
      JSON.stringify(courseData));
  }

  /**
   * Get course data for a specific room
   * @param roomId - The ID of the conversation room
   * @returns The course data or undefined if not found
   */
  getCourseData(roomId: string): CourseData | undefined {
    const state = this.roomStates.get(roomId);
    return state?.courseData;
  }

  /**
   * Fetch course data from MongoDB and store it in room state
   * @param runtime - The agent runtime
   * @param roomId - The ID of the conversation room
   * @param courseId - The ID of the course to fetch
   * @returns Promise resolving to the course data
   */
  async fetchCourseFromDB(runtime: IAgentRuntime, roomId: string, courseId: string): Promise<CourseData | undefined> {
    try {
      elizaLogger.debug(`RoomStateManager: Fetching course ${courseId} from database`);
      
      // Get course from database
      const courseDoc = await getCourseById(runtime, courseId);
      
      if (!courseDoc) {
        elizaLogger.debug(`RoomStateManager: Course ${courseId} not found in database`);
        return undefined;
      }
      
      // Transform MongoDB document to our CourseData format
      const courseData: CourseData = {
        hasCourseData: true,
        courseId: courseId,
        courseTitle: courseDoc.title || courseDoc.name || "Untitled Course",
        courseDescription: courseDoc.description || "",
        courseDifficulty: courseDoc.difficultyLevel || "Not specified",
        courseDuration: courseDoc.numberOfHours ? `${courseDoc.numberOfHours} hours` : "Unspecified",
        chapters: courseDoc.chapters || [],
        // Store the original document for complete access
        originalDoc: courseDoc
      };
      
      // Store in room state
      this.setCourseData(roomId, courseData);
      
      elizaLogger.debug(`RoomStateManager: Course fetched and stored for room ${roomId}`);
      return courseData;
    } catch (error) {
      elizaLogger.error(`RoomStateManager: Error fetching course from database:`, error);
      return undefined;
    }
  }

  /**
   * Check if a user has completed a course
   * This is a simplified implementation - in a real app you'd check the database
   * @param runtime - The agent runtime
   * @param roomId - The ID of the conversation room
   * @param userId - The user ID to check
   * @param courseId - The course ID to check
   * @returns Promise resolving to a boolean indicating completion status
   */
  async checkCourseCompletion(
    runtime: IAgentRuntime, 
    roomId: string, 
    userId: string, 
    courseId: string
  ): Promise<boolean> {
    try {
      elizaLogger.debug(`RoomStateManager: Checking if user ${userId} has completed course ${courseId}`);
      
      // Get current course data
      let courseData = this.getCourseData(roomId);
      
      // If we don't have course data, try to fetch it
      if (!courseData?.hasCourseData) {
        courseData = await this.fetchCourseFromDB(runtime, roomId, courseId);
        if (!courseData) {
          return false;
        }
      }
      
      // If the course data already has completion info, return it
      if (courseData.isCompleted !== undefined) {
        return courseData.isCompleted;
      }
      
      // Check progress - if 100%, consider the course completed
      if (courseData.progress === 100) {
        courseData.isCompleted = true;
        courseData.completionDate = new Date();
        this.setCourseData(roomId, courseData);
        return true;
      }
      
      // In a real implementation, you would query your database here
      // For this example, we'll just simulate a random check
      const isCompleted = Math.random() < 0.3; // 30% chance of being completed
      
      // Store the result for future reference
      courseData.isCompleted = isCompleted;
      if (isCompleted) {
        courseData.completionDate = new Date();
      }
      
      // Update the user ID
      courseData.userId = userId;
      
      // Save the updated course data
      this.setCourseData(roomId, courseData);
      
      return isCompleted;
    } catch (error) {
      elizaLogger.error(`RoomStateManager: Error checking course completion:`, error);
      return false;
    }
  }

  /**
   * Mark a course as completed
   * @param roomId - The ID of the conversation room
   * @param userId - The ID of the user who completed the course
   * @returns The updated course data
   */
  markCourseAsCompleted(roomId: string, userId: string): CourseData | undefined {
    const courseData = this.getCourseData(roomId);
    if (!courseData) {
      return undefined;
    }
    
    // Update course data
    courseData.isCompleted = true;
    courseData.completionDate = new Date();
    courseData.userId = userId;
    courseData.progress = 100;
    
    // Store the updated data
    this.setCourseData(roomId, courseData);
    
    elizaLogger.debug(`RoomStateManager: Course marked as completed for user ${userId} in room ${roomId}`);
    return courseData;
  }

  /**
   * Set a specific value in the room state
   * @param roomId - The ID of the conversation room
   * @param category - The category of state (e.g., 'quizData')
   * @param data - The data to store
   */
  setStateCategory(roomId: string, category: string, data: any): void {
    // Get existing state or create new one
    const state = this.getState(roomId);
    
    // Update the specific category
    state[category] = data;
    
    // Store updated state
    this.roomStates.set(roomId, state);
    
    elizaLogger.debug(`RoomStateManager: ${category} set for room ${roomId}`);
  }

  /**
   * Get a specific category of state for a room
   * @param roomId - The ID of the conversation room
   * @param category - The category to retrieve
   * @returns The requested data or undefined if not found
   */
  getStateCategory(roomId: string, category: string): any {
    const state = this.roomStates.get(roomId);
    return state?.[category];
  }

  /**
   * Get the entire state object for a room
   * @param roomId - The ID of the conversation room
   * @returns The complete room state or an empty object if not found
   */
  getState(roomId: string): RoomState {
    return this.roomStates.get(roomId) || {};
  }

  /**
   * Clear all state data for a specific room
   * @param roomId - The ID of the conversation room
   */
  clearState(roomId: string): void {
    this.roomStates.delete(roomId);
    elizaLogger.debug(`RoomStateManager: State cleared for room ${roomId}`);
  }

  /**
   * Check if course data exists for a specific room
   * @param roomId - The ID of the conversation room
   * @returns True if course data exists, false otherwise
   */
  hasCourseData(roomId: string): boolean {
    const courseData = this.getCourseData(roomId);
    return !!courseData?.hasCourseData;
  }

  /**
   * Update a specific field in the course data
   * @param roomId - The ID of the conversation room
   * @param field - The field to update
   * @param value - The new value
   */
  updateCourseField(roomId: string, field: string, value: any): void {
    const courseData = this.getCourseData(roomId) || { hasCourseData: true };
    courseData[field] = value;
    this.setCourseData(roomId, courseData);
  }

  /**
   * Update current chapter for progress tracking
   * @param roomId - The ID of the conversation room
   * @param chapterIndex - The index of the current chapter
   */
  updateCurrentChapter(roomId: string, chapterIndex: number): void {
    const courseData = this.getCourseData(roomId);
    if (courseData) {
      courseData.currentChapter = chapterIndex;
      courseData.progress = this.calculateProgress(courseData);
      this.setCourseData(roomId, courseData);
      
      elizaLogger.debug(`RoomStateManager: Updated current chapter to ${chapterIndex} for room ${roomId}`);
    }
  }

  /**
   * Calculate course progress based on current chapter and total chapters
   * @param courseData - The course data
   * @returns Progress as a percentage (0-100)
   */
  private calculateProgress(courseData: CourseData): number {
    if (!courseData.chapters || !courseData.chapters.length || courseData.currentChapter === undefined) {
      return 0;
    }
    
    return Math.min(100, Math.round((courseData.currentChapter / courseData.chapters.length) * 100));
  }

  /**
   * Set user ID for a room
   * This helps track which user is associated with this conversation
   * @param roomId - The ID of the conversation room
   * @param userId - The ID of the user
   */
  setUserId(roomId: string, userId: string): void {
    const state = this.getState(roomId);
    state.userId = userId;
    this.roomStates.set(roomId, state);
    
    elizaLogger.debug(`RoomStateManager: User ID ${userId} set for room ${roomId}`);
  }

  /**
   * Get user ID for a room
   * @param roomId - The ID of the conversation room
   * @returns The user ID or undefined if not found
   */
  getUserId(roomId: string): string | undefined {
    return this.roomStates.get(roomId)?.userId;
  }

  /**
   * Dump the state for debugging purposes
   * @param roomId - The ID of the conversation room
   * @returns A string representation of the room state
   */
  dumpState(roomId: string): string {
    const state = this.getState(roomId);
    return JSON.stringify(state, null, 2);
  }
}

/**
 * Export a singleton instance of the RoomStateManager
 * This ensures all imports use the same instance
 */
export const roomStateManager = new RoomStateManager(); 