import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Login user with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });

    if (error) {
      console.error('Login error:', error);
      
      // Provide helpful error messages
      if (error.message.includes('Email not confirmed')) {
        return NextResponse.json({ 
          error: 'Please confirm your email before logging in. Check your inbox for the confirmation link.' 
        }, { status: 401 });
      }
      
      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json({ 
          error: 'Invalid email or password. Please check your credentials and try again.' 
        }, { status: 401 });
      }

      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!data.user) {
      return NextResponse.json({ error: 'Login failed - no user returned' }, { status: 401 });
    }

    // Return user data and session
    return NextResponse.json({ 
      message: 'Login successful',
      token: data.session?.access_token || '',
      user: {
        id: data.user.id,
        email: data.user.email || email,
        name: data.user.user_metadata?.name || email.split('@')[0],
        role: data.user.user_metadata?.role || 'client',
      },
      session: data.session,
    });
  } catch (err: unknown) {
    console.error('Login failed:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
