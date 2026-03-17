// Active Users Avatars Component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User } from '../lib/collaboration';

interface ActiveUsersAvatarsProps {
  users: User[];
  maxDisplay?: number;
}

export const ActiveUsersAvatars: React.FC<ActiveUsersAvatarsProps> = ({ 
  users, 
  maxDisplay = 3 
}) => {
  if (users.length === 0) return null;

  const displayUsers = users.slice(0, maxDisplay);
  const remaining = users.length - maxDisplay;

  return (
    <View style={styles.container}>
      {displayUsers.map((user, index) => (
        <View 
          key={user.id} 
          style={[
            styles.avatar, 
            { marginLeft: index > 0 ? -8 : 0, zIndex: maxDisplay - index }
          ]}
        >
          <Text style={styles.avatarText}>{user.avatar || '👤'}</Text>
        </View>
      ))}
      {remaining > 0 && (
        <View style={[styles.avatar, styles.avatarMore, { marginLeft: -8 }]}>
          <Text style={styles.avatarText}>+{remaining}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1F2937',
  },
  avatarMore: {
    backgroundColor: '#6B7280',
  },
  avatarText: {
    fontSize: 12,
    color: '#fff',
  },
});

export default ActiveUsersAvatars;
