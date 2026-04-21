import { Innertube } from "youtubei.js";
async function main() {
  const yt = await Innertube.create();
  const ch = await yt.getChannel("@TechWiser");
  console.log("ch.id:", ch.id);
  console.log("ch.metadata.channel_id:", ch.metadata?.channel_id);
  console.log("ch.header.channelId:", ch.header?.channelId);
}
main().catch(console.error);
