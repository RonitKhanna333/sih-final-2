import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Try using service role key for instant user creation (no email confirmation)
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: name || email.split('@')[0],
          role: role || 'client',
        },
      });

      if (error) {
        console.error('Admin user creation failed:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ 
        message: 'Registration successful. You can now login.',
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name,
          role: data.user.user_metadata?.role || 'client',
        }
      });
    }

    // Fallback: Register user with Supabase Auth (anon key - requires email confirmation)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
          role: role || 'client',
        },
      },
    });

    if (error) {
      console.error('User signup failed:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Check if email confirmation is required
    if (data.user && !data.user.confirmed_at) {
      return NextResponse.json({ 
        message: 'Registration successful. Please check your email to confirm your account before logging in.',
        user: data.user,
        requiresConfirmation: true,
      });
    }

    return NextResponse.json({ 
      message: 'Registration successful. You can now login.',
      user: data.user
    });
  } catch (err: unknown) {
    console.error('Registration failed:', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
