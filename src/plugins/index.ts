import ManHuaGuiMobile from './mhgm';
import ManHuaGui from './mhg';

export enum Plugin {
  MHGM = 'MHGM',
  MHG = 'MHG',
}

const MHGM = new ManHuaGuiMobile(Plugin.MHGM, 'manhuagui(mobile)');
const MHG = new ManHuaGui(Plugin.MHG, 'manhuagui');

export const PluginMap = new Map([
  [Plugin.MHGM, MHGM],
  [Plugin.MHG, MHG],
]);
