import vm from 'node:vm';
import { Innertube, UniversalCache, Platform } from 'youtubei.js';
Platform.shim.eval = (data: any, env: any) => {
  const ctx = vm.createContext({ ...env, globalThis:{}, Object, String, Array, Math, JSON, RegExp, Number, Boolean });
  try { const r = vm.runInContext(data.output + '\n; exportedVars;', ctx);
    if (r && typeof r === 'object') { const o: any={}; for(const n of data.exported) o[n]=r[n]; return o; }
  } catch {}
  return {};
};
const yt = await Innertube.create({ cache: new UniversalCache(true, './.cache') });
const home = await yt.getHomeFeed();
// Traverse contents which is a YTNode or array
const contents: any = (home as any).contents;
console.log("contents type:", contents?.constructor?.name, "| is array:", Array.isArray(contents));
if (contents) {
  const c0 = Array.isArray(contents) ? contents[0] : contents;
  console.log("c0 type:", c0?.constructor?.name, c0?.type);
  // If it's RichGrid check its contents
  const innerContents: any[] = c0?.contents ?? c0?.items ?? [];
  console.log("inner items count:", innerContents.length);
  if (innerContents.length > 0) {
    console.log("first item type:", innerContents[0]?.type, "id:", innerContents[0]?.id ?? innerContents[0]?.content?.id);
    // RichItem wraps Video
    const firstContent = innerContents[0]?.content ?? innerContents[0];
    console.log("video?:", JSON.stringify(firstContent).slice(0, 200));
  }
}
