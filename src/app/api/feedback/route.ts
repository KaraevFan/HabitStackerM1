import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, context } = await request.json();

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const { error } = await supabase.from('feedback').insert({
      user_id: user.id,
      message: message.trim(),
      context,
    });

    if (error) {
      console.error('[Feedback] Insert error:', error);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Feedback] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
