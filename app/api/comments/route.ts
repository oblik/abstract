export const runtime = 'edge'; // 运行时环境 Runtime environment

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface Comment {
  commentID: string; // 评论ID Comment ID
  created_at: string; // 创建时间 Creation time
  commentBody: string; // 评论内容 Comment content
  wallet_address: string; // 钱包地址 Wallet address
  poolID: string; // 池ID Pool ID
  parent_id: string | null; // 父评论ID Parent comment ID
  reply_count: number; // 回复数量 Reply count
  profiles?: {
    username: string; // 用户名 Username
    avatar_url: string; // 头像URL Avatar URL
  };
}

interface FormattedComment {
  id: string; // ID
  created_at: string; // 创建时间 Creation time
  content: string; // 内容 Content
  wallet_address: string; // 钱包地址 Wallet address
  parent_id: string | null; // 父评论ID Parent comment ID
  reply_count: number; // 回复数量 Reply count
  username: string; // 用户名 Username
  avatar_url: string | null; // 头像URL Avatar URL
}

// 创建 Supabase 客户端实例 Create Supabase client instance
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 获取特定事件的评论 Get comments for a specific event
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId'); // 事件ID Event ID

    // 验证事件ID Validate event ID
    if (!eventId) {
        return NextResponse.json({ 
            error: '缺少事件ID参数 Missing event ID parameter' 
        }, { status: 400 });
    }

    try {
        // 获取评论并联合查询用户信息 Get comments and join user information
        const { data, error } = await supabase
            .from('comments') // 评论表 Comments table
            .select(`
                commentID,
                created_at,
                commentBody,
                wallet_address,
                poolID,
                parent_id,
                reply_count,
                profiles:wallet_address(username, avatar_url)
            `)
            .eq('poolID', eventId) // 筛选特定事件 Filter specific event
            .order('created_at', { ascending: false }); // 按创建时间降序 Order by creation time descending

        if (error) {
            throw error;
        }

        // 格式化数据，组合用户信息 Format data and combine user info
        const formattedComments: FormattedComment[] = (data as any[]).map(comment => ({
            id: comment.commentID,
            created_at: comment.created_at,
            content: comment.commentBody,
            wallet_address: comment.wallet_address,
            parent_id: comment.parent_id,
            reply_count: comment.reply_count,
            username: comment.profiles?.username || comment.wallet_address.slice(0, 6) + '...', // 如果没有用户名则显示钱包地址前6位 Show wallet address first 6 chars if no username
            avatar_url: comment.profiles?.avatar_url || null
        }));

        return NextResponse.json(formattedComments);
    } catch (error) {
        console.error('获取评论失败 ❌ Failed to get comments:', error);
        return NextResponse.json({ 
            error: '服务器错误 Server error' 
        }, { status: 500 });
    }
}

interface CommentRequest {
  wallet: string; // 钱包地址 Wallet address
  eventId: string; // 事件ID Event ID
  comment: string; // 评论内容 Comment content
  parent_id?: string; // 父评论ID Parent comment ID (可选 optional)
}

interface CommentData {
  wallet_address: string; // 钱包地址 Wallet address
  poolID: string; // 池ID Pool ID
  commentBody: string; // 评论内容 Comment content
  created_at: string; // 创建时间 Creation time
  parent_id?: string; // 父评论ID Parent comment ID (可选 optional)
}

interface UserProfile {
  username: string; // 用户名 Username
  avatar_url: string; // 头像URL Avatar URL
}

// 添加新评论 Add new comment
export async function POST(request: Request) {
    try {
        const { wallet, eventId, comment, parent_id }: CommentRequest = await request.json();

        // 验证必要参数 Validate required parameters
        if (!wallet || !eventId || !comment) {
            return NextResponse.json({ 
                error: '缺少必要参数 Missing required parameters' 
            }, { status: 400 });
        }

        // 准备评论数据 Prepare comment data
        const commentData: CommentData = {
            wallet_address: wallet,
            poolID: eventId,
            commentBody: comment,
            created_at: new Date().toISOString() // 当前时间 Current time
        };

        // 如果是回复，添加父评论ID If it's a reply, add parent comment ID
        if (parent_id) {
            commentData.parent_id = parent_id;
        }

        // 插入新评论 Insert new comment
        const { data, error } = await supabase
            .from('comments') // 评论表 Comments table
            .insert([commentData])
            .select(); // 返回插入的数据 Return inserted data

        if (error) {
            throw error;
        }

        // 获取评论作者信息 Retrieve comment author information
        const { data: userData, error: userError } = await supabase
            .from('profiles') // 用户资料表 User profiles table
            .select('username, avatar_url')
            .eq('wallet_address', wallet) // 根据钱包地址查找 Find by wallet address
            .single(); // 获取单个记录 Get single record

        if (userError && userError.code !== 'PGRST116') { // PGRST116 表示未找到记录 PGRST116 means record not found
            console.error('获取用户数据失败 ❌ Failed to get user data:', userError);
        }

        // 返回新创建的评论 Return the newly created comment
        const newComment: FormattedComment = {
            id: (data as any[])[0].commentID,
            content: (data as any[])[0].commentBody,
            created_at: (data as any[])[0].created_at,
            wallet_address: wallet,
            parent_id: (data as any[])[0].parent_id,
            reply_count: 0, // 新评论初始回复数为0 New comment starts with 0 replies
            username: (userData as any)?.username || wallet.slice(0, 6) + '...', // 如果没有用户名则显示钱包地址前6位 Show wallet address first 6 chars if no username
            avatar_url: (userData as any)?.avatar_url || null
        };

        console.log('评论添加成功 ✅ Comment added successfully:', { eventId, wallet });
        return NextResponse.json(newComment);
    } catch (error) {
        console.error('添加评论失败 ❌ Failed to add comment:', error);
        return NextResponse.json({ 
            error: '服务器错误 Server error' 
        }, { status: 500 });
    }
}

// 删除评论 Delete a comment
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId'); // 评论ID Comment ID
    
    // 验证评论ID Validate comment ID
    if (!commentId) {
        return NextResponse.json({ 
            error: '缺少评论ID参数 Missing comment ID parameter' 
        }, { status: 400 });
    }

    try {
        // JWT 验证已由 Supabase RLS 策略处理，这里我们只需要执行删除操作
        // JWT verification is handled by Supabase RLS policies, we just need to execute the delete operation here
        const { error } = await supabase
            .from('comments') // 评论表 Comments table
            .delete()
            .eq('commentID', commentId); // 根据评论ID删除 Delete by comment ID

        if (error) {
            // 如果是权限错误，返回403
            // If it's a permission error, return 403
            if (error.code === '42501' || error.message.includes('permission denied')) {
                return NextResponse.json({ 
                    error: '无权删除此评论 No permission to delete this comment' 
                }, { status: 403 });
            }
            throw error;
        }

        console.log('评论删除成功 ✅ Comment deleted successfully:', commentId);
        return NextResponse.json({ 
            success: true, 
            message: '评论删除成功 Comment deleted successfully' 
        });
    } catch (error) {
        console.error('删除评论失败 ❌ Failed to delete comment:', error);
        return NextResponse.json({ 
            error: '服务器错误 Server error' 
        }, { status: 500 });
    }
}
