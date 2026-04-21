import { Innertube } from "youtubei.js";

async function run() {
  const yt = await Innertube.create();
  console.log("yt.browse type:", typeof yt.browse);
  console.log("yt.getTrending type:", typeof yt.getTrending);
  console.log("yt.search type:", typeof yt.search);
  
  if (typeof yt.browse === 'function') {
    console.log("Calling yt.browse('FEtrending')...");
    try {
      const b = await yt.browse('FEtrending');
      console.log("Success! Title:", b.header?.title?.toString());
    } catch (e) {
      console.log("yt.browse failed:", e.message);
    }
  }
}

run().catch(console.error);
