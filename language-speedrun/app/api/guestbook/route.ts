import { NextResponse } from 'next/server';

interface GuestbookEntry {
  username: string;
  timestamp: number;
}

// In-memory storage for serverless environment
// This resets on each deployment — only used for showing recent players during a session
const guestbookStore: GuestbookEntry[] = [];

export async function GET() {
  return NextResponse.json({
    guestbook: guestbookStore,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data: requestData } = body;

    if (!action || typeof action !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'sign') {
      if (!requestData?.username || typeof requestData.username !== 'string') {
        return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
      }

      const username = requestData.username.trim();
      if (username.length < 2 || username.length > 20) {
        return NextResponse.json({ success: false, error: 'Username must be 2-20 characters' }, { status: 400 });
      }

      const sanitizedUsername = username.replace(/[<>"'&]/g, '');
      if (sanitizedUsername !== username) {
        return NextResponse.json({ success: false, error: 'Username contains invalid characters' }, { status: 400 });
      }

      const entry: GuestbookEntry = {
        username: sanitizedUsername,
        timestamp: Date.now()
      };

      const existingIndex = guestbookStore.findIndex(e => e.username === sanitizedUsername);
      if (existingIndex >= 0) {
        guestbookStore[existingIndex] = entry;
      } else {
        guestbookStore.push(entry);
      }

      return NextResponse.json({ success: true, entry });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
