import React, { useEffect, useState } from 'react';
import { Text, type TextProps } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedReaction, withSpring, interpolate, Extrapolation, runOnJS } from 'react-native-reanimated';

const AnimatedText = Animated.createAnimatedComponent(Text);

interface AnimatedNumberProps extends TextProps {
  value: number;
  decimals?: number;
  duration?: number;
  /** Animación tipo "odómetro": cuando cambia el valor, hace un salto con overshoot */
  odometer?: boolean;
  /** Separador de miles */
  separator?: boolean;
}

/** Número con conteo animado estilo instrumento (spring con overshoot). */
export default function AnimatedNumber({
  value,
  decimals = 0,
  duration = 350,
  odometer = true,
  separator = false,
  style,
  ...rest
}: AnimatedNumberProps) {
  const progress = useSharedValue(1);
  const prevValueShared = useSharedValue(value);
  const targetValueShared = useSharedValue(value);
  const [display, setDisplay] = useState(value.toFixed(decimals));

  useEffect(() => {
    prevValueShared.value = targetValueShared.value;
    targetValueShared.value = value;
    progress.value = 0;
    progress.value = withSpring(1, {
      duration,
      dampingRatio: 0.8,
      mass: 0.9,
      overshootClamping: false,
    });
  }, [value, duration, progress, prevValueShared, targetValueShared]);

  useAnimatedReaction(
    () => progress.value,
    (p) => {
      const v = interpolate(p, [0, 1], [prevValueShared.value, targetValueShared.value], Extrapolation.CLAMP);
      const text = v.toFixed(decimals);
      runOnJS(setDisplay)(separator ? text.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : text);
    }
  );

  const animatedStyle = useAnimatedStyle(() => {
    const scale = odometer ? interpolate(progress.value, [0, 0.4, 1], [0.92, 1.04, 1], Extrapolation.CLAMP) : 1;
    const translateY = odometer ? interpolate(progress.value, [0, 0.5, 1], [8, -2, 0], Extrapolation.CLAMP) : 0;
    const opacity = interpolate(progress.value, [0, 0.15, 1], [0.4, 1, 1], Extrapolation.CLAMP);
    return {
      transform: [{ translateY }, { scale }],
      opacity,
    };
  });

  return (
    <AnimatedText style={[style, animatedStyle]} {...rest}>
      {display}
    </AnimatedText>
  );
}
