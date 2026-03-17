'use client';

import { useState, useEffect } from 'react';
import { isEncryptionEnabled, generateSalt } from '@/lib/encryption';

interface EncryptionSettingsProps {
  onComplete?: () => void;
}

export default function EncryptionSettings({ onComplete }: EncryptionSettingsProps) {
  const [enabled, setEnabled] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setEnabled(isEncryptionEnabled());
  }, []);

  const handleEnableEncryption = async () => {
    if (!password || password.length < 8) {
      setMessage('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const salt = generateSalt();
      localStorage.setItem('encryption-salt', salt);
      localStorage.setItem('encryption-password', password);
      localStorage.setItem('encryption-enabled', 'true');
      setEnabled(true);
      setMessage('Encryption enabled successfully!');
      onComplete?.();
    } catch (error) {
      setMessage('Failed to enable encryption');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableEncryption = () => {
    localStorage.removeItem('encryption-enabled');
    localStorage.removeItem('encryption-password');
    localStorage.removeItem('encryption-salt');
    setEnabled(false);
    setPassword('');
    setConfirmPassword('');
    setMessage('Encryption disabled');
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🔐 Data Encryption</h3>
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300">Status:</span>
          <span className={enabled ? 'text-green-400' : 'text-yellow-400'}>
            {enabled ? '✅ Enabled' : '❌ Disabled'}
          </span>
        </div>
        
        {enabled && (
          <p className="text-sm text-gray-400 mb-4">
            Your sensitive data (descriptions, comments, attachments) is encrypted with AES-256-GCM.
          </p>
        )}
      </div>

      {!enabled && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Encryption Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleEnableEncryption}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
          >
            {loading ? 'Enabling...' : 'Enable Encryption'}
          </button>
        </div>
      )}

      {enabled && (
        <button
          onClick={handleDisableEncryption}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
        >
          Disable Encryption
        </button>
      )}

      {message && (
        <p className="mt-3 text-sm text-gray-300">{message}</p>
      )}
    </div>
  );
}
