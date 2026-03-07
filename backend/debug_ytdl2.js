import ytdl from 'ytdl-core';
const info = await ytdl.getBasicInfo('A8Um5kv0sg8');
console.log('Total formats:', info.formats.length);
const combined = info.formats.filter(f => f.hasVideo && f.hasAudio);
console.log('Formats with video AND audio:', combined.length);
if (combined.length > 0) {
  console.log('Sample combined formats:');
  combined.slice(0, 5).forEach(f => {
    console.log(`  itag ${f.itag}: ${f.container}, height=${f.height || 'N/A'}`);
  });
} else {
  console.log('No combined formats found');
  console.log('Sample all formats:');
  info.formats.slice(0, 10).forEach(f => {
    console.log(`  itag ${f.itag}: hasV=${f.hasVideo}, hasA=${f.hasAudio}, ${f.container}`);
  });
}
