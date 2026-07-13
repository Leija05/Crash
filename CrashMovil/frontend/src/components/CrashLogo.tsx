import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { COLORS, RADIUS, GOLD } from '../theme';

const SVG_PATHS = [
  "M1535 2895 c-44 -37 -295 -160 -407 -199 -179 -64 -366 -107 -573 -131 -212 -25 -202 -23 -208 -48 -3 -12 -11 -106 -18 -209 -10 -149 -10 -229 0 -390 7 -111 16 -209 20 -216 5 -9 14 2 26 35 17 42 19 72 16 255 -4 260 7 464 25 482 7 8 44 17 81 20 104 11 285 44 413 76 203 51 360 112 548 210 118 62 144 69 177 47 44 -30 176 -97 275 -140 216 -93 459 -156 743 -191 60 -8 114 -19 120 -25 8 -8 12 -111 14 -325 2 -264 5 -320 19 -355 9 -22 20 -41 24 -41 9 0 17 67 26 215 5 106 -10 504 -22 552 -7 27 -2 26 -199 48 -371 41 -727 157 -981 320 -64 41 -79 42 -119 10z",
  "M1359 2575 c-248 -52 -437 -152 -595 -317 -67 -70 -99 -117 -156 -228 -38 -76 -47 -110 -27 -110 26 0 49 24 73 76 81 176 282 362 489 452 182 78 398 108 604 82 375 -46 684 -248 810 -528 34 -76 42 -85 59 -71 20 16 17 52 -8 107 -75 163 -192 284 -388 399 -253 149 -567 199 -861 138z",
  "M1240 2252 c-34 -70 -89 -188 -122 -262 -63 -142 -81 -171 -97 -155 -6 6 -29 66 -53 134 -24 69 -48 126 -54 128 -5 2 -38 -54 -74 -125 l-65 -127 -95 -6 c-117 -7 -170 -31 -199 -93 -29 -61 -59 -222 -71 -387 -18 -240 14 -581 66 -705 26 -61 100 -171 157 -231 106 -113 141 -112 332 7 178 110 577 282 837 360 115 34 400 100 433 100 6 0 16 -4 24 -9 19 -12 -27 -68 -137 -163 -162 -141 -283 -223 -449 -305 -29 -14 -53 -29 -53 -34 0 -51 269 96 465 254 199 161 435 451 398 488 -19 19 -39 4 -78 -56 -53 -80 -90 -97 -295 -139 -433 -88 -813 -231 -1167 -440 -108 -63 -137 -76 -173 -76 -40 0 -48 5 -89 49 -88 93 -164 248 -185 377 -9 50 -3 56 89 78 467 114 757 221 872 321 60 52 132 162 140 212 5 32 4 35 -18 31 -17 -2 -33 -20 -56 -63 -47 -86 -132 -163 -234 -212 -187 -92 -773 -263 -801 -235 -35 35 -34 375 2 587 35 204 45 216 206 221 58 2 110 7 115 10 5 3 25 36 44 74 54 107 51 109 115 -80 23 -69 46 -129 51 -135 6 -5 16 9 26 35 54 136 202 445 214 445 19 0 26 -44 40 -244 9 -123 17 -175 26 -178 7 -3 59 22 115 56 56 34 107 61 115 61 21 0 16 -24 -27 -119 -22 -49 -40 -96 -40 -105 0 -14 20 -16 165 -16 195 0 192 1 225 -112 12 -40 37 -127 56 -193 20 -66 40 -133 46 -148 15 -38 39 -50 65 -32 27 19 41 80 128 582 27 156 52 263 65 277 14 14 49 -119 160 -599 12 -49 28 -100 36 -112 18 -28 59 -30 73 -4 6 10 30 94 55 187 64 242 80 289 96 289 8 0 26 -31 43 -75 45 -120 76 -143 214 -155 129 -12 193 6 177 50 -5 12 -29 15 -126 15 -162 0 -163 1 -222 142 -97 229 -114 216 -225 -185 -17 -59 -33 -112 -36 -118 -12 -19 -33 11 -45 64 -28 126 -144 597 -158 646 -19 62 -43 84 -66 61 -14 -14 -28 -79 -92 -425 -85 -463 -101 -514 -130 -420 -7 22 -27 87 -45 145 -17 58 -40 117 -51 132 -26 37 -72 49 -180 48 -127 -2 -125 -2 -131 15 -6 13 40 135 97 257 14 31 26 59 26 62 0 13 -24 4 -63 -22 -23 -16 -91 -57 -151 -92 -103 -59 -110 -62 -123 -44 -7 10 -13 32 -13 48 0 113 -38 504 -50 511 -4 2 -35 -53 -70 -123z",
  "M600 1654 c-48 -124 -66 -574 -24 -574 11 0 14 26 14 138 0 121 14 250 46 425 5 30 4 37 -10 37 -9 0 -21 -12 -26 -26z",
  "M2715 1431 c-3 -5 -21 -63 -41 -127 -118 -388 -359 -682 -755 -921 -125 -75 -293 -153 -329 -153 -33 0 -186 72 -312 147 -92 54 -111 62 -129 53 -11 -6 -19 -17 -16 -23 10 -32 270 -185 398 -236 l57 -22 76 31 c42 18 122 56 177 86 371 199 630 446 786 752 60 117 149 363 139 388 -7 18 -43 36 -51 25z",
  "M805 785 c-38 -14 -112 -81 -101 -92 3 -3 19 6 36 20 41 35 95 49 143 37 48 -10 69 -29 92 -81 23 -50 51 -50 48 0 -4 82 -127 148 -218 116z",
];

