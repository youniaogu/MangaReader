import Base, { Plugin } from './base';
import MHGM from './mhgm';
import MHG from './mhg';
import COPY from './copy';
import MHDB from './mhdb';
import DMZJ from './dmzj';
import JMC from './jmc';
import MHM from './mhm';
import KL from './kl';
import NH from './nh';

export * from './base';

export const PluginMap = new Map<Plugin, Base>([
  [DMZJ.id, DMZJ],
  [COPY.id, COPY],
  [MHDB.id, MHDB],
  [MHG.id, MHG],
  [MHGM.id, MHGM],
  [JMC.id, JMC],
  [MHM.id, MHM],
  [KL.id, KL],
  [NH.id, NH],
]);
export const isJMC = JMC.is;
export const nHentaiUserAgent = NH.userAgent;
export const combineHash = Base.combineHash;
export const splitHash = Base.splitHash;
export const defaultPlugin: Plugin = PluginMap.entries().next().value[0];
export const defaultPluginList = Array.from(PluginMap.values()).map((item) => {
  return {
    label: item.shortName,
    name: item.name,
    value: item.id,
    score: item.score,
    href: item.href,
    userAgent: item.userAgent,
    description: item.description,
    disabled: item.disabled,
  };
});
