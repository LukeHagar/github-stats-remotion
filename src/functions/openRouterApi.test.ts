import { getAIInsights, AIResponse } from './openRouterApi'; // Import AIResponse
import { UserStats } from '../Types';

// Mock the global fetch function
global.fetch = jest.fn();

// Mock process.env
const originalEnv = process.env;
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});


const mockUserStats: UserStats = {
    name: 'Test User',
    username: 'testuser',
    repoViews: 100,
    linesOfCodeChanged: 5000,
    totalCommits: 200,
    totalPullRequests: 50,
    codeByteTotal: 100000,
    topLanguages: [{ languageName: 'TypeScript', color: '#3178c6', value: 50000 }],
    forkCount: 10,
    starCount: 20,
    totalContributions: 300,
    closedIssues: 20,
    openIssues: 5,
    fetchedAt: Date.now(),
    contributionData: [{ contributionCount: 1, date: '2024-01-01' }],
    contributionsHistory: [], 
    issuePullRequests: [], 
    commitContributions: [], 
    pullRequestContributions: [], 
    repositoryContributions: [], 
    joinedGitHubAt: "2020-01-01T00:00:00Z", 
    followersCount: 100, 
    followingCount: 50, 
    repositoriesCount: 10, 
    gistsCount: 5, 
    readmeContent: "This is a test readme.",
    websiteUrl: "https://example.com", 
    twitterUsername: "testuser", 
    company: "Test Inc.", 
    location: "Test City", 
    bio: "Test bio", 
    avatarUrl: "https://example.com/avatar.png", 
    isHireable: true, 
    isCampusExpert: false, 
    isDeveloperProgramMember: false, 
    isVerified: false, 
    isSiteAdmin: false, 
    isGitHubStar: false, 
};

