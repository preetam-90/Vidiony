import { getInnertube } from './src/innertube.js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load .env
dotenv.config({ path: join(process.cwd(), '.env') });

async function test() {
  console.log('--- Testing getGuide() with full logging ---');
  try {
    const yt = await getInnertube();
    console.log('Innertube ready. Logged in:', yt.session.logged_in);
    
    // Check if the guide call returns any data
    const guide = await yt.getGuide();
    console.log('Guide raw data sections:', guide.sections?.length || 0);
    console.log('Full guide structure (first 500 chars):', JSON.stringify(guide).substring(0, 500));
    
    // Check for "contents" instead of "sections"
    if ((guide as any).contents) {
        console.log('Found "contents" property in guide data.');
    }

    // Try another guide-like call if getGuide() fails
    console.log('Attempting to fetch HomeFeed contents as a guide proxy...');
    const home = await yt.getHomeFeed();
    console.log('HomeFeed sections:', (home as any).sections?.length || 0);

  } catch (err) {
    console.error('Error testing guide:', err);
  }
}

test();
