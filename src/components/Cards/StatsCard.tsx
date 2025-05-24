import { useEffect, useState, useMemo } from 'react'; // Added useMemo
import { 
    useCurrentFrame, 
    // useVideoConfig, // No longer directly used for fps in this component for Gemini animation
    // interpolate, // No longer directly used here
    useMotionValue, 
    animate, 
    motion 
} from 'remotion'; // Updated imports, useMotionValue, animate, motion added from remotion which re-exports framer-motion
import { UserStats } from '../../config'; // Assuming this is the correct UserStats path
import { AIInsightsCard } from './AIInsightsCard';
import { AnimatedCounter } from '../Effects/AnimatedCounter';
import { fadeInAndSlideUp } from '../../functions/animations';
import { formatBytes } from '../../functions/utils';
import { StatCard } from '../Effects/StatCard';
import { GoogleGeminiEffect } from '../Effects/Gemini'; // Added
import { getAIInsights, AIResponse } from '../../functions/openRouterApi'; // Added

const LanguageItem = ({ language, bytes, color }: {language: string, bytes: number, color: string}) => (
  <div className="flex items-center mb-2 p-2 bg-gray-700 rounded-lg">
    <div className={`w-4 h-4 rounded-full mr-2`} style={{ backgroundColor: color }}></div>
    <span className="text-sm flex-grow">{language}</span>
    <span className="text-sm font-semibold">{formatBytes(bytes)}</span>
  </div>
);

const CommitStreak = ({ streak }: {streak: number}) => (
  <svg viewBox="0 0 100 100" className="w-40 h-40">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path
      d="M50 10 A40 40 0 0 1 90 50 A40 40 0 0 1 50 90 A40 40 0 0 1 10 50 A40 40 0 0 1 50 10 Z"
      fill="none"
      stroke="url(#grad)"
      strokeWidth="4"
    />
    <path d="M50 20 L60 5 L40 5 Z" fill="#FFD700" />
    <text x="50" y="55" fontFamily="Arial" fontSize="20" fill="white" textAnchor="middle">
      <AnimatedCounter value={streak} duration={3} />
    </text>
    <text x="50" y="70" fontFamily="Arial" fontSize="10" fill="white" textAnchor="middle">
      Day Streak
    </text>
  </svg>
);

