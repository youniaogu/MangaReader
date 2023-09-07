import { Plugin } from '~/plugins';

declare global {
  type PartialOption<T, K extends string | number | symbol> = Omit<T, K> & {
    [A in Extract<keyof T, K>]?: T[A];
  };

  interface String {
    splic(f: string): string[];
  }

  interface InitPluginOptions {
    OS: 'ios' | 'android' | 'windows' | 'macos' | 'web';
  }

  interface MangaPlugin {
    Init: (options?: InitPluginOptions) => {
      Plugin: typeof Plugin;
      Options: typeof Options;
      PluginMap: Map<Plugin, Base>;
      combineHash: (id: Plugin, mangaId: string, chapterId?: string | undefined) => string;
      splitHash: (hash: string) => [Plugin, string, string];
      defaultPlugin: Plugin;
      defaultPluginList: {
        label: string;
        name: string;
        value: Plugin;
        score: number;
        href: string;
        userAgent: string | undefined;
        description: string;
        disabled: boolean;
      }[];
    };
  }
}
