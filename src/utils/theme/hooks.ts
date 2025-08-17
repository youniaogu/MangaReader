import { useAppSelector } from '~/redux';
import { LightSwitch } from '~/utils';
import { ThemeTokenKey, themeTokens } from '~/utils/theme/tokens';

export function useThemeColor<T = string>(lightValue: T, darkValue: T): T {
  const light = useAppSelector((s) => s.setting.light);
  return light === LightSwitch.On ? lightValue : darkValue;
}

export function useTokenColor(key: ThemeTokenKey) {
  const { light, dark } = themeTokens[key];
  return useThemeColor(light, dark);
}

export const useBackgroundColor = () => useTokenColor('bg');
export const useTextColor = () => useTokenColor('text');
export const useSubTextColor = () => useTokenColor('subText');
export const useCardBgColor = () => useTokenColor('card');
export const useBorderColor = () => useTokenColor('border');
export const useHeaderBgColor = () => useTokenColor('header');

export const usePlaceholderTextColor = () => useTokenColor('placeholderTextColor');