export function StatsContent({userStats}: {userStats: UserStats}) {
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true); // Renamed for clarity
  const frame = useCurrentFrame();

  // State for AI Insights
  const [aiData, setAiData] = useState<AIResponse | null>(null);
  const [isLoadingAiData, setIsLoadingAiData] = useState<boolean>(true);
  const [aiDataError, setAiDataError] = useState<string | null>(null);

  // useEffect to simulate initial data loading (e.g., userStats)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoadingInitialData(false), 1000); // Simulating userStats loading
    return () => clearTimeout(timer);
  }, []);

  // useEffect to fetch AI Data when userStats is available
  useEffect(() => {
    if (userStats) {
      setIsLoadingAiData(true);
      setAiDataError(null);
      getAIInsights(userStats)
        .then(data => {
          setAiData(data);
        })
        .catch(err => {
          console.error("Error fetching AI insights in StatsCard:", err);
          setAiDataError("Failed to load AI insights. " + (err.message || ""));
          setAiData(null); // Ensure aiData is null on error
        })
        .finally(() => {
          setIsLoadingAiData(false);
        });
    }
  }, [userStats]);

  // Manage and Animate pathLengths for GoogleGeminiEffect
  const pathLengths = useMemo(() => Array(5).fill(null).map(() => useMotionValue(0)), []);


  useEffect(() => {
    let allControls: Array<ReturnType<typeof animate>> = [];

    if (aiData && aiData.visualParams) {
      const { animationSpeed, animationIntensity } = aiData.visualParams;
      
      const currentSpeed = animationSpeed || 'medium';
      const currentIntensity = animationIntensity || 'moderate';

      let baseDuration = 2;
      let finalDuration = baseDuration;
      if (currentSpeed === 'slow') finalDuration = baseDuration * 1.5;
      else if (currentSpeed === 'fast') finalDuration = baseDuration * 0.75;

      let selectedEase: any = 'linear'; // Framer Motion 'any' type
      if (currentIntensity === 'calm') selectedEase = [0.42, 0, 0.58, 1]; // easeInOut
      else if (currentIntensity === 'energetic') selectedEase = [0.68, -0.55, 0.265, 1.55]; // easeInOutBack

      pathLengths.forEach((pl, index) => {
        // Ensure any previous animation on this motion value is stopped before starting a new one
        pl.stop(); 
        const controls = animate(pl, [0, 1, 0], {
          duration: finalDuration,
          ease: selectedEase,
          repeat: Infinity,
          repeatDelay: 0.5,
          delay: index * 0.3, // Stagger animations slightly
        });
        allControls.push(controls);
      });
    }

    return () => {
      allControls.forEach(controls => controls.stop());
      // Also explicitly stop motion values if cleanup happens before controls are populated
      pathLengths.forEach(pl => pl.stop());
    };
  }, [aiData, pathLengths]); // Depend on aiData and pathLengths memoization

  if (isLoadingInitialData) { // Still show initial loading for userStats if needed
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <p className="text-2xl">Loading GitHub stats...</p>
      </div>
    );
  }
  
  // Note: Framer Motion's `animate` function from "remotion" (which re-exports it)
  // might behave differently in Remotion context vs. typical React.
  // The pathLengths animation is designed for a typical Framer Motion setup.
  // If this runs in Remotion server-side rendering for a GIF,
  // continuous animations like `repeat: Infinity` won't work as expected.
  // This setup assumes a client-side interactive context for the Gemini effect.

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 overflow-hidden">
      {/* GoogleGeminiEffect as background */}
      {aiData && aiData.visualParams && (
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }} // Keep opacity lower for background
          transition={{ duration: 1 }}
        >
          <GoogleGeminiEffect
            pathLengths={pathLengths}
            colors={aiData.visualParams.colors}
            animationSpeed={aiData.visualParams.animationSpeed}
            animationIntensity={aiData.visualParams.animationIntensity}
            className="w-full h-full" // Ensure it fills the container
          />
        </motion.div>
      )}

      {/* Foreground content with higher z-index */}
      <div className="relative z-10 max-w-5xl w-full space-y-8">
        <h1
          className="text-5xl font-bold text-center mb-8"
          style={fadeInAndSlideUp(frame)} // Assuming fadeInAndSlideUp uses useCurrentFrame()
        >
          GitHub Profile Stats
        </h1>

        {/* AIInsightsCard now takes props */}
        <AIInsightsCard 
          insightsText={aiData?.insightsText ?? null} 
          isLoading={isLoadingAiData} 
          error={aiDataError} 
        />

        {/* Existing stat grids */}
        <div className="grid grid-cols-3 gap-6">
          <StatCard title="Total Stars" value={userStats.starCount} gradient="bg-gradient-to-br from-yellow-400/10 to-orange-500/10" delay={0.2} />
          <StatCard title="Total Forks" value={userStats.forkCount} gradient="bg-gradient-to-br from-green-400/10 to-blue-500/10" delay={0.6} />
          <StatCard title="Repo Views (2 weeks)" value={userStats.repoViews} gradient="bg-gradient-to-br from-purple-400/10 to-pink-500/10" delay={1.0} />
          <StatCard title="Total Commits" value={userStats.totalCommits} gradient="bg-gradient-to-br from-red-400/10 to-yellow-500/10" delay={1.4} />
          <StatCard title="Pull Requests" value={userStats.totalPullRequests} gradient="bg-gradient-to-br from-blue-400/10 to-indigo-500/10" delay={1.8} />
          <StatCard title="Total Contributions" value={userStats.totalContributions} gradient="bg-gradient-to-br from-green-400/10 to-teal-500/10" delay={2.2} />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div
            className="bg-[#282a36] text-[#f8f8f2] rounded-lg p-4 shadow-lg"
            style={fadeInAndSlideUp(frame)}
          >
            <h2 className="text-xl font-semibold mb-4 opacity-80">Issue Tracking</h2>
            <div className="flex justify-between mb-2">
              <span className="opacity-80">Issues Opened:</span>
              <span className="font-semibold"><AnimatedCounter value={userStats.openIssues} duration={3} /></span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="opacity-80">Issues Closed:</span>
              <span className="font-semibold"><AnimatedCounter value={userStats.closedIssues} duration={3} /></span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2 flex">
              <div 
                className="bg-green-600 h-2.5 rounded-l-full" 
                style={{ width: `${(userStats.closedIssues / (userStats.openIssues + userStats.closedIssues) > 0 ? (userStats.closedIssues / (userStats.openIssues + userStats.closedIssues)) * 100 : 0)}%` }}
              ></div>
              <div 
                className="bg-red-600 h-2.5 rounded-r-full" 
                style={{ width: `${(userStats.openIssues / (userStats.openIssues + userStats.closedIssues) > 0 ? (userStats.openIssues / (userStats.openIssues + userStats.closedIssues)) * 100 : 0)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>Closed</span>
              <span>Open</span>
            </div>
          </div>

          <div
            className="bg-[#282a36] text-[#f8f8f2] rounded-lg p-4 shadow-lg"
            style={fadeInAndSlideUp(frame)}
          >
            <h2 className="text-xl font-semibold mb-4 opacity-80">Code Metrics</h2>
            <div className="flex justify-between mb-2">
              <span className="opacity-80">Lines Changed:</span>
              <span className="font-semibold"><AnimatedCounter value={userStats.linesOfCodeChanged} duration={3} /></span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="opacity-80">Avg. Commits per PR:</span>
              <span className="font-semibold">
                <AnimatedCounter 
                  value={userStats.totalPullRequests > 0 ? Math.round(userStats.totalCommits / userStats.totalPullRequests) : 0} 
                  duration={3}
                />
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="opacity-80">Code Review Comments:</span>
              <span className="font-semibold">
                <AnimatedCounter value={userStats.codeReviewComments || 0} duration={3} /> {/* Assuming codeReviewComments is part of UserStats */}
              </span>
            </div>
          </div>

          <div
            className="bg-[#282a36] text-[#f8f8f2] rounded-lg p-4 shadow-lg"
            style={fadeInAndSlideUp(frame)}
          >
            <h2 className="text-xl font-semibold mb-4 opacity-80">Activity Overview</h2>
            <div className="flex justify-between mb-2">
              <span className="opacity-80">Active Days:</span>
              <span className="font-semibold"><AnimatedCounter value={userStats.activeDays || 0} duration={3} /></span> {/* Assuming activeDays is part of UserStats */}
            </div>
            <div className="flex justify-between mb-2">
              <span className="opacity-80">Repos Contributed To:</span>
              <span className="font-semibold"><AnimatedCounter value={userStats.reposContributedTo || 0} duration={3} /></span> {/* Assuming reposContributedTo is part of UserStats */}
            </div>
            <div className="flex justify-between mb-2">
              <span className="opacity-80">Longest Streak:</span>
              <span className="font-semibold"><AnimatedCounter value={userStats.longestStreak || 0} duration={3} /> days</span> {/* Assuming longestStreak is part of UserStats */}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div
            className="bg-[#282a36] text-[#f8f8f2] rounded-lg p-4 shadow-lg overflow-hidden relative"
            style={fadeInAndSlideUp(frame)}
          >
            <h2 className="text-xl font-semibold mb-4 opacity-80">Commit Streak</h2>
            <div className="flex items-center justify-center">
              <CommitStreak streak={userStats.commitStreak || 0} /> {/* Assuming commitStreak is part of UserStats */}
            </div>
          </div>

          <div
            className="bg-[#282a36] text-[#f8f8f2] rounded-lg p-4 shadow-lg"
            style={fadeInAndSlideUp(frame)}
          >
            <h2 className="text-xl font-semibold mb-4 opacity-80">Top Languages</h2>
            <div className="grid grid-cols-2 gap-2">
              {userStats.topLanguages.slice(0, 6).map((lang, index) => (
                <LanguageItem 
                  key={index} 
                  language={lang.languageName} 
                  bytes={lang.value} 
                  color={`hsl(${index * (360/6)}, 70%, 60%)`} // Adjusted color generation for more variety
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}