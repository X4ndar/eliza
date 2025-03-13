import { ObjectId } from "mongodb";
import type { IAgentRuntime } from "@elizaos/core";
import { elizaLogger } from "@elizaos/core";

/**
 * Retrieves the actual MongoDB database object from the runtime's adapter.
 * Assumes the adapter has a property called `database` that holds the DB instance.
 */
function getMongoDatabase(runtime: IAgentRuntime) {
  const adapter = runtime.databaseAdapter as any;
  if (!adapter) {
    throw new Error("No database adapter is configured in the runtime.");
  }
  if (!adapter.database) {
    throw new Error("The adapter is missing 'database'. Did you call init()?");
  }
  return adapter.database; // The real MongoDB database object
}

/* -------------------------------------------------------------------------- */
/*                              Course Section                                */
/* -------------------------------------------------------------------------- */

/**
 * Example interface for a Course document. Adjust fields as needed.
 */
export interface CourseDoc {
  _id: ObjectId;
  icon?: string;
  difficultyLevel?: string;
  numberOfHours?: number;
  title?: string;
  description?: string;
  teacherId?: ObjectId;
  studentCount?: number;
  completedCount?: number;
  free?: boolean;
  price?: number;
  name?: string;
  domainName?: string;
  categoryName?: string;
  subCategoryName?: string;
  visibility?: boolean;
  chapters?: Array<unknown>;
  // Add or remove fields to match your schema
}


/**
 * Retrieves a course from the "Course" collection by its MongoDB _id.
 * Throws an error if no document is found for the given _id.
 *
 * @param runtime - The agent runtime, which has access to the connected database adapter.
 * @param courseId - The _id of the course as a string.
 * @returns The matching CourseDoc if found.
 * @throws Error if the course is not found or if the database call fails.
 */
export async function getCourseById(
  runtime: IAgentRuntime,
  courseId: string
): Promise<CourseDoc> {
  try {
    const db = getMongoDatabase(runtime);
    const _id = new ObjectId(courseId);

    const course = await db.collection("Course").findOne({ _id });
    if (!course) {
      // If no course is found, throw an error
      throw new Error(`Not a valid course id: ${courseId}`);
    }

    return course as CourseDoc;
  } catch (error) {
    elizaLogger.error("Error fetching course by _id:", error);
    throw error; // Re-throw so calling code can handle it
  }
}

/* -------------------------------------------------------------------------- */
/*                                User Section                                */
/* -------------------------------------------------------------------------- */

/**
 * Example interface for a User document. Adjust fields as needed.
 */
export interface UserDoc {
  _id: ObjectId;
  name: string;
  email: string;
  password?: string;
  role?: string;
  // Add or remove fields to match your schema
}

/**
 * Retrieves a user from the "User" collection by its MongoDB _id.
 * Returns null if not found.
 *
 * @param runtime - The agent runtime, which has access to the connected database adapter.
 * @param userId - The _id of the user as a string.
 * @returns The matching UserDoc if found, otherwise null.
 */
export async function getUserById(
  runtime: IAgentRuntime,
  userId: string
): Promise<UserDoc | null> {
  try {
    const db = getMongoDatabase(runtime);
    const _id = new ObjectId(userId);

    const user = await db.collection("User").findOne({ _id });
    return user as UserDoc | null;
  } catch (error) {
    elizaLogger.error("Error fetching user by _id:", error);
    return null;
  }
}
