// Typing Indicator Component
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface TypingIndicatorProps {
  users: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (users.length > 0) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [users.length]);

  if (users.length === 0) return null;

  const userText = users.length === 1 
    ? `${users[0]} is typing`
    : `${users.length} people are typing`;

  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        <Animated.View 
          style={[
            styles.dot, 
            { opacity: bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }
          ]} 
        />
        <Animated.View 
          style={[
            styles.dot, 
            { opacity: bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) }
          ]} 
        />
        <Animated.View 
          style={[
            styles.dot, 
            { opacity: bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }
          ]} 
        />
      </View>
      <Text style={styles.text}>{userText}...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dots: {
    flexDirection: 'row',
    marginRight: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 2,
  },
  text: {
    color: '#9CA3AF',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default TypingIndicator;
