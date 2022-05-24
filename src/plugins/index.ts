import ManHuaGuiMobile from './mhgm';
import ManHuaGui from './mhg';

const MHGM = new ManHuaGuiMobile();
const MHG = new ManHuaGui();

export default {
  [MHGM.id]: MHGM,
  [MHG.id]: MHG,
};
