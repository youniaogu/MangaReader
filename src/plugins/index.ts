import Base from './base';
import ManHuaGuiMobile from './mhgm';
import ManHuaGui from './mhg';

export enum Plugin {
  MHGM = 'MHGM',
  MHG = 'MHG',
}

const MHGM = new ManHuaGuiMobile(Plugin.MHGM, 'manhuagui(mobile)', 'MHGM');
const MHG = new ManHuaGui(Plugin.MHG, 'manhuagui', 'MHG');

export const PluginMap = new Map([
  [Plugin.MHGM, MHGM],
  [Plugin.MHG, MHG],
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
