export const runtime = 'edge';

// app/api/spotify/callback/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
}

interface SpotifyTopArtistsResponse {
  items: SpotifyArtist[];
}

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface UserInsertData {
  name: string;
  email: string;
  spotify_id: string | null;
  top_artists: Array<{
    name: string;
    id: string;
    genres: string[];
  }>;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  if (!code || !state) {
    console.error("缺少 code 或 state 参数 ❌ Missing code or state.");
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL!}/register?status=error`);
  }

  const [email, name] = state.split(',');

  if (!email || !name) {
    console.error("缺少 email 或 name 参数 ❌ Missing email or name.");
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL!}/register?status=error`);
  }

  try {
    // Fetch Spotify token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID!}:${process.env.SPOTIFY_CLIENT_SECRET!}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL!}/api/spotify/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData: SpotifyTokenResponse = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("获取 Spotify 访问令牌失败 ❌ Failed to fetch access token:", tokenData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL!}/register?status=error`);
    }

    // Fetch top artists from Spotify
    const userTopArtistsResponse = await fetch('https://api.spotify.com/v1/me/top/artists?limit=10', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const artistData: SpotifyTopArtistsResponse = await userTopArtistsResponse.json();

    if (!userTopArtistsResponse.ok || !artistData.items) {
      console.error("获取 Spotify 热门艺术家失败 ❌ Failed to fetch top artists:", artistData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL!}/register?status=error`);
    }

    // Insert all fields at once
    const userData: UserInsertData = {
      name,
      email,
      spotify_id: artistData.items[0]?.id || null,
      top_artists: artistData.items.map((artist) => ({
        name: artist.name,
        id: artist.id,
        genres: artist.genres,
      })),
    };

    const { error: insertError } = await supabase
      .from('users')
      .insert([userData]);

    if (insertError) {
      console.error("Supabase 数据插入失败 ❌ Error inserting data in Supabase:", insertError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL!}/register?status=error`);
    }

    console.log("成功插入用户 Spotify 数据 ✅ Successfully inserted user with Spotify data for email:", email);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL!}/register/success`);
  } catch (err) {
    console.error("未知错误 ❌ Unexpected error:", err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL!}/register?status=error`);
  }
}