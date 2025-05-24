import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; 

import AIInsightsCard from './AIInsightsCard'; 
// Removed UserStats and openRouterApi imports as they are no longer used here.
// Removed jest.mock('../../functions/openRouterApi');
// Removed mockGetAIInsights and mockUserStats

describe('AIInsightsCard', () => {
  it('should display insights text when provided and not loading or in error', () => {
    render(<AIInsightsCard insightsText="This is a fantastic insight!" isLoading={false} error={null} />);
    expect(screen.getByText("This is a fantastic insight!")).toBeInTheDocument();
    expect(screen.queryByText('Loading AI insights...')).not.toBeInTheDocument();
    expect(screen.queryByText(/Could not load AI insights/i)).not.toBeInTheDocument(); // Example error text
    expect(screen.queryByText("No insights available at the moment.")).not.toBeInTheDocument();
  });

  it('should display loading state when isLoading is true', () => {
    render(<AIInsightsCard insightsText={null} isLoading={true} error={null} />);
    expect(screen.getByText('Loading AI insights...')).toBeInTheDocument();
    expect(screen.queryByText(/Could not load AI insights/i)).not.toBeInTheDocument();
    expect(screen.queryByText("No insights available at the moment.")).not.toBeInTheDocument();
  });

  it('should display error message when error prop is provided and not loading', () => {
    const errorMessage = "Failed to load insights due to an API error.";
    render(<AIInsightsCard insightsText={null} isLoading={false} error={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument(); // Check for the specific error message passed
    expect(screen.queryByText('Loading AI insights...')).not.toBeInTheDocument();
    expect(screen.queryByText("No insights available at the moment.")).not.toBeInTheDocument();
  });

  it('should display "No insights available." when insightsText is null, not loading, and no error', () => {
    render(<AIInsightsCard insightsText={null} isLoading={false} error={null} />);
    expect(screen.getByText("No insights available at the moment.")).toBeInTheDocument();
    expect(screen.queryByText('Loading AI insights...')).not.toBeInTheDocument();
    expect(screen.queryByText(/Could not load AI insights/i)).not.toBeInTheDocument();
  });

  it('should display the title "AI-Powered Insights" regardless of other props', () => {
    render(<AIInsightsCard insightsText="Some insights" isLoading={false} error={null} />);
    expect(screen.getByText('AI-Powered Insights')).toBeInTheDocument();
    
    render(<AIInsightsCard insightsText={null} isLoading={true} error={null} />);
    expect(screen.getByText('AI-Powered Insights')).toBeInTheDocument();

    render(<AIInsightsCard insightsText={null} isLoading={false} error="An error" />);
    expect(screen.getByText('AI-Powered Insights')).toBeInTheDocument();
    
    render(<AIInsightsCard insightsText={null} isLoading={false} error={null} />);
    expect(screen.getByText('AI-Powered Insights')).toBeInTheDocument();
  });

  it('should prioritize loading message over error message if both are technically possible (though unlikely state)', () => {
    render(<AIInsightsCard insightsText={null} isLoading={true} error="Some error" />);
    expect(screen.getByText('Loading AI insights...')).toBeInTheDocument();
    expect(screen.queryByText("Some error")).not.toBeInTheDocument();
  });
  
  it('should prioritize insights text over loading or error messages if text is present', () => {
    render(<AIInsightsCard insightsText="Actual insight here" isLoading={true} error="Some error" />);
    expect(screen.getByText("Actual insight here")).toBeInTheDocument();
    expect(screen.queryByText('Loading AI insights...')).not.toBeInTheDocument();
    expect(screen.queryByText("Some error")).not.toBeInTheDocument();
  });

});
