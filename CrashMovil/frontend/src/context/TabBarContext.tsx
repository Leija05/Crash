import React, { createContext, useContext } from 'react';
import Animated, { useSharedValue, useAnimatedScrollHandler, withTiming, type SharedValue } from 'react-native-reanimated';

type TabBarCtx = {
  collapse: SharedValue<number>;
};

const Ctx = createContext<TabBarCtx | null>(null);

export function TabBarProvider({ children }: { children: React.ReactNode }) {
  const collapse = useSharedValue(0);
  return <Ctx.Provider value={{ collapse }}>{children}</Ctx.Provider>;
}

export function useTabBar(): TabBarCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTabBar debe usarse dentro de TabBarProvider');
  return ctx;
}

/**
 * Devuelve un handler para `onScroll` que contrae la tab bar al hacer scroll
 * hacia abajo y la expande al hacer scroll hacia arriba. El valor se anima
 * suavemente con reanimated (corre en el hilo de UI, sin puentear a JS).
 */
export function useTabBarScroll() {
  const { collapse } = useTabBar();
  const lastY = useSharedValue(0);
  const target = useSharedValue(0);

  return useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y;
      const dy = y - lastY.value;
      lastY.value = y;

      if (y < 24) {
        if (target.value !== 0) {
          target.value = 0;
          collapse.value = withTiming(0, { duration: 240 });
        }
        return;
      }
      if (dy > 6 && target.value !== 1) {
        target.value = 1;
        collapse.value = withTiming(1, { duration: 240 });
      } else if (dy < -6 && target.value !== 0) {
        target.value = 0;
        collapse.value = withTiming(0, { duration: 240 });
      }
    },
  });
}
