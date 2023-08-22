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
import PICA from './pica';
import MBZ from './mbz';
import BZM from './bzm';

export * from './base';

export const PluginMap = new Map<Plugin, Base>([
  [COPY.id, COPY],
  [MBZ.id, MBZ],
  [MHGM.id, MHGM],
  [JMC.id, JMC],
  [NH.id, NH],
  [PICA.id, PICA],
  [KL.id, KL],
  [BZM.id, BZM],
  [DMZJ.id, DMZJ],
  [MHDB.id, MHDB],
  [MHM.id, MHM],
  [MHG.id, MHG],
]);
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
    injectedJavaScript: item.injectedJavaScript,
  };
});
