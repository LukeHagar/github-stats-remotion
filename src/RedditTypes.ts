import { z } from 'zod';

// Interface for Reddit User Profile Data
export interface RedditUser {
  username: string;
  icon_img: string; 
  totalKarma: number;
  postKarma: number;
  commentKarma: number;
  cakeDay: number; // Unix timestamp (UTC)
}

// Zod schema for validating Reddit User Profile Data
export const redditUserSchema = z.object({
  username: z.string(),
  icon_img: z.string().url(),
  totalKarma: z.number(),
  postKarma: z.number(),
  commentKarma: z.number(),
  cakeDay: z.number(),
});

export type RedditUserStats = z.infer<typeof redditUserSchema>;
