'use client';

import { useState, useEffect } from 'react';

interface Team {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  members: TeamMember[];
  _count?: { sharedTasks: number };
}

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  role: string;
  avatarUrl: string | null;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });
  const [newMember, setNewMember] = useState({ userId: '', name: '', role: 'member' });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      setTeams(data);
      if (data.length > 0 && !selectedTeam) {
        setSelectedTeam(data[0]);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async () => {
    if (!newTeam.name.trim()) return;
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam),
      });
      if (res.ok) {
        const team = await res.json();
        setTeams([...teams, team]);
        setSelectedTeam(team);
        setShowCreateModal(false);
        setNewTeam({ name: '', description: '' });
      }
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const deleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    try {
      await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
      setTeams(teams.filter(t => t.id !== teamId));
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(teams.length > 1 ? teams[0] : null);
      }
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const addMember = async () => {
    if (!newMember.userId.trim() || !newMember.name.trim() || !selectedTeam) return;
    try {
      const res = await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      });
      if (res.ok) {
        const member = await res.json();
        setSelectedTeam({
          ...selectedTeam,
          members: [...selectedTeam.members, member],
        });
        setShowMemberModal(false);
        setNewMember({ userId: '', name: '', role: 'member' });
      }
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!selectedTeam || !confirm('Remove this member?')) return;
    try {
      await fetch(`/api/teams/${selectedTeam.id}/members/${memberId}`, {
        method: 'DELETE',
      });
      setSelectedTeam({
        ...selectedTeam,
        members: selectedTeam.members.filter(m => m.id !== memberId),
      });
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const updateMemberRole = async (memberId: string, role: string) => {
    if (!selectedTeam) return;
    try {
      await fetch(`/api/teams/${selectedTeam.id}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      setSelectedTeam({
        ...selectedTeam,
        members: selectedTeam.members.map(m =>
          m.id === memberId ? { ...m, role } : m
        ),
      });
    } catch (error) {
      console.error('Error updating member:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teams</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Create Team
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No teams yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Create Your First Team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teams List */}
          <div className="lg:col-span-1 space-y-2">
            {teams.map(team => (
              <div
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedTeam?.id === team.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-500'
                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{team.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {team.members.length} members
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteTeam(team.id); }}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Delete team"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Team Details */}
          <div className="lg:col-span-2">
            {selectedTeam ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedTeam.name}
                    </h2>
                    {selectedTeam.description && (
                      <p className="text-gray-500 dark:text-gray-400">
                        {selectedTeam.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowMemberModal(true)}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                  >
                    + Add Member
                  </button>
                </div>

                {/* Members List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                    Members ({selectedTeam.members.length})
                  </h3>
                  {selectedTeam.members.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No members yet. Add someone to get started.
                    </p>
                  ) : (
                    selectedTeam.members.map(member => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {member.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {member.userId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={member.role}
                            onChange={(e) => updateMemberRole(member.id, e.target.value)}
                            className="text-sm border rounded px-2 py-1 dark:bg-gray-600 dark:border-gray-500"
                          >
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="guest">Guest</option>
                          </select>
                          <button
                            onClick={() => removeMember(member.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500">
                Select a team to view details
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Create New Team
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., Marketing Team"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="What is this team for?"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={createTeam}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Add Team Member
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email / User ID
                </label>
                <input
                  type="text"
                  value={newMember.userId}
                  onChange={(e) => setNewMember({ ...newMember, userId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="guest">Guest</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowMemberModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={addMember}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
