import Base, { Plugin } from './base';
import MHGM from './mhgm';
import MHG from './mhg';
import COPY from './copy';
import MHDB from './mhdb';
import DMZJ from './dmzj';
import JMC from './jmc';
import MHM from './mhm';

export * from './base';

export const PluginMap = new Map([
  [Plugin.DMZJ, DMZJ],
  [Plugin.COPY, COPY],
  [Plugin.MHDB, MHDB],
  [Plugin.MHG, MHG],
  [Plugin.MHGM, MHGM],
  [Plugin.JMC, JMC],
  [Plugin.MHM, MHM],
]);
export const isJMC = JMC.is;
export const combineHash = Base.combineHash;
export const splitHash = Base.splitHash;
export const defaultPlugin: Plugin = PluginMap.entries().next().value[0];
export const defaultPluginList = Array.from(PluginMap.values()).map((item) => {
  return {
    label: item.shortName,
    name: item.name,
    value: item.id,
    score: item.score,
    description: item.description,
    disabled: item.disabled,
  };
});
