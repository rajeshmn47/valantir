import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileCard = ({ profile }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/profile/${profile._id}`)}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">{profile.name}</h3>
          {profile.location && (
            <p className="text-gray-600 mt-1 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {profile.location}
            </p>
          )}
        </div>
        {profile.confidenceScore && (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            {Math.round(profile.confidenceScore * 100)}% confidence
          </span>
        )}
      </div>
      
      {profile.work && (
        <p className="text-gray-700 mt-3">
          <span className="font-medium">Work:</span> {profile.work}
        </p>
      )}
      
      {profile.skills && profile.skills.length > 0 && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2">
            {profile.skills.slice(0, 3).map((skill, idx) => (
              <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                {skill}
              </span>
            ))}
            {profile.skills.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                +{profile.skills.length - 3}
              </span>
            )}
          </div>
        </div>
      )}
      
      {profile.age && (
        <p className="text-gray-500 text-sm mt-3">Age: {profile.age}</p>
      )}
    </div>
  );
};

export default ProfileCard;