export const runtime = 'edge';

// app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';
import { verifyAuth, sanitizeInput, rateLimit, validateWalletAddress, validateUsername } from '@/lib/authMiddleware';

interface ProfileRequestBody {
  wallet: string;
  username?: string;
  name?: string;
  avatar_url?: string;
  bio?: string;
}

// Get user profile
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', wallet)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return NextResponse.json({});
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('获取用户资料失败 ❌ Failed to get user profile:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Create or update user profile
export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request, 5, 60 * 1000) // 5 updates per minute
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Verify authentication
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: ProfileRequestBody = await request.json();
    const { wallet, username, name, avatar_url, bio } = body;

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Validate wallet address format
    if (!validateWalletAddress(wallet)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    // Verify user is authorized to update this wallet address's profile
    if (auth.walletAddress !== wallet) {
      return NextResponse.json({ error: 'Not authorized to update this wallet address profile' }, { status: 403 });
    }

    if (username) {
      // Validate username format
      if (!validateUsername(username)) {
        return NextResponse.json({ error: 'Invalid username format (3-20 characters, letters, numbers, underscores only)' }, { status: 400 });
      }

      const { data: existingUser } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('username', username)
        .neq('wallet_address', wallet) // Exclude current user
        .single();

      if (existingUser) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
      }
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('wallet_address', wallet)
      .single();

    let result: any;

    if (existingProfile) {
      // Update existing user
      // Clean input
      const cleanUsername = username ? sanitizeInput(username) : undefined;
      const cleanName = name ? sanitizeInput(name) : undefined;
      const cleanBio = bio ? sanitizeInput(bio) : undefined;
      
      // Validate avatar_url format
      let cleanAvatarUrl = avatar_url;
      if (avatar_url) {
        try {
          new URL(avatar_url); // Validate URL format
          cleanAvatarUrl = avatar_url;
        } catch {
          cleanAvatarUrl = undefined;
        }
      }
      
      result = await supabase
        .from('profiles')
        .update({
          username: cleanUsername,
          name: cleanName,
          avatar_url: cleanAvatarUrl,
          bio: cleanBio,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', wallet);
    } else {
      // Create new user
      // Clean input
      const cleanUsername = username ? sanitizeInput(username) : undefined;
      const cleanName = name ? sanitizeInput(name) : undefined;
      const cleanBio = bio ? sanitizeInput(bio) : undefined;
      
      // Validate avatar_url format
      let cleanAvatarUrl = avatar_url;
      if (avatar_url) {
        try {
          new URL(avatar_url); // Validate URL format
          cleanAvatarUrl = avatar_url;
        } catch {
          cleanAvatarUrl = undefined;
        }
      }
      
      result = await supabase
        .from('profiles')
        .insert([
          {
            wallet_address: wallet,
            username: cleanUsername,
            name: cleanName,
            avatar_url: cleanAvatarUrl,
            bio: cleanBio,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
    }

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('保存用户资料失败 ❌ Failed to save user profile:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}