import Base, { Plugin } from './base';
import MHGM from './mhgm';
import MHG from './mhg';
import COPY from './copy';
import MHDB from './mhdb';

export * from './base';

export const PluginMap = new Map([
  [Plugin.MHG, MHG],
  [Plugin.MHGM, MHGM],
  [Plugin.COPY, COPY],
  [Plugin.MHDB, MHDB],
]);
export const combineHash = Base.combineHash;
export const splitHash = Base.splitHash;
export const defaultPlugin: Plugin = PluginMap.entries().next().value[0];
export const defaultPluginList = Array.from(PluginMap.values()).map((item) => {
  return {
    label: item.shortName,
    name: item.name,
    value: item.id,
    disabled: false,
  };
});
