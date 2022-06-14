import Base from './base';
import ManHuaGuiMobile from './mhgm';
import ManHuaGui from './mhg';
import CopyManga from './copy';

export enum Plugin {
  MHG = 'MHG',
  MHGM = 'MHGM',
  COPY = 'COPY',
}

const MHG = new ManHuaGui(Plugin.MHG, 'manhuagui', 'MHG');
const MHGM = new ManHuaGuiMobile(Plugin.MHGM, 'manhuagui(mobile)', 'MHGM');
const COPY = new CopyManga(Plugin.COPY, 'copymanga', 'COPY');

export const PluginMap = new Map([
  [Plugin.MHG, MHG],
  [Plugin.MHGM, MHGM],
  [Plugin.COPY, COPY],
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
