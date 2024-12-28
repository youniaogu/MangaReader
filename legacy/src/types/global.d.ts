import { PayloadAction } from '@reduxjs/toolkit';
import { customTheme } from '~/utils';
// choose @types/cheerio instead of default
import '@types/cheerio';

type CustomTheme = typeof customTheme;

declare module 'native-base' {
  interface ICustomTheme extends CustomTheme {}
}

declare global {
  type GET = 'GET' | 'get';
  type POST = 'POST' | 'post';

  type ArrayFirst<T> = T extends [infer U, ...any[]] ? U : any;

  type FetchResponseAction<T = undefined> = PayloadAction<
    undefined extends T
      ? { error?: Error; actionId?: string }
      :
          | { error: Error; data?: undefined; actionId?: string }
          | { error?: undefined; data: T; actionId?: string }
  >;

  type KeyValuePair = [string, string | null];

  interface FetchData {
    url: string;
    method?: GET | POST;
    body?: FormData | Record<string, any>;
    headers?: Headers;
    timeout?: number;
  }

  interface OptionItem {
    label: string;
    value: string;
  }

  namespace NodeJS {
    interface ProcessEnv {
      NAME: string;
      VERSION: string;
      PUBLISH_TIME: string;
    }
  }
}
