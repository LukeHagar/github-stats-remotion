import { UserStats } from "../Types";

export interface AIResponse {
  insightsText: string | null;
  visualParams: {
    colors: string[];
    animationSpeed: 'slow' | 'medium' | 'fast';
    animationIntensity: 'calm' | 'moderate' | 'energetic';
  } | null;
}

const isValidAnimationSpeed = (speed: any): speed is 'slow' | 'medium' | 'fast' => {
  return ['slow', 'medium', 'fast'].includes(speed);
}

const isValidAnimationIntensity = (intensity: any): intensity is 'calm' | 'moderate' | 'energetic' => {
  return ['calm', 'moderate', 'energetic'].includes(intensity);
}

export const getAIInsights = async (userStats: UserStats): Promise<AIResponse> => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    // Return a specific structure or throw, based on desired handling for this case.
    // For now, throwing an error similar to before.
    throw new Error("OPENROUTER_API_KEY not found in environment variables");
  }

  const prompt = `
Based on the following GitHub user statistics:
${JSON.stringify(userStats, null, 2)}

Please provide a response as a SINGLE JSON object with two top-level keys:
1. "insightsText": A 2-3 sentence natural language summary highlighting key achievements or interesting patterns. Make the tone encouraging and engaging.
2. "visualParams": A JSON object containing the following keys:
   - "colors": An array of 3 to 5 hex color strings that would visually represent the user's activity profile (e.g., considering dominant languages, activity level).
   - "animationSpeed": A string, either "slow", "medium", or "fast", reflecting the tempo of user's general activity.
   - "animationIntensity": A string, either "calm", "moderate", or "energetic", reflecting the intensity of user's contributions.

Example of the desired JSON output format:
{
  "insightsText": "You've had a productive period with significant contributions in TypeScript!",
  "visualParams": {
    "colors": ["#3178c6", "#f1e05a", "#4CAF50", "#FF5722"],
    "animationSpeed": "medium",
    "animationIntensity": "moderate"
  }
}
`;

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/Jurredr/github-readme-activity-graph", 
          "X-Title": "GitHub Readme Activity Graph", 
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct", 
          messages: [{ role: "user", content: prompt }],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (
      !data.choices ||
      data.choices.length === 0 ||
      !data.choices[0].message ||
      !data.choices[0].message.content
    ) {
      throw new Error("Invalid API response structure from LLM (no content)");
    }

    const content = data.choices[0].message.content.trim();
    let parsedContent: any;

    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error("Error parsing LLM response content:", parseError);
      // If parsing fails, attempt to see if the raw content is usable as insightsText
      // This is a fallback if the LLM failed to produce valid JSON but gave some text.
      if (typeof content === 'string' && content.length > 0) {
        return { insightsText: content, visualParams: null };
      }
      throw new Error("Failed to parse LLM response as JSON and no usable text content.");
    }

    let insightsText: string | null = null;
    if (typeof parsedContent.insightsText === 'string') {
      insightsText = parsedContent.insightsText;
    }

    let visualParams: AIResponse['visualParams'] = null;
    if (
      parsedContent.visualParams &&
      typeof parsedContent.visualParams === 'object' &&
      Array.isArray(parsedContent.visualParams.colors) &&
      parsedContent.visualParams.colors.every((c: any) => typeof c === 'string' && /^#[0-9A-Fa-f]{6}$/.test(c)) &&
      parsedContent.visualParams.colors.length >= 3 &&
      parsedContent.visualParams.colors.length <= 5 &&
      isValidAnimationSpeed(parsedContent.visualParams.animationSpeed) &&
      isValidAnimationIntensity(parsedContent.visualParams.animationIntensity)
    ) {
      visualParams = {
        colors: parsedContent.visualParams.colors,
        animationSpeed: parsedContent.visualParams.animationSpeed,
        animationIntensity: parsedContent.visualParams.animationIntensity,
      };
    } else {
      console.warn("Visual parameters from LLM response are invalid or missing. Proceeding without them.");
    }
    
    if (insightsText === null && visualParams === null) {
        throw new Error("LLM response is valid JSON but lacks expected 'insightsText' or valid 'visualParams'.");
    }


    return { insightsText, visualParams };

  } catch (error) {
    console.error("Error fetching AI insights:", error);
    // Ensure a consistent error response or re-throw
    // If we want to return a specific AIResponse structure on error:
    // return { insightsText: `Error: ${error.message}`, visualParams: null };
    throw error; 
  }
};
