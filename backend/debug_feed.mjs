import vm from 'node:vm';
import { Innertube, UniversalCache, Platform } from 'youtubei.js';
Platform.shim.eval = (data, env) => {
  const ctx = vm.createContext({ ...env, globalThis:{}, Object, String, Array, Math, JSON, RegExp, Number, Boolean });
  try { const r = vm.runInContext(data.output + '\n; exportedVars;', ctx);
    if (r && typeof r === 'object') { const o={}; for(const n of data.exported) o[n]=r[n]; return o; }
  } catch {}
  return {};
};
const yt = await Innertube.create({ cache: new UniversalCache(true, './.cache') });
const home = await yt.getHomeFeed();
// show the actual structure
const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(home));
console.log("Home prototype methods:", proto.filter(k => !k.startsWith('_')).join(', '));
console.log("Own keys:", Object.keys(home).join(', '));
// Check the shelves or sections
const contentsObj = (home as any).contents_memo;
if (contentsObj) console.log("contents_memo keys:", Object.keys(contentsObj).slice(0,5));
// check what videos look like
const allVids = (home as any).videos;
console.log("home.videos:", Array.isArray(allVids), allVids?.length, allVids?.[0]?.type);
