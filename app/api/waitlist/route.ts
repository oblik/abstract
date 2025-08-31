export const runtime = 'edge'; // 运行时环境 Runtime environment

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 创建 Supabase 客户端实例 Create Supabase client instance
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

interface WaitlistRequest {
  name: string; // 姓名 Name
  email: string; // 邮箱 Email
}

// 添加用户到等待列表 Add user to waitlist
export async function POST(request: Request) {
  try {
    const { name, email }: WaitlistRequest = await request.json();

    // 检查用户是否已存在 Check if user already exists
    const { data: existingUser, error: findError } = await supabase
      .from('users') // 用户表 Users table
      .select('id')
      .eq('email', email) // 根据邮箱查找 Find by email
      .single(); // 获取单个记录 Get single record

    if (existingUser) {
      return NextResponse.json({ 
        error: '该邮箱已注册 This email is already registered.' 
      }, { status: 400 });
    }

    // PGRST116 表示未找到记录，这是正常情况
    // PGRST116 means record not found, which is normal
    if (findError && findError.code !== 'PGRST116') {
      // 如果有数据库错误（不是"未找到行"错误），返回错误
      // If there's a database error that's not related to "no rows found," return an error
      console.error('数据库查询失败 ❌ Database query error:', findError);
      return NextResponse.json({ 
        error: '数据库错误，请重试 Database error. Please try again.' 
      }, { status: 500 });
    }

    // 插入新用户（包含姓名和邮箱）
    // Insert new user with name and email
    const { error } = await supabase.from('users').insert([
      { name, email },
    ]);

    if (error) {
      console.error('插入用户数据失败 ❌ Failed to insert user data:', error);
      return NextResponse.json({ 
        error: '注册失败，请重试 Failed to register. Please try again.' 
      }, { status: 500 });
    }

    console.log('用户成功加入等待列表 ✅ Successfully added to waitlist:', { name, email });
    return NextResponse.json({ 
      success: true, 
      message: '成功加入等待列表 Successfully added to waitlist' 
    });
  } catch (error) {
    console.error('处理等待列表请求失败 ❌ Failed to process waitlist request:', error);
    return NextResponse.json({ 
      error: '服务器错误 Server error' 
    }, { status: 500 });
  }
}