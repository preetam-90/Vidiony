import { Innertube } from "youtubei.js";

async function run() {
  const yt = await Innertube.create();
  console.log("Methods of yt instance:");
  const methods = Object.keys(yt).filter(k => typeof yt[k] === 'function');
  console.log(methods);
  
  console.log("Keys of yt instance:");
  console.log(Object.keys(yt));
  
  if (yt.view) console.log("Has view method");
  if (yt.search) console.log("Has search method");
}

run().catch(console.error);
