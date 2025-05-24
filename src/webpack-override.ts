import {enableTailwind} from '@remotion/tailwind';
import {WebpackOverrideFn} from '@remotion/bundler';
import webpack from 'webpack'; // Added
import dotenv from 'dotenv'; // Added

// Load .env variables for use in this webpack config if needed, and for EnvironmentPlugin
dotenv.config();

export const webpackOverride: WebpackOverrideFn = (currentConfiguration) => {
  const withTailwind = enableTailwind(currentConfiguration);
  
  // Add EnvironmentPlugin to expose specific env variables
  withTailwind.plugins = [
    ...(withTailwind.plugins || []),
    new webpack.EnvironmentPlugin(['OPENROUTER_API_KEY'])
  ];
  
  return withTailwind;
};
