// API routes cannot use localStorage - this is client-side only storage
// This endpoint should be used only from client-side code
// The actual like status is handled by the LikedVideosProvider context

import { NextResponse } from 'next/server';

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    // localStorage is not available on the server
    // Like status is managed client-side via LikedVideosProvider
    return NextResponse.json({ error: 'Use LikedVideosContext on client-side' }, { status: 400 });
  } catch (error) {
    console.error("Error checking like status:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
