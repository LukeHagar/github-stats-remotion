import snoowrap from 'snoowrap';
import { RedditUser, redditUserSchema } from '../RedditTypes';

// Interface for Snoowrap credentials
interface SnoowrapCredentials {
  userAgent: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

/**
 * Fetches Reddit user statistics.
 * Currently returns mock data.
 * 
 * @param username The Reddit username.
 * @param credentials The Snoowrap API credentials.
 * @returns A Promise resolving to the RedditUser data.
 */
export async function fetchRedditStats(
  username: string,
  credentials: SnoowrapCredentials
): Promise<RedditUser> {
  // Commented-out Snoowrap initialization:
  // console.log('Initializing Snoowrap with userAgent:', credentials.userAgent); // Be careful logging sensitive info
  // const r = new snoowrap({
  //   userAgent: credentials.userAgent,
  //   clientId: credentials.clientId,
  //   clientSecret: credentials.clientSecret,
  //   refreshToken: credentials.refreshToken,
  // });

  // Placeholder for actual API call to fetch user data
  console.log(`Fetching Reddit stats for user: ${username}`);

  // Simulate API failure for a specific username
  if (username === "FAIL_USER") {
    // Simulate a delay for network request
    await new Promise(resolve => setTimeout(resolve, 500));
    throw new Error(`User "${username}" not found (simulated).`);
  }

  // Simulate API failure for a username that would cause validation error
  if (username === "INVALID_DATA_USER") {
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 500));
    const invalidMockUserData = {
      username: username,
      icon_img: 'not_a_url', // This will fail Zod URL validation
      totalKarma: "not_a_number", // This will fail Zod number validation
      postKarma: 3000,
      commentKarma: 2000,
      cakeDay: Math.floor(new Date('2022-03-15T10:00:00Z').getTime() / 1000),
    };
    try {
      // @ts-expect-error Deliberately passing invalid data
      const validatedData = redditUserSchema.parse(invalidMockUserData);
      return validatedData; // Should not reach here
    } catch (error) {
      console.error(`Validation error for ${username}:`, error);
      throw new Error(`Data validation failed for user "${username}" (simulated).`);
    }
  }
  
  // Mock data conforming to the RedditUser interface for successful cases
  const mockUserData: RedditUser = {
    username: username,
    icon_img: `https://www.redditstatic.com/avatars/avatar_default_${String(Math.floor(Math.random()*20)).padStart(2,'0')}_A5A4A4.png`, // Random default icon
    totalKarma: Math.floor(Math.random() * 10000),
    postKarma: Math.floor(Math.random() * 5000),
    commentKarma: Math.floor(Math.random() * 5000),
    cakeDay: Math.floor(new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365 * 3).getTime() / 1000), // Random cake day in last 3 years
  };

  // Simulate a delay for network request
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

  try {
    // Validate the mock data against the Zod schema
    const validatedData = redditUserSchema.parse(mockUserData);
    return validatedData;
  } catch (error) {
    console.error(`Reddit data validation error for ${username}:`, error);
    // Re-throw a more specific error for the caller to handle
    throw new Error(`Validation failed for mock Reddit user data for "${username}".`);
  }
}