export function CrashLogoSVG({ size = 36, color = GOLD }: { size?: number; color?: string }) {
  const scale = size / 333;
  const height = size * (306 / 333);
  return (
    <Svg width={size} height={height} viewBox="0 0 333 306" color={color}>
      <G transform={`translate(0,306) scale(0.1,-0.1)`} fill={color} stroke="none">
        {SVG_PATHS.map((d, i) => (
          <Path key={i} d={d} />
        ))}
      </G>
    </Svg>
  );
}

export function CrashLogo({ size = 36, color = GOLD }: CrashLogoProps) {
  return (
    <View
      style={{
        width: size,
        height: size * (306 / 333),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CrashLogoSVG size={size} color={color} />
    </View>
  );
}

interface CrashLogoProps {
  size?: number;
  color?: string;
}

export function CrashLogoFull({ size = 28 }: { size?: number }) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.logoBox,
          {
            width: size + 16,
            height: size + 16,
            borderRadius: (size + 16) / 3.5,
          },
        ]}
      >
        <CrashLogoSVG size={size} color={GOLD} />
      </View>
      <View>
        <Text style={[styles.badge, { fontSize: size > 30 ? 9 : 7 }]}>CRITICAL RESPONSE</Text>
        <Text style={[styles.name, { fontSize: size > 30 ? 17 : 13 }]}>
          C.R.A.S.H.
        </Text>
      </View>
    </View>
  );
}

export function CrashLogoIcon({ size = 24, color }: { size?: number; color?: string }) {
  return (
    <View
      style={{
        width: size + 8,
        height: (size + 8) * (306 / 333),
        borderRadius: (size + 8) / 3,
        borderWidth: 1.5,
        borderColor: 'rgba(200,162,60,0.4)',
        backgroundColor: 'rgba(200,162,60,0.10)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CrashLogoSVG size={size} color={color || GOLD} />
    </View>
  );
}

export function CrashLogoMark({ size = 40 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size * (306 / 333),
        borderRadius: size / 4,
        backgroundColor: GOLD,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: GOLD,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 8,
      }}
    >
      <CrashLogoSVG size={size * 0.8} color="#000" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    borderWidth: 1.5,
    borderColor: 'rgba(200,162,60,0.35)',
    backgroundColor: 'rgba(200,162,60,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    letterSpacing: 3.5,
    color: GOLD,
    fontWeight: '800',
  },
  name: {
    fontWeight: '900',
    letterSpacing: 2,
    color: COLORS.text,
  },
});
