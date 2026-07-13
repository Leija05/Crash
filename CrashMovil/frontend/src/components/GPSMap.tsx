import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Line, Rect, Circle, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useDerivedValue, 
  useAnimatedProps, 
  withTiming, 
  Easing,
  FadeIn 
} from 'react-native-reanimated';
import { COLORS, RADIUS, SPACING, FONT, FONT_SIZE, GOLD, SHADOWS } from '../theme';

interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp?: string;
  gForce?: number;
  speed?: number;
}

interface GPSMapProps {
  route: RoutePoint[];
  impactPoint?: RoutePoint;
  currentLocation?: RoutePoint;
  width?: number;
  height?: number;
  style?: ViewStyle;
  showImpactMarker?: boolean;
  showCurrentLocation?: boolean;
  animateRoute?: boolean;
  onPress?: (point: RoutePoint, index: number) => void;
}

import { ViewStyle } from 'react-native';

export function GPSMap({
  route,
  impactPoint,
  currentLocation,
  width = 340,
  height = 220,
  style,
  showImpactMarker = true,
  showCurrentLocation = true,
  animateRoute = true,
  onPress,
}: GPSMapProps) {
  const routeProgress = useSharedValue(0);
  const pulseAnim = useSharedValue(0);

  const bounds = useMemo(() => {
    if (!route.length) return { minLat: 0, maxLat: 0, minLon: 0, maxLon: 0 };
    const lats = route.map(p => p.latitude);
    const lons = route.map(p => p.longitude);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLon: Math.min(...lons),
      maxLon: Math.max(...lons),
    };
  }, [route]);

  const padding = 20;
  const mapWidth = width - padding * 2;
  const mapHeight = height - padding * 2;

  const project = (lat: number, lon: number) => {
    const latRange = bounds.maxLat - bounds.minLat || 0.001;
    const lonRange = bounds.maxLon - bounds.minLon || 0.001;
    const x = padding + ((lon - bounds.minLon) / lonRange) * mapWidth;
    const y = padding + ((bounds.maxLat - lat) / latRange) * mapHeight;
    return { x, y };
  };

  const projectedRoute = useMemo(() => route.map(p => project(p.latitude, p.longitude)), [route, bounds]);
  const projectedImpact = useMemo(() => impactPoint ? project(impactPoint.latitude, impactPoint.longitude) : null, [impactPoint, bounds]);
  const projectedCurrent = useMemo(() => currentLocation ? project(currentLocation.latitude, currentLocation.longitude) : null, [currentLocation, bounds]);

  const routePath = useMemo(() => {
    if (projectedRoute.length < 2) return '';
    let path = `M${projectedRoute[0].x},${projectedRoute[0].y}`;
    for (let i = 1; i < projectedRoute.length; i++) {
      const cp1x = projectedRoute[i - 1].x + (projectedRoute[i].x - projectedRoute[i - 1].x) * 0.4;
      const cp1y = projectedRoute[i - 1].y;
      const cp2x = projectedRoute[i].x - (projectedRoute[i].x - projectedRoute[i - 1].x) * 0.4;
      const cp2y = projectedRoute[i].y;
      path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${projectedRoute[i].x},${projectedRoute[i].y}`;
    }
    return path;
  }, [projectedRoute]);

  const animatedPath = useDerivedValue(() => {
    if (!animateRoute) return { path: routePath, dashArray: 0, dashOffset: 0 };
    const len = routePath.length;
    return { 
      path: routePath, 
      dashArray: len, 
      dashOffset: len * (1 - routeProgress.value) 
    };
  }, [routePath, animateRoute]);

  useEffect(() => {
    if (animateRoute) {
      routeProgress.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) });
    } else {
      routeProgress.value = 1;
    }
  }, [animateRoute, route.length]);

  useEffect(() => {
    pulseAnim.value = withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) }, () => {
      pulseAnim.value = withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.quad) });
    });
    const interval = setInterval(() => {
      pulseAnim.value = withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) }, () => {
        pulseAnim.value = withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.quad) });
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const impactPulseStyle = useAnimatedProps(() => ({
    r: 8 + pulseAnim.value * 12,
    opacity: 0.8 - pulseAnim.value * 0.6,
  }));

  const currentPulseStyle = useAnimatedProps(() => ({
    r: 6 + pulseAnim.value * 10,
    opacity: 0.8 - pulseAnim.value * 0.6,
  }));

  if (!route.length) {
    return (
      <View style={[styles.emptyContainer, { width, height }, style]}>
        <Svg width={width} height={height}>
          <Rect width={width} height={height} rx={RADIUS.lg} fill={COLORS.surface} stroke={COLORS.border} strokeWidth={1} />
          <Text style={styles.emptyText} x={width / 2} y={height / 2} textAnchor="middle" fill={COLORS.textDim} fontSize={FONT_SIZE.sm} fontFamily={FONT.body}>
            Sin datos de ruta
          </Text>
        </Svg>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }, style]}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="routeGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor={GOLD} stopOpacity={0.3} />
            <Stop offset="70%" stopColor={GOLD} stopOpacity={0.05} />
            <Stop offset="100%" stopColor={GOLD} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="impactGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor={COLORS.danger} stopOpacity={0.5} />
            <Stop offset="60%" stopColor={COLORS.danger} stopOpacity={0.1} />
            <Stop offset="100%" stopColor={COLORS.danger} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="currentGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor={COLORS.success} stopOpacity={0.5} />
            <Stop offset="60%" stopColor={COLORS.success} stopOpacity={0.1} />
            <Stop offset="100%" stopColor={COLORS.success} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Rect width={width} height={height} rx={RADIUS.lg} fill={COLORS.surface} stroke={COLORS.border} strokeWidth={1} />

        <G opacity={0.03}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <Line key={`h-${i}`} x1={0} x2={width} y1={i * (height / 9)} y2={i * (height / 9)} stroke="#fff" strokeWidth={0.5} strokeDasharray="4,8" />
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <Line key={`v-${i}`} y1={0} y2={height} x1={i * (width / 9)} x2={i * (width / 9)} stroke="#fff" strokeWidth={0.5} strokeDasharray="4,8" />
          ))}
        </G>

        <Animated.Path
          d={animateRoute ? animatedPath.path : routePath}
          stroke="url(#routeGlow)"
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={animateRoute ? animatedPath.dashArray : 0}
          strokeDashoffset={animateRoute ? animatedPath.dashOffset : 0}
          opacity={animateRoute ? routeProgress.value : 1}
        />

        <Animated.Path
          d={routePath}
          stroke={GOLD}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={animateRoute ? routePath.length : 0}
          strokeDashoffset={animateRoute ? routePath.length * (1 - routeProgress.value) : 0}
          opacity={animateRoute ? routeProgress.value : 1}
        />

        {projectedRoute.map((point, i) => (
          i % 3 === 0 && (
            <Circle
              key={`route-${i}`}
              cx={point.x}
              cy={point.y}
              r={1.5}
              fill={GOLD}
              opacity={0.6}
              onPress={() => onPress?.(route[i], i)}
            />
          )
        ))}

        {showImpactMarker && projectedImpact && (
          <G>
            <Animated.Circle
              cx={projectedImpact.x}
              cy={projectedImpact.y}
              r={20}
              fill="url(#impactGlow)"
            />
            <Circle
              cx={projectedImpact.x}
              cy={projectedImpact.y}
              r={8}
              fill={COLORS.danger}
              stroke={COLORS.bg}
              strokeWidth={3}
            />
            <Animated.Circle
              cx={projectedImpact.x}
              cy={projectedImpact.y}
              style={impactPulseStyle}
              stroke={COLORS.danger}
              strokeWidth={2}
              fill="none"
            />
          </G>
        )}

        {showCurrentLocation && projectedCurrent && (
          <G>
            <Animated.Circle
              cx={projectedCurrent.x}
              cy={projectedCurrent.y}
              r={16}
              fill="url(#currentGlow)"
            />
            <Circle
              cx={projectedCurrent.x}
              cy={projectedCurrent.y}
              r={6}
              fill={COLORS.success}
              stroke={COLORS.bg}
              strokeWidth={3}
            />
            <Animated.Circle
              cx={projectedCurrent.x}
              cy={projectedCurrent.y}
              style={currentPulseStyle}
              stroke={COLORS.success}
              strokeWidth={2}
              fill="none"
            />
          </G>
        )}

        {projectedRoute.length > 0 && (
          <Circle
            cx={projectedRoute[0].x}
            cy={projectedRoute[0].y}
            r={5}
            fill={COLORS.info}
            stroke={COLORS.bg}
            strokeWidth={2}
          />
        )}
      </Svg>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: GOLD }]} />
          <Text style={styles.legendText}>Ruta</Text>
        </View>
        {showImpactMarker && impactPoint && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
            <Text style={styles.legendText}>Impacto</Text>
          </View>
        )}
        {showCurrentLocation && currentLocation && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.legendText}>Actual</Text>
          </View>
        )}
        {projectedRoute.length > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.info }]} />
            <Text style={styles.legendText}>Inicio</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: COLORS.textSec,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    fontFamily: FONT.body,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    fill: COLORS.textDim,
  },
});