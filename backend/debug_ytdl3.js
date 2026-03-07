import ytdl from 'ytdl-core';
const info = await ytdl.getBasicInfo('A8Um5kv0sg8');
console.log('Total formats:', info.formats.length);
console.log('Sample format properties (first 3):');
info.formats.slice(0, 3).forEach(f => {
  console.log('Keys:', Object.keys(f).join(', '));
  console.log('Format:', JSON.stringify({itag: f.itag, container: f.container, qualityLabel: f.qualityLabel, codecs: f.codecs}, null, 2));
});
