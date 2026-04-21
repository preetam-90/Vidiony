import { Innertube } from "youtubei.js";

async function run() {
  const yt = await Innertube.create({ gl: "US" });
  console.log("Attempting to fetch FEtrending via getBrowse...");
  try {
    const browse = await yt.browse("FEtrending");
    console.log("Browse title:", browse.header?.title?.toString());
    
    // Check for sections/videos
    const videos = browse.videos;
    console.log("Direct videos count:", videos?.length);
    
    if (browse.tabs) {
      for (const tab of browse.tabs) {
        console.log("Tab:", tab.title?.toString());
        // console.log("Tab content type:", tab.content?.type);
      }
    }
    
    // Check for sections in the first tab or main content
    const contents = browse.contents;
    console.log("Has contents:", !!contents);
    
  } catch (err) {
    console.error("getBrowse('FEtrending') failed:", err);
  }
}

run().catch(console.error);
