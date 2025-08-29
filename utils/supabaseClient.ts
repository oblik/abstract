// utils/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 创建一个可重用的 Supabase 客户端
// create a reusable Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 为每个组件提供一个获取新客户端实例的函数
export function getSupabaseClient(): SupabaseClient {
  return supabase;
}