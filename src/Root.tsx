import {CalculateMetadataFunction, Composition, getInputProps} from 'remotion';
import React, { useEffect, useState } from 'react'; // Added React, useEffect, useState
import './style.css';

import {getUserStats} from './functions/setup';
import {Config, MainProps, mainSchema} from './config';
import {defaultStats} from './defaultStats';
import {Card} from './components/Effects/Card';
import {cards} from './components/Cards';

// Imports for Reddit Stats
import { fetchRedditStats } from './functions/redditApi';
import { RedditUserCard } from './components/Cards/Reddit/RedditUserCard';
import { RedditUser } from './RedditTypes';
// import { z } from 'zod'; // z is available via mainSchema from config

const {FPS, DurationInFrames} = Config;

// Define a type for the items in redditUsersData state
type RedditUserDataItem = RedditUser | { username: string; error: string };

// New component for Reddit Stats Composition
const RedditStatsComposition: React.FC<MainProps> = (props) => {
  const [redditUsersData, setRedditUsersData] = useState<RedditUserDataItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState<boolean>(false);
  const [credentialError, setCredentialError] = useState<string | null>(null);

  useEffect(() => {
    const loadRedditData = async () => {
      setIsLoading(true);
      setHasAttemptedFetch(true);
      setCredentialError(null); // Reset credential error on new load attempt

      const redditUsernamesFromProps = props.redditUsernames;

      // Fetch credentials from environment variables
      const credentials = {
        userAgent: process.env.REDDIT_USER_AGENT,
        clientId: process.env.REDDIT_CLIENT_ID,
        clientSecret: process.env.REDDIT_CLIENT_SECRET,
        refreshToken: process.env.REDDIT_REFRESH_TOKEN,
      };

      // Check for missing credentials
      const missingCredentials = Object.entries(credentials)
        .filter(([key, value]) => !value)
        .map(([key]) => key.replace(/([A-Z])/g, '_$1').toUpperCase()); // Convert camelCase/PascalCase to SCREAMING_SNAKE_CASE for env var names

      if (missingCredentials.length > 0) {
        const errorMessage = `Error: Missing Reddit API credentials in environment variables. Please set: ${missingCredentials.join(', ')}.`;
        setCredentialError(errorMessage);
        console.error(errorMessage);
        setIsLoading(false);
        setRedditUsersData([]); // Ensure no data is displayed
        return; // Stop fetching if credentials are missing
      }
      
      console.log(
        "Attempting to use Reddit API credentials from environment variables " +
        "(REDDIT_USER_AGENT, REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_REFRESH_TOKEN)."
      );

      if (redditUsernamesFromProps && redditUsernamesFromProps.length > 0) {
        // Ensure credentials are all strings for fetchRedditStats
        const validatedCredentials = {
            userAgent: credentials.userAgent as string,
            clientId: credentials.clientId as string,
            clientSecret: credentials.clientSecret as string,
            refreshToken: credentials.refreshToken as string,
        };

        const usersDataPromises = redditUsernamesFromProps.map(async (username) => {
          try {
            const data = await fetchRedditStats(username, validatedCredentials);
            return data; // Successfully fetched data
          } catch (error) {
            let errorMessageText = 'An unknown error occurred.';
            if (error instanceof Error) {
              errorMessageText = error.message;
            }
            console.error(`Failed to fetch Reddit stats for ${username}:`, errorMessageText);
            return { username: username, error: errorMessageText }; // Error object for this user
          }
        });
        
        const settledUsersData = await Promise.all(usersDataPromises);
        setRedditUsersData(settledUsersData);

      } else {
        setRedditUsersData([]); // Clear if no usernames
      }
      setIsLoading(false);
    };

    // Only run if there are usernames to fetch or if it's the initial load triggered by props change
    if (props.redditUsernames && props.redditUsernames.length > 0) {
      loadRedditData();
    } else {
      setIsLoading(false); // No usernames, so not loading
      setRedditUsersData([]); // Ensure data is empty
      setHasAttemptedFetch(true); // Mark as attempted even if no usernames
    }
  }, [props.redditUsernames]); // Dependency array based on props

  if (credentialError) {
    return (
      <div className="flex flex-col justify-center items-center h-full bg-gray-900 text-white p-8">
        <svg className="w-16 h-16 text-red-500 mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <h2 className="text-3xl font-bold text-red-400 mb-2 text-center">Credential Error</h2>
        <p className="text-lg text-red-300 text-center">{credentialError}</p>
        <p className="text-md text-gray-400 mt-4 text-center">Please ensure all required Reddit API environment variables are correctly set.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full bg-gray-900 text-white">
        <p className="text-2xl animate-pulse">Loading Reddit User Statistics...</p>
      </div>
    );
  }

  if (hasAttemptedFetch && !redditUsersData.length && (!props.redditUsernames || props.redditUsernames.length === 0)) {
    return (
      <div className="flex justify-center items-center h-full bg-gray-900 text-white">
        <p className="text-xl">No Reddit usernames provided to fetch statistics.</p>
      </div>
    );
  }
  
  if (hasAttemptedFetch && !redditUsersData.length && props.redditUsernames && props.redditUsernames.length > 0) {
     return (
      <div className="flex justify-center items-center h-full bg-gray-900 text-white">
        <p className="text-xl">No Reddit data found or all users failed to load. Check console for errors.</p>
      </div>
    );
  }


  // Check if all items in redditUsersData are errors
  const allFailed = redditUsersData.length > 0 && redditUsersData.every(item => 'error' in item);

  if (allFailed) {
    return (
      <div className="bg-gray-900 min-h-full p-4 flex flex-col items-center justify-center text-white">
        <h1 className="text-5xl font-bold my-8 text-center">Reddit User Statistics</h1>
        <p className="text-xl text-red-400">All attempts to fetch Reddit user data failed. Please check the usernames or try again later.</p>
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center mt-4">
          {redditUsersData.map((item) => (
             <div key={item.username} className="bg-red-800 border border-red-600 text-white p-4 rounded-lg shadow-md w-full max-w-sm">
               <h3 className="text-xl font-semibold text-red-300">@{item.username}</h3>
               <p className="text-sm text-red-200 mt-2">Error: {(item as {error: string}).error}</p>
             </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-full p-4 flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold text-white my-8 text-center">Reddit User Statistics</h1>
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
        {redditUsersData.map((item) => {
          if ('error' in item) {
            // Render error state for this specific user
            return (
              <div key={item.username} className="bg-red-700 border border-red-500 text-white p-6 rounded-xl shadow-lg w-full max-w-sm">
                <div className="flex items-center mb-3">
                  <svg className="w-8 h-8 text-red-300 mr-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <h3 className="text-2xl font-bold text-red-200">{item.username}</h3>
                </div>
                <p className="text-red-100">Error: {item.error}</p>
                <p className="text-xs text-red-200 mt-2">Could not load stats for this user.</p>
              </div>
            );
          }
          // Render successful card
          return <RedditUserCard key={item.username} user={item} />;
        })}
      </div>
    </div>
  );
};

export const RemotionRoot = () => {
	const calculateMetadata: CalculateMetadataFunction<MainProps> = async (
		remotionProps // Renamed to avoid conflict with component props
	) => {
		// getInputProps() is the correct way to get input props for calculateMetadata
		const inputProps = getInputProps() as Partial<MainProps>; 
		const usernames = inputProps.usernames; // from input.json (GitHub usernames)
		// redditUsernames should also come from inputProps if passed via -P to CLI or from input.json
		const redditUsernames = inputProps.redditUsernames; 

		let userStats = defaultStats;
		if (usernames && usernames.length > 0) {
			userStats = await getUserStats(usernames);
		}

		// The props returned here are passed to all compositions that use this calculateMetadata
		return {
			props: {
				...remotionProps, // Keep existing remotionProps
				userStats, // For existing cards
				redditUsernames: redditUsernames || [], // Ensure it's an array for RedditStatsComposition
				// redditStats could be pre-fetched here if needed, but task asks for useEffect in component
			},
		};
	};

	return (
		<>
			{/* Existing Compositions */}
			{cards.map(({id, component: Component, height, width = 500}) => (
				<Composition
					key={id}
					id={id}
					component={(compProps: MainProps) => ( // Explicitly type compProps
						<Card userStats={compProps.userStats}>
							<Component userStats={compProps.userStats} />
						</Card>
					)}
					durationInFrames={DurationInFrames}
					fps={FPS}
					width={width}
					height={height}
					schema={mainSchema}
					calculateMetadata={calculateMetadata} // This function now also prepares redditUsernames
					defaultProps={{
						userStats: defaultStats,
						redditUsernames: [], // Default for redditUsernames
						// Initialize other fields of MainProps if necessary
					}}
				/>
			))}

			{/* New Composition for Reddit Stats */}
			<Composition
				id="RedditStats"
				component={RedditStatsComposition} // Use the new component
				durationInFrames={DurationInFrames} // Or a custom duration
				fps={FPS}
				width={1920} // Example width
				height={1080} // Example height
				schema={mainSchema} // Use the same schema, it includes redditUsernames
				calculateMetadata={calculateMetadata} // Reuse if props like redditUsernames are needed from input
				defaultProps={{
					userStats: defaultStats, // Can be default or specific if needed
					redditUsernames: (getInputProps() as MainProps)?.redditUsernames || ['spez'], // Default from input.json or a fallback
					// Initialize other fields of MainProps if necessary
				}}
			/>
		</>
	);
};
