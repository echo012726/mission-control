// Connection Status Badge Component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ConnectionStatusBadgeProps {
  connected: boolean;
}

export const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({ connected }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.dot, connected ? styles.connected : styles.offline]} />
      <Text style={styles.text}>{connected ? 'Live' : 'Offline'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connected: {
    backgroundColor: '#10B981',
  },
  offline: {
    backgroundColor: '#EF4444',
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ConnectionStatusBadge;
