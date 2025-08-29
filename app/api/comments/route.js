export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth, sanitizeInput, rateLimit, validateWalletAddress } from '@/lib/authMiddleware';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get comments for a specific event
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
        return NextResponse.json({ error: 'Missing event ID parameter' }, { status: 400 });
    }

    try {
        // Get comments and join user information
        const { data, error } = await supabase
            .from('comments')
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
            .eq('poolID', eventId)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        // Format data and combine user info
        const formattedComments = data.map(comment => ({
            id: comment.commentID,
            created_at: comment.created_at,
            content: comment.commentBody,
            wallet_address: comment.wallet_address,
            parent_id: comment.parent_id,
            reply_count: comment.reply_count,
            username: comment.profiles?.username || comment.wallet_address.slice(0, 6) + '...',
            avatar_url: comment.profiles?.avatar_url
        }));

        return NextResponse.json(formattedComments);
    } catch (error) {
        console.error('获取评论失败 ❌ Failed to get comments:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// Add new comment
export async function POST(request) {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 10, 60 * 1000) // 10 comments per minute
    if (!rateLimitResult.allowed) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Verify authentication
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { wallet, eventId, comment, parent_id } = await request.json();

        // Validate input
        if (!wallet || !eventId || !comment) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Validate wallet address format
        if (!validateWalletAddress(wallet)) {
            return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
        }

        // Verify user is authorized to use this wallet address
        if (auth.walletAddress !== wallet) {
            return NextResponse.json({ error: 'Not authorized to use this wallet address' }, { status: 403 });
        }

        // Sanitize comment content
        const sanitizedComment = sanitizeInput(comment);
        if (sanitizedComment.length === 0) {
            return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 });
        }

        if (sanitizedComment.length > 1000) {
            return NextResponse.json({ error: 'Comment content too long' }, { status: 400 });
        }

        // Prepare comment data
        const commentData = {
            wallet_address: wallet,
            poolID: eventId,
            commentBody: sanitizedComment,
            created_at: new Date().toISOString()
        };

        // If it's a reply, add parent comment ID
        if (parent_id) {
            commentData.parent_id = parent_id;
        }

        // Insert new comment
        const { data, error } = await supabase
            .from('comments')
            .insert([commentData])
            .select();

        if (error) {
            throw error;
        }

        // Retrieve comment author information
        const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('wallet_address', wallet)
            .single();

        if (userError && userError.code !== 'PGRST116') {
            console.error('获取用户数据失败 ❌ Failed to get user data:', userError);
        }

        // Return the newly created comment
        const newComment = {
            id: data[0].commentID,
            content: data[0].commentBody,
            created_at: data[0].created_at,
            wallet_address: wallet,
            parent_id: data[0].parent_id,
            reply_count: 0,
            username: userData?.username || wallet.slice(0, 6) + '...',
            avatar_url: userData?.avatar_url
        };

        return NextResponse.json(newComment);
    } catch (error) {
        console.error('添加评论失败 ❌ Failed to add comment:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// Delete a comment
export async function DELETE(request) {
    // Verify authentication
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    
    if (!commentId) {
        return NextResponse.json({ error: 'Missing comment ID parameter' }, { status: 400 });
    }

    try {
        // First get comment info and verify ownership
        const { data: comment, error: fetchError } = await supabase
            .from('comments')
            .select('wallet_address')
            .eq('commentID', commentId)
            .single();

        if (fetchError || !comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }

        // Verify user is authorized to delete this comment
        if (comment.wallet_address !== auth.walletAddress) {
            return NextResponse.json({ error: 'Not authorized to delete this comment' }, { status: 403 });
        }

        // Execute delete operation
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('commentID', commentId);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('删除评论失败 ❌ Failed to delete comment:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}