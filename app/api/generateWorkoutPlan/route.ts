import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    // Get user ID from cookies
    const cookies = req.cookies;
    const userId = cookies.get('uid')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'User ID not found in cookies' }, { status: 400 });
    }

    // Parse request body
    const body = await req.json();
    const prompt = body?.prompt;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Initialize Groq SDK
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || '',
    });

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Missing GROQ_API_KEY' }, { status: 500 });
    }

    // Generate response using Groq
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
    });

    const workoutPlan = response.choices[0]?.message?.content || '';

    if (!workoutPlan) {
      return NextResponse.json({ error: 'Failed to generate workout plan' }, { status: 500 });
    }

    // Insert workout plan into Supabase
    const { error } = await supabase
      .from('users_workouts')
      .insert([{ user_id: userId, workout_plan: workoutPlan }]);

    if (error) {
      console.error('Error storing workout plan in Supabase:', error.message);
      return NextResponse.json({ error: 'Failed to store workout plan' }, { status: 500 });
    }

    // Redirect to the dashboard
    return NextResponse.redirect(new URL('/auth/Dashboard', req.url));
  } catch (error) {
    console.error('Error processing request:', (error as any).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}