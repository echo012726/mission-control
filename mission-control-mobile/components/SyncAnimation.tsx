// Sync Animation Component - Brief flash when task is synced from remote
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SyncAnimationProps {
  triggered: boolean;
  onComplete?: () => void;
  children: React.ReactNode;
}

export const SyncAnimation: React.FC<SyncAnimationProps> = ({ 
  triggered, 
  onComplete,
  children 
}) => {
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (triggered) {
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start(() => {
        onComplete?.();
      });
    }
  }, [triggered]);

  const backgroundColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', 'rgba(59, 130, 246, 0.3)'],
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SyncAnimation;
