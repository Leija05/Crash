import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Svg, { Path, Line, Rect, Circle, G, Text as SvgText } from 'react-native-svg';
import Animated, { useSharedValue, useDerivedValue, useAnimatedProps, withTiming, Easing, FadeIn } from 'react-native-reanimated';
import { COLORS, RADIUS, SPACING, FONT, FONT_SIZE, severityColor, SHADOWS, ANIMATION } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DataPoint {
  x: number;
  y: number;
  color?: string;
  label?: string;
}

interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  gradientColors?: string[];
  showArea?: boolean;
  showPoints?: boolean;
  showGrid?: boolean;
  showLabels?: boolean;
  animate?: boolean;
  animationDuration?: number;
  strokeWidth?: number;
  minY?: number;
  maxY?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  onPointPress?: (point: DataPoint, index: number) => void;
}

const DEFAULT_PADDING = { top: 16, right: 16, bottom: 32, left: 48 };

export function LineChart({
  data,
  width = SCREEN_WIDTH - 32,
  height = 200,
  color = COLORS.primary,
  gradientColors,
  showArea = true,
  showPoints = false,
  showGrid = true,
  showLabels = true,
  animate = true,
  animationDuration = 800,
  strokeWidth = 2.5,
  minY,
  maxY,
  padding = DEFAULT_PADDING,
  onPointPress,
}: LineChartProps) {
  const progress = useSharedValue(0);
  const touchX = useSharedValue(-1);

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const yMin = useMemo(() => {
    if (minY !== undefined) return minY;
    const min = Math.min(...data.map(d => d.y));
    return min - (Math.abs(min) * 0.1 || 1);
  }, [data, minY]);

  const yMax = useMemo(() => {
    if (maxY !== undefined) return maxY;
    const max = Math.max(...data.map(d => d.y));
    return max + (Math.abs(max) * 0.1 || 1);
  }, [data, maxY]);

  const xScale = useMemo(() => chartWidth / Math.max(data.length - 1, 1), [chartWidth, data.length]);
  const yScale = useMemo(() => chartHeight / Math.max(yMax - yMin, 0.001), [chartHeight, yMax, yMin]);

  const pathData = useMemo(() => {
    if (data.length < 2) return '';
    const points = data.map((d, i) => ({
      x: padding.left + i * xScale,
      y: padding.top + chartHeight - (d.y - yMin) * yScale,
    }));
    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cp1x = points[i - 1].x + xScale * 0.5;
      const cp1y = points[i - 1].y;
      const cp2x = points[i].x - xScale * 0.5;
      const cp2y = points[i].y;
      path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i].x},${points[i].y}`;
    }
    return path;
  }, [data, xScale, yScale, yMin, chartHeight, padding.left, padding.top]);

  const areaPathData = useMemo(() => {
    if (data.length < 2) return '';
    const points = data.map((d, i) => ({
      x: padding.left + i * xScale,
      y: padding.top + chartHeight - (d.y - yMin) * yScale,
    }));
    let path = `M${points[0].x},${padding.top + chartHeight}`;
    path += ` L${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cp1x = points[i - 1].x + xScale * 0.5;
      const cp1y = points[i - 1].y;
      const cp2x = points[i].x - xScale * 0.5;
      const cp2y = points[i].y;
      path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i].x},${points[i].y}`;
    }
    path += ` L${points[points.length - 1].x},${padding.top + chartHeight}`;
    path += ` L${points[0].x},${padding.top + chartHeight} Z`;
    return path;
  }, [data, xScale, yScale, yMin, chartHeight, padding.left, padding.top]);

  const animatedPath = useDerivedValue(() => {
    if (!animate) return pathData;
    const len = pathData.length;
    const dashArray = len;
    const dashOffset = len * (1 - progress.value);
    return { path: pathData, dashArray, dashOffset };
  }, [pathData, animate]);

  const animatedAreaPath = useDerivedValue(() => {
    if (!animate) return areaPathData;
    return areaPathData;
  }, [areaPathData, animate]);

  React.useEffect(() => {
    if (animate) {
      progress.value = withTiming(1, { duration: animationDuration, easing: Easing.out(Easing.cubic) });
    } else {
      progress.value = 1;
    }
  }, [animate, animationDuration, data.length]);

  const gridLines = useMemo(() => {
    const lines = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const y = padding.top + (i / steps) * chartHeight;
      const value = yMax - (i / steps) * (yMax - yMin);
      lines.push({ y, value });
    }
    return lines;
  }, [chartHeight, padding.top, yMax, yMin]);

  const xLabels = useMemo(() => {
    if (!showLabels || data.length < 2) return [];
    const labels = [];
    const step = Math.max(1, Math.floor(data.length / 5));
    for (let i = 0; i < data.length; i += step) {
      labels.push({ x: padding.left + i * xScale, label: data[i].label || `${i}` });
    }
    if (data.length - 1 > labels[labels.length - 1].x) {
      labels.push({ x: padding.left + (data.length - 1) * xScale, label: data[data.length - 1].label || `${data.length - 1}` });
    }
    return labels;
  }, [data, xScale, padding.left, showLabels]);

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Rect width={width} height={height} fill={COLORS.bg} />
        
        {showGrid && gridLines.map((line, i) => (
          <Line
            key={`grid-${i}`}
            x1={padding.left}
            x2={width - padding.right}
            y1={line.y}
            y2={line.y}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}

        {showArea && gradientColors && (
          <Animated.Path
            d={animatedAreaPath}
            fill="url(#chartGradient)"
            opacity={animate ? progress.value : 1}
          />
        )}

        {showArea && !gradientColors && (
          <Animated.Path
            d={animatedAreaPath}
            fill={color + '15'}
            opacity={animate ? progress.value : 1}
          />
        )}

        <Animated.Path
          d={animate ? animatedPath.path : pathData}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={animate ? animatedPath.dashArray : 0}
          strokeDashoffset={animate ? animatedPath.dashOffset : 0}
          opacity={animate ? progress.value : 1}
        />

        {showPoints && data.map((d, i) => (
          <Animated.Circle
            key={`point-${i}`}
            cx={padding.left + i * xScale}
            cy={padding.top + chartHeight - (d.y - yMin) * yScale}
            r={showPoints ? 4 : 0}
            fill={d.color || color}
            stroke={COLORS.bg}
            strokeWidth={2}
            opacity={animate ? progress.value : 1}
          />
        ))}

        {showLabels && xLabels.map((label, i) => (
          <SvgText
            key={`xlabel-${i}`}
            x={label.x}
            y={height - padding.bottom + 16}
            textAnchor="middle"
            fill={COLORS.textDim}
            fontSize={FONT_SIZE.xs}
            fontFamily={FONT.mono}
          >
            {label.label}
          </SvgText>
        ))}

        {showLabels && gridLines.map((line, i) => (
          <SvgText
            key={`ylabel-${i}`}
            x={padding.left - 8}
            y={line.y + 4}
            textAnchor="end"
            fill={COLORS.textDim}
            fontSize={FONT_SIZE.xs}
            fontFamily={FONT.mono}
          >
            {line.value.toFixed(line.value < 10 ? 1 : 0)}
          </SvgText>
        ))}
      </Svg>

      {gradientColors && (
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              {gradientColors.map((c, i) => (
                <stop key={i} offset={`${(i / (gradientColors.length - 1)) * 100}%`} stopColor={c} stopOpacity={i === 0 ? 0.25 : 0.02} />
              ))}
            </linearGradient>
          </defs>
        </Svg>
      )}
    </View>
  );
}

interface MultiLineChartProps {
  datasets: { data: DataPoint[]; color: string; name: string }[];
  width?: number;
  height?: number;
  showArea?: boolean;
  showLegend?: boolean;
  animate?: boolean;
  animationDuration?: number;
  strokeWidth?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
}

export function MultiLineChart({
  datasets,
  width = SCREEN_WIDTH - 32,
  height = 200,
  showArea = false,
  showLegend = true,
  animate = true,
  animationDuration = 800,
  strokeWidth = 2,
  padding = DEFAULT_PADDING,
}: MultiLineChartProps) {
  const progress = useSharedValue(0);
  const allData = useMemo(() => datasets.flatMap(d => d.data), [datasets]);

  const yMin = useMemo(() => Math.min(...allData.map(d => d.y)) * 0.95, [allData]);
  const yMax = useMemo(() => Math.max(...allData.map(d => d.y)) * 1.05, [allData]);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const xScale = chartWidth / Math.max(allData.length / datasets.length - 1, 1);
  const yScale = chartHeight / (yMax - yMin);

  React.useEffect(() => {
    if (animate) {
      progress.value = withTiming(1, { duration: animationDuration, easing: Easing.out(Easing.cubic) });
    } else {
      progress.value = 1;
    }
  }, [animate, animationDuration, datasets.length]);

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Rect width={width} height={height} fill={COLORS.bg} />
        
        {[0, 1, 2, 3, 4].map(i => (
          <Line
            key={`grid-${i}`}
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + (i / 4) * chartHeight}
            y2={padding.top + (i / 4) * chartHeight}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}

        {datasets.map((dataset, di) => {
          const data = dataset.data;
          const path = useMemo(() => {
            if (data.length < 2) return '';
            const points = data.map((d, i) => ({
              x: padding.left + i * xScale,
              y: padding.top + chartHeight - (d.y - yMin) * yScale,
            }));
            let p = `M${points[0].x},${points[0].y}`;
            for (let i = 1; i < points.length; i++) {
              const cp1x = points[i - 1].x + xScale * 0.5;
              const cp1y = points[i - 1].y;
              const cp2x = points[i].x - xScale * 0.5;
              const cp2y = points[i].y;
              p += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i].x},${points[i].y}`;
            }
            return p;
          }, [data, xScale, yScale, yMin, chartHeight, padding.left, padding.top]);

          const areaPath = useMemo(() => {
            if (data.length < 2) return '';
            const points = data.map((d, i) => ({
              x: padding.left + i * xScale,
              y: padding.top + chartHeight - (d.y - yMin) * yScale,
            }));
            let p = `M${points[0].x},${padding.top + chartHeight}`;
            p += ` L${points[0].x},${points[0].y}`;
            for (let i = 1; i < points.length; i++) {
              const cp1x = points[i - 1].x + xScale * 0.5;
              const cp1y = points[i - 1].y;
              const cp2x = points[i].x - xScale * 0.5;
              const cp2y = points[i].y;
              p += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i].x},${points[i].y}`;
            }
            p += ` L${points[points.length - 1].x},${padding.top + chartHeight}`;
            p += ` L${points[0].x},${padding.top + chartHeight} Z`;
            return p;
          }, [data, xScale, yScale, yMin, chartHeight, padding.left, padding.top]);

          return (
            <G key={di}>
              {showArea && (
                <Animated.Path
                  d={areaPath}
                  fill={dataset.color + '10'}
                  opacity={progress.value}
                />
              )}
              <Animated.Path
                d={path}
                stroke={dataset.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={path.length}
                strokeDashoffset={path.length * (1 - progress.value)}
                opacity={progress.value}
              />
            </G>
          );
        })}
      </Svg>

      {showLegend && (
        <View style={styles.legend} style={{ marginTop: 8 }}>
          {datasets.map((d, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: d.color }]} />
              <Text style={styles.legendText}>{d.name}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
  animate?: boolean;
}

export function Sparkline({ data, width = 120, height = 40, color = COLORS.primary, showArea = true, animate = true }: SparklineProps) {
  const progress = useSharedValue(0);
  const points = useMemo(() => {
    if (data.length < 2) return [];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    return data.map((v, i) => ({
      x: (i / (data.length - 1)) * width,
      y: height - ((v - min) / range) * height,
    }));
  }, [data, width, height]);

  const path = useMemo(() => {
    if (points.length < 2) return '';
    let p = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) * 0.5;
      const cp1y = points[i - 1].y;
      const cp2x = points[i].x - (points[i].x - points[i - 1].x) * 0.5;
      const cp2y = points[i].y;
      p += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i].x},${points[i].y}`;
    }
    return p;
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length < 2) return '';
    let p = `M${points[0].x},${height}`;
    p += ` L${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) * 0.5;
      const cp1y = points[i - 1].y;
      const cp2x = points[i].x - (points[i].x - points[i - 1].x) * 0.5;
      const cp2y = points[i].y;
      p += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i].x},${points[i].y}`;
    }
    p += ` L${points[points.length - 1].x},${height}`;
    p += ` L${points[0].x},${height} Z`;
    return p;
  }, [points, height]);

  React.useEffect(() => {
    if (animate) {
      progress.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    } else {
      progress.value = 1;
    }
  }, [animate, data.length]);

  return (
    <Svg width={width} height={height}>
      {showArea && (
        <Animated.Path
          d={areaPath}
          fill={color + '15'}
          opacity={progress.value}
        />
      )}
      <Animated.Path
        d={path}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={path.length}
        strokeDashoffset={path.length * (1 - progress.value)}
        opacity={progress.value}
      />
      <Circle
        cx={points[points.length - 1]?.x || 0}
        cy={points[points.length - 1]?.y || 0}
        r={3}
        fill={color}
        stroke={COLORS.bg}
        strokeWidth={2}
        opacity={progress.value}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {},
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
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
  },
});