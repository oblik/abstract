export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const name = searchParams.get('name');

  if (!email || !name) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/register?status=error`);
  }

  const scopes = ['user-top-read'];
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/spotify/callback`;

const authUrl = `https:
    scopes.join(' ')
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(`${email},${name}`)}`;

  return NextResponse.redirect(authUrl);
}
