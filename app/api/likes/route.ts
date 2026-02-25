// API routes cannot use localStorage - this is client-side only storage
// These endpoints should be used only from client-side code
// The actual like functionality is handled by the LikedVideosProvider context

import { NextResponse } from 'next/server';

export const runtime = 'nodejs'

// GET /api/likes - Returns empty array (likes are stored client-side via context)
export async function GET(request: Request) {
  try {
    // localStorage is not available on the server
    // Likes are managed client-side via LikedVideosProvider
    return NextResponse.json({ error: 'Use LikedVideosContext on client-side' }, { status: 400 });
  } catch (error) {
    console.error("Error fetching liked videos:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/likes - Returns error (likes are stored client-side via context)
export async function POST(request: Request) {
  try {
    // localStorage is not available on the server
    // Likes are managed client-side via LikedVideosProvider
    return NextResponse.json({ error: 'Use LikedVideosContext on client-side' }, { status: 400 });
  } catch (error) {
    console.error("Error adding like:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/likes - Returns error (likes are stored client-side via context)
export async function DELETE(request: Request) {
  try {
    // localStorage is not available on the server
    // Likes are managed client-side via LikedVideosProvider
    return NextResponse.json({ error: 'Use LikedVideosContext on client-side' }, { status: 400 });
  } catch (error) {
    console.error("Error removing like:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Optional: GET /api/likes/status?videoId=... - Check like status for a specific video
// You might not need this if the like status is included in the main video data fetch
// export async function GET_STATUS(request: Request) { ... } 
// Note: Next.js Route Handlers don't support multiple functions with the same HTTP method (like GET) 
// in the same file directly. You'd need separate files (e.g., app/api/likes/status/route.ts) 
// or handle it within the main GET using query parameters if feasible. 