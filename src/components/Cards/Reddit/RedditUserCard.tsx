import React from 'react';
import { RedditUser } from '../../../../RedditTypes'; // Verified path

interface RedditUserCardProps {
  user: RedditUser;
}

export const RedditUserCard: React.FC<RedditUserCardProps> = ({ user }) => {
  // Convert Unix timestamp (seconds) to milliseconds for Date constructor
  const cakeDayDate = new Date(user.cakeDay * 1000); 
  const formattedCakeDay = `${cakeDayDate.getFullYear()}-${String(cakeDayDate.getMonth() + 1).padStart(2, '0')}-${String(cakeDayDate.getDate()).padStart(2, '0')}`;

  return (
    <div className="bg-gray-800 text-white p-6 rounded-xl shadow-lg max-w-sm mx-auto my-4">
      <div className="flex items-center mb-4">
        {user.icon_img && (
          <img 
            src={user.icon_img} 
            alt={`${user.username}'s avatar`} 
            className="w-16 h-16 rounded-full mr-4 border-2 border-blue-500 object-cover" 
            onError={(e) => {
              // Fallback if image fails to load, e.g., broken link or 403 Forbidden
              const target = e.target as HTMLImageElement;
              target.onerror = null; // Prevent infinite loop if fallback also fails
              target.src = 'https://www.redditstatic.com/avatars/avatar_default_02_A5A4A4.png'; // Default Reddit avatar
              target.alt = `${user.username}'s default avatar`;
            }}
          />
        )}
        <h2 className="text-3xl font-bold text-blue-400">{user.username}</h2>
      </div>
      <div className="space-y-3 text-lg">
        <p><span className="font-semibold text-blue-300">Total Karma:</span> {user.totalKarma.toLocaleString()}</p>
        <p><span className="font-semibold text-blue-300">Post Karma:</span> {user.postKarma.toLocaleString()}</p>
        <p><span className="font-semibold text-blue-300">Comment Karma:</span> {user.commentKarma.toLocaleString()}</p>
        <p><span className="font-semibold text-blue-300">Cake Day:</span> {formattedCakeDay}</p>
      </div>
    </div>
  );
};
