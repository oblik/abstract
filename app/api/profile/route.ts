export const runtime = 'edge'; // 运行时环境 Runtime environment

// 用户资料API路由 User profile API route
// app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

interface ProfileRequestBody {
  wallet: string; // 钱包地址 Wallet address
  username?: string; // 用户名 Username (可选 optional)
  name?: string; // 姓名 Name (可选 optional)
  avatar_url?: string; // 头像URL Avatar URL (可选 optional)
  bio?: string; // 个人简介 Bio (可选 optional)
}

// 获取用户资料 Get user profile
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const wallet = searchParams.get('wallet'); // 钱包地址 Wallet address

  // 验证钱包地址 Validate wallet address
  if (!wallet) {
    return NextResponse.json({ 
      error: '钱包地址是必需的 Wallet address is required' 
    }, { status: 400 });
  }

  try {
    // 从profiles表查询用户资料 Query user profile from profiles table
    const { data, error } = await supabase
      .from('profiles') // 用户资料表 User profiles table
      .select('*') // 选择所有字段 Select all fields
      .eq('wallet_address', wallet) // 根据钱包地址匹配 Match by wallet address
      .single(); // 获取单个记录 Get single record

    // PGRST116 表示记录不存在，这是正常情况
    // PGRST116 means record not found, which is normal
    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // 如果用户不存在，返回空对象
    // If user doesn't exist, return empty object
    if (!data) {
      return NextResponse.json({});
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('获取用户资料失败 ❌ Failed to get user profile:', error);
    return NextResponse.json({ 
      error: '服务器错误 Server error' 
    }, { status: 500 });
  }
}

// 创建或更新用户资料 Create or update user profile
export async function POST(request: NextRequest) {
  try {
    const body: ProfileRequestBody = await request.json();
    const { wallet, username, name, avatar_url, bio } = body;

    // 验证钱包地址 Validate wallet address
    if (!wallet) {
      return NextResponse.json({ 
        error: '钱包地址是必需的 Wallet address is required' 
      }, { status: 400 });
    }

    // 检查用户名是否已存在（如果提供了用户名）
    // Check if username already exists (if username is provided)
    if (username) {
      const { data: existingUser } = await supabase
        .from('profiles') // 用户资料表 User profiles table
        .select('wallet_address')
        .eq('username', username) // 检查用户名是否重复 Check if username is duplicate
        .neq('wallet_address', wallet) // 排除当前用户 Exclude current user
        .single(); // 获取单个记录 Get single record

      if (existingUser) {
        return NextResponse.json({ 
          error: '用户名已被占用 Username is already taken' 
        }, { status: 400 });
      }
    }

    // 检查用户是否已存在 Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles') // 用户资料表 User profiles table
      .select('wallet_address')
      .eq('wallet_address', wallet) // 根据钱包地址查找 Find by wallet address
      .single(); // 获取单个记录 Get single record

    let result;

    if (existingProfile) {
      // 更新现有用户 Update existing user
      result = await supabase
        .from('profiles') // 用户资料表 User profiles table
        .update({
          username,
          name,
          avatar_url,
          bio,
          updated_at: new Date().toISOString() // 更新时间 Update time
        })
        .eq('wallet_address', wallet); // 根据钱包地址更新 Update by wallet address
    } else {
      // 创建新用户 Create new user
      result = await supabase
        .from('profiles') // 用户资料表 User profiles table
        .insert([
          {
            wallet_address: wallet,
            username,
            name,
            avatar_url,
            bio,
            created_at: new Date().toISOString(), // 创建时间 Creation time
            updated_at: new Date().toISOString() // 更新时间 Update time
          }
        ]);
    }

    if (result.error) {
      throw result.error;
    }

    console.log(existingProfile ? '用户资料更新成功 ✅ Profile updated successfully' : '用户资料创建成功 ✅ Profile created successfully', { wallet });
    return NextResponse.json({ 
      success: true,
      message: existingProfile ? '资料更新成功 Profile updated successfully' : '资料创建成功 Profile created successfully'
    });
  } catch (error) {
    console.error('保存用户资料失败 ❌ Failed to save user profile:', error);
    return NextResponse.json({ 
      error: '服务器错误 Server error' 
    }, { status: 500 });
  }
}