import { Innertube } from 'youtubei.js';

async function main() {
  const yt = await Innertube.create();
  const channel = await yt.getChannel("UCX6OQ3DkcsbYNE6H8uQQuVA"); // MrBeast
  const h = channel.header as any;
  
  let subCount = "";
  let vidCount = "";
  
  if (h?.content?.metadata?.metadata_rows) {
     const rows = h.content.metadata.metadata_rows;
     for (const row of rows) {
       for (const part of row.metadata_parts || []) {
         const text = part?.text?.text || "";
         if (text.toLowerCase().includes("subscriber")) {
            subCount = text;
         } else if (text.toLowerCase().includes("video")) {
            vidCount = text;
         }
       }
     }
  }
  
  console.log("Extracted subCount:", subCount);
  console.log("Extracted vidCount:", vidCount);
}

main().catch(console.error);
