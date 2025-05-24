import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
// motion is used by framer-motion, animate is what we are mocking.
// We don't need to import motion explicitly unless we are using <motion.div> in tests.
import { animate as fmAnimate } from 'framer-motion'; 

import { StatsContent } from './StatsCard'; 
import { UserStats } from '../../config'; // Path from StatsCard.tsx
import * as openRouterApi from '../../functions/openRouterApi';
import * as geminiEffectModule from '../Effects/Gemini'; // To mock GoogleGeminiEffect

// Mock the API module
jest.mock('../../functions/openRouterApi');
const mockGetAIInsights = openRouterApi.getAIInsights as jest.MockedFunction<typeof openRouterApi.getAIInsights>;

// Mock the Gemini Effect component
jest.mock('../Effects/Gemini', () => ({
  GoogleGeminiEffect: jest.fn(() => <div data-testid="mocked-gemini-effect"></div>),
}));
const mockGoogleGeminiEffect = geminiEffectModule.GoogleGeminiEffect as jest.MockedFunction<typeof geminiEffectModule.GoogleGeminiEffect>;


// Mock framer-motion's animate function
// Cast the module to any to allow overwriting animate
const mockStop = jest.fn();
jest.mock('framer-motion', () => {
  const originalFramerMotion = jest.requireActual('framer-motion');
  return {
    ...originalFramerMotion,
    animate: jest.fn(() => ({ stop: mockStop })), 
  };
});
const mockedFramerMotionAnimate = fmAnimate as jest.MockedFunction<typeof fmAnimate>;


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
    // Fields from StatsCard that might be used and need defaults
    codeReviewComments: 10,
    activeDays: 180,
    reposContributedTo: 25,
    longestStreak: 30,
    commitStreak: 20,
};

const mockAiResponse: openRouterApi.AIResponse = {
  insightsText: "Mocked AI insight text.",
  visualParams: {
    colors: ["#111111", "#222222", "#333333"],
    animationSpeed: "fast",
    animationIntensity: "energetic",
  }
};

// Helper to advance timers, e.g., for the initial data loading
jest.useFakeTimers();

describe('StatsContent', () => {
  beforeEach(() => {
    mockGetAIInsights.mockClear();
    mockGoogleGeminiEffect.mockClear();
    mockedFramerMotionAnimate.mockClear();
    mockStop.mockClear();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('shows initial loading state for userStats, then AI data loading', async () => {
    mockGetAIInsights.mockReturnValue(new Promise(() => {})); // AI fetch never resolves
    
    render(<StatsContent userStats={mockUserStats} />);
    // Initial loading state for userStats (simulated by StatsContent)
    expect(screen.getByText('Loading GitHub stats...')).toBeInTheDocument();

    // Advance timers to simulate userStats loading completion
    jest.advanceTimersByTime(1000); 

    // Now it should show loading for AI insights
    await waitFor(() => {
      expect(screen.getByText('Loading AI insights...')).toBeInTheDocument();
    });
  });


  it('shows error state if AI data fetching fails after initial load', async () => {
    mockGetAIInsights.mockRejectedValue(new Error("AI Fetch Failed"));
    render(<StatsContent userStats={mockUserStats} />);
    
    jest.advanceTimersByTime(1000); // Pass initial loading

    await waitFor(() => {
      // AIInsightsCard specific error message (from its own props handling)
      // The text "Failed to load AI insights. AI Fetch Failed" is what StatsContent sets.
      expect(screen.getByText(/Failed to load AI insights. AI Fetch Failed/i)).toBeInTheDocument();
    });
  });

  it('renders content, Gemini effect with AI data, and calls animate on successful fetch', async () => {
    mockGetAIInsights.mockResolvedValue(mockAiResponse);
    render(<StatsContent userStats={mockUserStats} />);

    jest.advanceTimersByTime(1000); // Pass initial loading

    await waitFor(() => {
      expect(screen.getByText(mockAiResponse.insightsText!)).toBeInTheDocument();
      expect(screen.getByTestId('mocked-gemini-effect')).toBeInTheDocument();
    });
    
    expect(mockGoogleGeminiEffect).toHaveBeenCalledWith(
      expect.objectContaining({
        colors: mockAiResponse.visualParams?.colors,
        animationSpeed: mockAiResponse.visualParams?.animationSpeed,
        animationIntensity: mockAiResponse.visualParams?.animationIntensity,
        pathLengths: expect.arrayContaining([expect.objectContaining({ get: expect.any(Function) })]),
      }),
      expect.anything()
    );

    expect(mockedFramerMotionAnimate).toHaveBeenCalledTimes(5); 
    const expectedFastDuration = 1.5; // from 'fast' (base 2 * 0.75)
    const expectedEnergeticEase = [0.68, -0.55, 0.265, 1.55]; // from 'energetic'
    
    // Check the first call as a sample
    expect(mockedFramerMotionAnimate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ get: expect.any(Function), set: expect.any(Function) }), // the motion value
      [0, 1, 0],      
      expect.objectContaining({
        duration: expectedFastDuration,
        ease: expectedEnergeticEase,
        repeat: Infinity,
        repeatDelay: 0.5,
        delay: 0 * 0.3, // delay for the first path
      })
    );
    // Check a subsequent call to ensure delay changes
     expect(mockedFramerMotionAnimate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ get: expect.any(Function), set: expect.any(Function) }), // the motion value
      [0, 1, 0],      
      expect.objectContaining({
        duration: expectedFastDuration,
        ease: expectedEnergeticEase,
        repeat: Infinity,
        repeatDelay: 0.5,
        delay: 1 * 0.3, // delay for the second path
      })
    );
  });

  it('renders standard stat cards irrespective of AI data success', async () => {
    mockGetAIInsights.mockResolvedValue(mockAiResponse); 
    render(<StatsContent userStats={mockUserStats} />);
    
    jest.advanceTimersByTime(1000); // Pass initial loading

    await waitFor(() => { 
      expect(screen.getByText(mockAiResponse.insightsText!)).toBeInTheDocument(); // Ensure AI data loaded
    });
    // Check for a couple of StatCard titles (these are rendered by StatCard component itself)
    expect(screen.getByText('Total Stars')).toBeInTheDocument();
    expect(screen.getByText('Total Forks')).toBeInTheDocument();
    // Check for a non-StatCard element that should be present
    expect(screen.getByText('GitHub Profile Stats')).toBeInTheDocument();
  });

  it('does not call animate if visualParams are null', async () => {
    const aiResponseWithoutVisuals: openRouterApi.AIResponse = {
      insightsText: "Only text, no visuals.",
      visualParams: null,
    };
    mockGetAIInsights.mockResolvedValue(aiResponseWithoutVisuals);
    render(<StatsContent userStats={mockUserStats} />);

    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText(aiResponseWithoutVisuals.insightsText!)).toBeInTheDocument();
    });
    expect(mockGoogleGeminiEffect).not.toHaveBeenCalled(); // Effect shouldn't render if no visualParams
    expect(mockedFramerMotionAnimate).not.toHaveBeenCalled();
  });
  
  it('calls stop on animation controls during cleanup', async () => {
    mockGetAIInsights.mockResolvedValue(mockAiResponse);
    const { unmount } = render(<StatsContent userStats={mockUserStats} />);
    
    jest.advanceTimersByTime(1000); // Pass initial loading

    await waitFor(() => {
      expect(mockedFramerMotionAnimate).toHaveBeenCalledTimes(5);
    });

    unmount();
    expect(mockStop).toHaveBeenCalledTimes(5); // One stop per animate call
  });

});