describe('getAIInsights', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    process.env = { ...originalEnv };
    consoleWarnSpy.mockClear();
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should return full AIResponse on successful API call with valid JSON', async () => {
    process.env.OPENROUTER_API_KEY = 'fake-api-key';
    const mockApiResponse: AIResponse = { // This is what the function should return
      insightsText: "This is a mock insight.",
      visualParams: {
        colors: ["#FF0000", "#00FF00", "#0000FF"],
        animationSpeed: "medium",
        animationIntensity: "moderate"
      }
    };
    // The LLM returns a string that needs to be parsed
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(mockApiResponse) } }],
      }),
    });

    const result = await getAIInsights(mockUserStats);
    expect(result).toEqual(mockApiResponse);
    expect(result.insightsText).toBe(mockApiResponse.insightsText);
    expect(result.visualParams).toEqual(mockApiResponse.visualParams);
    expect(fetch).toHaveBeenCalledTimes(1);
    
    // Check prompt structure
    const fetchCallArg = (fetch as jest.Mock).mock.calls[0][1];
    const body = JSON.parse(fetchCallArg.body);
    expect(body.messages[0].content).toContain("Please provide a response as a SINGLE JSON object");
    expect(body.messages[0].content).toContain("insightsText");
    expect(body.messages[0].content).toContain("visualParams");
    expect(body.messages[0].content).toContain(JSON.stringify(mockUserStats, null, 2));

  });
  
  it('should return AIResponse with null visualParams if LLM response has malformed visualParams (e.g. invalid speed)', async () => {
    process.env.OPENROUTER_API_KEY = 'fake-api-key';
    const mockLLMResponseContent = {
      insightsText: "Good insight here.",
      visualParams: { colors: ["#123456", "#abcdef", "#098765"], animationSpeed: "veryfast", animationIntensity: "calm" } // "veryfast" is invalid
    };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(mockLLMResponseContent) } }],
      }),
    });

    const result = await getAIInsights(mockUserStats);
    expect(result.insightsText).toBe("Good insight here.");
    expect(result.visualParams).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Visual parameters from LLM response are invalid or missing."));
  });

  it('should return AIResponse with null visualParams if visualParams.colors is not an array of 3-5 hex strings', async () => {
    process.env.OPENROUTER_API_KEY = 'fake-api-key';
    const mockLLMResponseContent = {
      insightsText: "Insightful text.",
      visualParams: { colors: ["#123", "invalid-hex", "#FF0000", "#00FF00", "#0000FF", "#AAAAAA"], animationSpeed: "medium", animationIntensity: "moderate" }
    };
     (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(mockLLMResponseContent) } }],
      }),
    });
    const result = await getAIInsights(mockUserStats);
    expect(result.insightsText).toBe("Insightful text.");
    expect(result.visualParams).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalled();
  });


  it('should return AIResponse with null visualParams if visualParams is missing entirely', async () => {
    process.env.OPENROUTER_API_KEY = 'fake-api-key';
    const mockLLMResponseContent = {
      insightsText: "Only text here.",
    };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(mockLLMResponseContent) } }],
      }),
    });

    const result = await getAIInsights(mockUserStats);
    expect(result.insightsText).toBe("Only text here.");
    expect(result.visualParams).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Visual parameters from LLM response are invalid or missing."));
  });

  it('should use raw content as insightsText and null visualParams if LLM response is not valid JSON but is a string', async () => {
    process.env.OPENROUTER_API_KEY = 'fake-api-key';
    const rawStringResponse = "This is just a plain string, not JSON.";
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: rawStringResponse } }],
      }),
    });

    const result = await getAIInsights(mockUserStats);
    expect(result.insightsText).toBe(rawStringResponse);
    expect(result.visualParams).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error parsing LLM response content:", expect.any(Error));
  });
  
  it('should throw error if LLM response is valid JSON but insightsText is missing and visualParams are invalid', async () => {
    process.env.OPENROUTER_API_KEY = 'fake-api-key';
    const mockLLMResponseContent = {
      // insightsText: "Missing", 
      visualParams: { colors: ["invalid"], animationSpeed: "super-fast" }
    };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(mockLLMResponseContent) } }],
      }),
    });

    await expect(getAIInsights(mockUserStats)).rejects.toThrow("LLM response is valid JSON but lacks expected 'insightsText' or valid 'visualParams'.");
  });


  it('should throw an error if API key is missing', async () => {
    delete process.env.OPENROUTER_API_KEY;
    await expect(getAIInsights(mockUserStats)).rejects.toThrow('OPENROUTER_API_KEY not found in environment variables');
  });

  it('should throw an error on API failure (non-ok response)', async () => {
    process.env.OPENROUTER_API_KEY = 'fake-api-key';
    const mockStatus = 500;
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: mockStatus,
    });
    await expect(getAIInsights(mockUserStats)).rejects.toThrow(`API request failed with status ${mockStatus}`);
  });

  it('should throw an error if LLM response structure is unexpected (missing choices.message.content)', async () => {
    process.env.OPENROUTER_API_KEY = 'fake-api-key';
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: {} }] }),
    });
    await expect(getAIInsights(mockUserStats)).rejects.toThrow('Invalid API response structure from LLM (no content)');
  });
  
  it('should throw an error if LLM response structure is unexpected (missing choices)', async () => {
    process.env.OPENROUTER_API_KEY = 'fake-api-key';
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}), // Missing choices array
    });
    await expect(getAIInsights(mockUserStats)).rejects.toThrow('Invalid API response structure from LLM (no content)');
  });


  it('should include HTTP-Referer and X-Title headers in the API call', async () => {
    process.env.OPENROUTER_API_KEY = 'fake-api-key';
    const mockApiResponse: AIResponse = {
      insightsText: "Headers check.",
      visualParams: { colors: ["#FF0000", "#00FF00", "#0000FF"], animationSpeed: "fast", animationIntensity: "energetic" }
    };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(mockApiResponse) } }],
      }),
    });

    await getAIInsights(mockUserStats);
    expect(fetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({
          'HTTP-Referer': 'https://github.com/Jurredr/github-readme-activity-graph', 
          'X-Title': 'GitHub Readme Activity Graph',
        }),
      })
    );
  });
});
