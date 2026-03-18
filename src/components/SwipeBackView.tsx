import React from 'react';
import { StyleSheet, Platform, View, useWindowDimensions } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';

interface SwipeBackViewProps {
  children: React.ReactNode;
  onSwipeBack: () => void;
  enabled?: boolean;
}

const SwipeBackView: React.FC<SwipeBackViewProps> = ({ children, onSwipeBack, enabled = true }) => {
  const { width } = useWindowDimensions();

  // iOS-style swipe back is usually from the left edge (first 40-50 pixels)
  const SWIPE_THRESHOLD = 50; 
  const VELOCITY_THRESHOLD = 500;

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    // Only handle on native platforms where it feels natural
    if (Platform.OS === 'web' || !enabled) return;

    const { translationX, velocityX, x } = event.nativeEvent;

    // Logic: If user starts near the left edge and swipes right with enough distance or speed
    if (event.nativeEvent.state === State.END) {
      if (translationX > width * 0.3 || (translationX > 50 && velocityX > VELOCITY_THRESHOLD)) {
        onSwipeBack();
      }
    }
  };

  if (Platform.OS === 'web' || !enabled) {
    return <View style={styles.container}>{children}</View>;
  }

  return (
    <PanGestureHandler
      onHandlerStateChange={onGestureEvent}
      activeOffsetX={[0, 10]} // Only activate when swiping right
      failOffsetY={[-20, 20]} // Fail if swiping up/down too much
    >
      <View style={styles.container}>
        {children}
      </View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SwipeBackView;
