import { Innertube } from 'youtubei.js';

async function main() {
  const yt = await Innertube.create();
  const channel = await yt.getChannel("UCX6OQ3DkcsbYNE6H8uQQuVA"); // MrBeast
  const h = channel.header as any;
  if (h && h.content && h.content.metadata) {
    console.log("metadata:", JSON.stringify(h.content.metadata, null, 2));
  } else {
    console.log("no metadata");
  }
}

main().catch(console.error);
