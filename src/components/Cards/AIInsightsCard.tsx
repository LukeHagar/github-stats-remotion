import React from "react";
// Removed useEffect, useState, UserStats, getAIInsights

interface AIInsightsCardProps {
  insightsText: string | null;
  isLoading: boolean;
  error: string | null;
}

const AIInsightsCard: React.FC<AIInsightsCardProps> = ({ insightsText, isLoading, error }) => {
  return (
    <div className="bg-[#282a36] p-4 rounded-lg shadow-lg text-[#f8f8f2] h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-2 text-center">AI-Powered Insights</h3>
      <div className="flex-grow flex items-center justify-center">
        {isLoading && <p>Loading AI insights...</p>}
        {error && <p className="text-red-400">{error}</p>}
        {insightsText && !isLoading && !error && (
          <p className="text-sm text-center">{insightsText}</p>
        )}
        {!isLoading && !error && !insightsText && (
            <p className="text-sm text-center">No insights available at the moment.</p>
        )}
      </div>
    </div>
  );
};

export default AIInsightsCard;
