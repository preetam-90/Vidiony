import { getInnertube } from "../src/innertube.js";

async function test() {
  const yt = await getInnertube();
  
  // Try different channels by handle
  const channels = ["@MrBeast", "@YouTube", "@GoogleCreators"];
  
  for (const channelHandle of channels) {
    try {
      console.log(`\n\n================ Testing ${channelHandle} ================`);
      const ch = await yt.getChannel(channelHandle);
      const header = (ch as any).header;
      const meta = ch.metadata as any;
      const c4Header = header?.c4TabbedHeader as any;
      
      console.log("\n=== CHECKING SUBSCRIBER FIELDS ===");
      console.log("c4Header?.subscriberCount:", c4Header?.subscriberCount);
      console.log("header?.subscriberCount:", header?.subscriberCount);
      console.log("header?.subscriber_count:", header?.subscriber_count);
      console.log("meta?.subscriber_count:", meta?.subscriber_count);
      
      console.log("\n=== ALL C4 HEADER KEYS ===");
      if (c4Header) {
        console.log(Object.keys(c4Header).sort());
      }
      
      console.log("\n=== Sample of header.c4TabbedHeader ===");
      if (c4Header) {
        console.log(JSON.stringify(c4Header, null, 2).slice(0, 2000));
      }
      
      break; // Success - stop after first working channel
    } catch (err) {
      console.log(`Failed: ${(err as any).message}`);
    }
  }
}

test().catch(console.error).finally(() => process.exit(0));
