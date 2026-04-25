import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { ViewStyle, StyleProp } from 'react-native';

interface AnimatedFadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  offsetY?: number; // How much it moves up from
  style?: StyleProp<ViewStyle>;
}

export function AnimatedFadeIn({ children, delay = 0, duration = 800, offsetY = 50, style }: AnimatedFadeInProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(offsetY);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  useEffect(() => {
    // Garante que delay e duration são números válidos.
    // Isso lida com casos onde `delay` ou `duration` podem ser explicitamente passados como `null`, `undefined`, ou `NaN`.
    const safeDelay = typeof delay === 'number' && !isNaN(delay) ? delay : 0;
    const safeDuration = typeof duration === 'number' && !isNaN(duration) ? duration : 800;

    opacity.value = withDelay(safeDelay, withTiming(1, { duration: safeDuration }));
    translateY.value = withDelay(safeDelay, withTiming(0, { duration: safeDuration }));
  }, []); // Lista de dependências vazia para garantir que a animação rode apenas uma vez na montagem

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}