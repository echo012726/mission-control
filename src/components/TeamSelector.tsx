'use client';

import { useState, useEffect } from 'react';

interface Team {
  id: string;
  name: string;
  members: { id: string; name: string; userId: string; role: string }[];
}

interface TeamSelectorProps {
  onSelectTeam?: (teamId: string | null) => void;
  currentTeamId?: string | null;
}

export default function TeamSelector({ onSelectTeam, currentTeamId }: TeamSelectorProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const currentTeam = teams.find(t => t.id === currentTeamId);

  if (teams.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg w-full"
      >
        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
        <span className="truncate">
          {currentTeam ? currentTeam.name : 'All Tasks'}
        </span>
        <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-20">
            <button
              onClick={() => {
                onSelectTeam?.(null);
                setIsOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 text-sm w-full hover:bg-gray-100 dark:hover:bg-gray-700 ${
                !currentTeamId ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              All Tasks
            </button>
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => {
                  onSelectTeam?.(team.id);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 text-sm w-full hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  currentTeamId === team.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                {team.name}
                <span className="ml-auto text-xs text-gray-400">
                  {team.members.length}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
