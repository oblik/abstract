import React, { memo, useRef, useState, useCallback } from "react";
import { CommentListProps } from "@/types/comments";
import { Loader } from "lucide-react";
import { Comment, ReplyForm } from "./comment";
import { Reply } from "lucide-react";
import { useSelector } from "@/store";


const CommentList: React.FC<CommentListProps> = (props) => {
    const { signedIn } = useSelector((state: any) => state?.auth?.session);
    const { comments, isLoading, onReply, onDelete, replyingTo, eventId, onReplyAdded, currentUserWallet, hasMore, onLoadMore, isFetching } = props;

    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
    const observer = useRef<IntersectionObserver | null>(null);

    const lastCommentRef = useCallback((node: HTMLDivElement | null) => {
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !isFetching) {
                onLoadMore();
            }
        });

        if (node) observer.current.observe(node);
    }, [hasMore, isFetching, onLoadMore]);

    const toggleReplies = (commentId: string) => {
        setExpandedComments(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    return (
        <div className="space-y-1 mb-4">
            {comments.filter((c: any) => !c.parentId).map((comment: any, index: number) => {
                const isLast = index === comments.filter((c: any) => !c.parentId).length - 1;
                const repliesForComment = comments.filter(reply => reply?.parentId === comment._id) || [];

                return (
                    <div
                        key={comment._id}
                        ref={isLast ? lastCommentRef : null}
                    >
                        <Comment
                            comment={comment}
                            onReply={onReply}
                            onDelete={onDelete}
                            isReplyOpen={replyingTo === comment._id}
                            currentUserWallet={currentUserWallet}
                        />

                        {replyingTo === comment._id && (
                            <ReplyForm
                                parentId={comment._id}
                                eventId={eventId}
                                onReplyAdded={onReplyAdded}
                                onCancel={() => onReply("")}
                                comments={comments}
                            />
                        )}

                        {/* Replies */}
                        {(() => {
                            return repliesForComment.length > 0 && (
                                <>
                                    <button
                                        onClick={() => toggleReplies(comment._id)}
                                        className="text-xs text-gray-400 hover:text-white ml-10 mt-0 sm:mt-1 flex items-center"
                                    >
                                        {expandedComments[comment._id] ? 'Hide' : 'Show'} {repliesForComment.length} {repliesForComment.length === 1 ? 'reply' : 'replies'}
                                    </button>

                                    {expandedComments[comment._id] && (
                                        <div className="ml-10 border-l-2 border-[#1f1f1f] pl-4 mt-2">
                                            {repliesForComment.map((reply: any) => (
                                                <Comment
                                                    key={reply._id}
                                                    comment={reply}
                                                    onDelete={onDelete}
                                                    currentUserWallet={currentUserWallet}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                );
            })}
            {isFetching && (
                <div className="flex justify-center items-center py-4 text-gray-400">
                    <Loader className="w-6 h-6 animate-spin" />
                    Loading more...
                </div>
            )}
            {!hasMore && signedIn && !isLoading && comments.length === 0 && (
                <p className="text-center text-sm text-gray-300 mb-2">No comments yet. Be the first to comment!</p>
            )}
        </div>

    );
};

export default memo(CommentList);