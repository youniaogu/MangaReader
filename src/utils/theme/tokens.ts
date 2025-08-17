export const themeTokens = {
  // 背景
  bg: { light: 'white', dark: 'purple.700' },
  // 主文本
  text: { light: 'purple.900', dark: 'purple.50' },
  // 次文本
  subText: { light: 'purple.600', dark: 'purple.200' },
  // 卡片背景
  card: { light: 'purple.100', dark: 'purple.700' },
  // 边框
  border: { light: 'purple.200', dark: 'purple.600' },
  // 顶部条（如果要保留紫色）
  header: { light: 'purple.500', dark: 'purple.900' },
  // 占位符
  placeholderTextColor: { light: 'purple.100', dark: 'purple.100' },
} as const;

export type ThemeTokenKey = keyof typeof themeTokens;
