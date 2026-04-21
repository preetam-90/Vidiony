// @ts-nocheck
import { getInnertube } from "./backend/src/innertube.js";
async function run() {
  const yt = await getInnertube();
  const trending = await yt.getTrending();
  console.log("videos count:", trending.videos?.length);
  console.log("tabs count:", trending.tabs?.length);
  if (trending.tabs) {
    for (const tab of trending.tabs) {
      console.log("Tab:", tab.title?.toString(), "videos:", tab?.content?.videos?.length ?? tab?.videos?.length ?? tab.content?.contents?.length);
    }
  }
}
run().catch(console.error);
