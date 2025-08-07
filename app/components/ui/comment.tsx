"use client";
import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { setUser } from "@/store/slices/auth/userSlice";

import { Trash2, Reply } from "lucide-react";
import CommentForm from "./CommentForm";
import { CommentProps, PostCommentRequestData } from "@/types/comments";
import CommentList from "./CommentList";
import { getComments, getCommentsPaginate, postComment } from "@/services/market";
import { toastAlert } from "@/lib/toast";
import { useSelector, useDispatch } from "react-redux";
import { SocketContext } from "@/config/socketConnectivity";
import { deleteComment } from "@/services/user";
import PopupModal from "./usernameModal";
import { isEmpty } from "@/lib/isEmpty";
import { addUserName } from "@/services/user";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { longNumbersNoDecimals } from "@/lib/roundOf";

const avatarColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-red-500",
  "bg-yellow-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-cyan-500",
];

export function Comment({
  className,
  comment,
  onReply,
  onDelete,
  isReplyOpen,
  currentUserWallet,
  ...props
}: CommentProps) {
  const user = useSelector((state: any) => state?.auth?.user || {});
  const { signedIn } = useSelector((state: any) => state?.auth?.session);

  if (!comment) {
    return null;
  }

  // Format time, e.g. "3 hours ago"
  let timeAgo = comment.createdAt
    ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
    : "";
  timeAgo = timeAgo.replace(/hours?/g, "hr").replace(/minutes?/g, "min");

  // Check if the current user is the author of this comment
  const isAuthor =
    currentUserWallet && comment.wallet_address === currentUserWallet;

  const getColorFromUsername = (username: string | undefined) => {
    try {
      if (!username || typeof username !== "string" || username.trim() === "") {
        return avatarColors[0];
      }

      let hash = 0;
      for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % avatarColors.length;
      return avatarColors[index];
    } catch {
      return avatarColors[0];
    }
  };

  return (
    <div
      className={cn("w-full pt-4 pb-4 flex items-start space-x-3", className)}
      {...props}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Link href={`/profile/@${comment?.userId?.uniqueId}`}>
          <Avatar>
            {/* {comment?.userId?.profileImg ? ( */}
              <AvatarImage
                src={comment?.userId?.profileImg}
                alt={comment?.userId?.userName}
              />
            {/* ) : ( */}
              <AvatarFallback
                className={getColorFromUsername(comment?.userId?.userName)}
              >
                {comment?.userId?.userName
                  ? comment?.userId?.userName.charAt(0).toUpperCase()
                  : "unknown".charAt(0).toUpperCase()}
              </AvatarFallback>
            {/* )} */}
          </Avatar>
        </Link>
      </div>

      <div className="flex-1 min-w-0">
        {/* Username and time */}
        <div className="flex items-center mb-1 flex-wrap gap-2">
          <span className="font-medium text-white truncate">
            <Link href={`/profile/@${comment?.userId?.uniqueId}`}>
              {comment?.userId?.userName || "Unknown user"}
            </Link>
          </span>
          {
            comment.positions && comment.positions.length == 1 ? (
              <button
                className="flex items-center gap-1 px-2 py-0.5 text-[12px] font-normal rounded"
                aria-label="Customise options"
                style={{ 
                  background: comment.positions?.[0].side == "yes" ? "#152632": "#210d1a", 
                  color: comment.positions?.[0].side == "yes" ? "#7DFDFE": "#ec4899" 
                }}
              >
                <span>{longNumbersNoDecimals(comment.positions?.[0].quantity)} | {comment.positions?.[0].label}</span>
              </button>
              ) 
              : comment.positions.length > 1 ? (
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      className="flex items-center gap-1 px-2 py-0.5 text-[12px] font-normal rounded"
                      aria-label="Customise options"
                      style={{ 
                        background: comment.positions?.[0].side == "yes" ? "#152632": "#210d1a", 
                        color: comment.positions?.[0].side == "yes" ? "#7DFDFE": "#ec4899" 
                      }}
                    >
                      <span>{longNumbersNoDecimals(comment.positions?.[0].quantity)} | {comment.positions?.[0].label}</span>
                      <ChevronDownIcon className="w-4 h-4" />
                    </button>
                  </DropdownMenu.Trigger>
      
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="comment-dropdown-content"
                      sideOffset={5}
                    >
                      {
                        comment.positions?.map(item => (
                          <DropdownMenu.Item className="px-2 py-0.5 cursor-pointer hover:bg-[#100f0f] text-[12px] font-normal flex gap-2 items-center justify-between">
                            <span 
                              style={{ 
                                background: item.side == "yes" ? "#152632": "#210d1a", 
                                color: item.side == "yes" ? "#7DFDFE": "#ec4899" 
                              }}
                            >
                              {longNumbersNoDecimals(item.quantity)}
                            </span>                  
                            <span>{item.label}</span>
                          </DropdownMenu.Item>
                        ))
                      }
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              ) 
              : null
          }
          <span className="text-xs text-gray-400">{timeAgo}</span>
        </div>

        {/* Comment content */}
        <p className="text-sm text-white whitespace-pre-wrap break-words">
          {comment.content}
        </p>

        {/* Comment actions */}
        <div className="flex mt-2 space-x-2">
          {onReply && signedIn && !comment.parentId && (
            <button
              onClick={() => onReply(comment._id)}
              className="flex items-center text-xs text-gray-400 hover:text-white"
            >
              <Reply size={14} className="mr-1" />
              {comment.reply_count ? `Reply (${comment.reply_count})` : "Reply"}
            </button>
          )}

          {user._id && onDelete && user._id === comment?.userId?._id && (
            <button
              onClick={() => onDelete(comment._id)}
              className="flex items-center text-xs text-gray-400 hover:text-red-500"
            >
              <Trash2 size={14} className="mr-1" />
              Delete
            </button>
          )}
          {/* {getTimeAgo(comment.createdAt)} */}
        </div>
      </div>
    </div>
  );
}

interface ReplyFormProps {
  parentId: string;
  eventId: string;
  onReplyAdded: (newReply: CommentProps["comment"]) => void;
  onCancel: () => void;
  comments: CommentProps["comment"][];
}

export function ReplyForm({
  parentId,
  eventId,
  onReplyAdded,
  onCancel,
  comments,
}: ReplyFormProps) {
  const { address } = useSelector(
    (state: any) => state?.walletconnect?.walletconnect
  );
  const [reply, setReply] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modelError, setModelError] = useState("");
  const [account, setaccount] = useState("");
  const user = useSelector((state: any) => state?.auth?.user || {});
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const dispatch = useDispatch();

  useEffect(() => {
    try {
      setaccount(address ? address : "");
    } catch (err) {}
  }, [address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parentComment: any = comments?.find((c: any) => c?._id === parentId);
    const parentUsername = parentComment?.userId?.userName;

    let contentToSubmit = reply.trim();
    if (parentUsername && contentToSubmit.startsWith(`@${parentUsername}`)) {
      contentToSubmit = contentToSubmit.substring(`@${parentUsername} `.length).trim();
    }

    try {
      setIsSubmitting(true);
      const reqData = {
        userId: user._id,
        eventId: eventId,
        content: contentToSubmit,
        parentId: parentId,
      };
      const { success, comment } = await postComment(reqData);
      if (!success) {
        toastAlert("error", "Failed to post comment. Please try again later.");
        return;
      }
      // toastAlert("success", "Comment posted successfully!");
      // onReplyAdded(comment);

      setReply("");
      onCancel();
    } catch (error) {
      console.error("Reply submission error:", error);
      // alert("Failed to post reply. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onchangeReply = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!user || isEmpty(user?.userName)) {
      setIsModalOpen(true);
      return;
    }
    setReply(e.target.value);
  };

  const handleSaveUsername = async (username: string): Promise<boolean> => {
    try {
      if (!username.trim()) {
        setModelError("Username cannot be empty.");
        return false;
      }
      if (username.length < 6) {
        setModelError("Username must be at least 6 characters long.");
        return false;
      }
      if (username.length > 20) {
        setModelError("Username must be at most 20 characters long.");
        return false;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setModelError(
          "Username can only contain letters, numbers, and underscores."
        );
        return false;
      }

      const reqData = {
        userName: username,
      };
      const { status, message, result } = await addUserName(reqData);

      if (!status) {
        if (message) {
          toastAlert("error", message);
        }
        return false;
      }
      console.log("result: ", result);

      setModelError("");
      dispatch(setUser(result));

      toastAlert("success", "Username saved successfully!");
      return true;
    } catch (error) {
      console.error("Error saving username:", error);
      toastAlert("error", "An unexpected error occurred. Please try again.");
      return false;
    }
  };

  // Set initial reply text with username mention
  useEffect(() => {
    // Find the parent comment to get the username
    const parentComment: any = comments?.find((c: any) => c?._id === parentId);
    if (parentComment?.userId?.userName) {
      setReply(`@${parentComment?.userId?.userName} `);
    }
  }, [parentId, comments]);

  // Auto-focus the input when the form is rendered
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="mt-2 mb-3 ml-10 transition-all duration-300 ease-in-out transform origin-top"
      >
        <div className="relative w-full flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Add comment..."
            className="flex-1 px-4 py-3 bg-[#0f0f0f] border border-input rounded-xl text-white focus:border-input focus:outline-none text-base min-w-0 !pr-16 lg:pr-32 transition-all duration-200"
            disabled={isSubmitting}
            maxLength={300}
          />
          <Button
            type="submit"
            disabled={isSubmitting || !reply.trim()}
            className="absolute right-2 top-2 bottom-2 h-auto px-4 bg-transparent border-none text-white hover:bg-[#232326] hover:text-white transition-colors duration-300 rounded-md"
          >
            {isSubmitting ? "Posting..." : "Reply"}
          </Button>
        </div>
      </form>
      <PopupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUsername}
        error={modelError}
        setError={setModelError}
      />
    </>
  );
}

interface CommentSectionProps {
  eventId: string;
}

export function CommentSection({ eventId }: CommentSectionProps) {
  const socketContext = useContext(SocketContext);

  const limit = 10;
  const { address } = useSelector((state: any) => state?.walletconnect?.walletconnect);
  const [account, setaccount] = useState(address);
  const [comments, setComments] = useState<CommentProps["comment"][]>([]); // This will now hold all loaded comments
  const [isLoading, setIsLoading] = useState(false); // For the initial big load
  const [isFetching, setIsFetching] = useState(false); // For subsequent "load more" requests
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  
  const fetchComments = async (pageToFetch = 1, isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsFetching(true);
      }
  
      const response = await getCommentsPaginate(eventId, { page: pageToFetch, limit });
  
      if (!response.success) {
        setHasMore(false);
        return;
      }
  
      const { comments, positions, count } = response;
      setTotal(count);

      const positionsMap = new Map();
        positions.forEach(item => {
          const userId = item.userId.toString();
          if (!positionsMap.has(userId)) {
            positionsMap.set(userId, []);
          }
          
          positionsMap.get(userId).push({
            quantity: item.quantity,
            side: item.side,
            label: !isEmpty(item?.marketId?.groupItemTitle) 
              ? item?.marketId?.groupItemTitle 
              : (item.side === "yes" ? item.marketId.outcome[0].title : item.marketId.outcome[1].title)
          });
        });

        const addPositionsToComment = (comment) => {
          const userId = comment.userId._id?.toString() || comment.userId.toString();
          return {
            ...comment,
            positions: positionsMap.get(userId) || []
          };
        };

        const flatComments = comments.reduce((acc, comment) => {
          const { replies, ...parentComment } = comment;
          acc.push(addPositionsToComment(parentComment));
          
          if (replies?.length > 0) {
            replies.forEach(reply => {
              acc.push(addPositionsToComment(reply));
            });
          }
          
          return acc;
        }, []);
  
      setComments(prevComments => {
        if (isInitialLoad) {
          return flatComments;
        }
        return [...prevComments, ...flatComments]; // Append new comments
      });
  
      setPage(pageToFetch);
      setHasMore(comments.length === limit);
  
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };
  
  useEffect(() => {
    if (eventId) {
      fetchComments(1, true);
    }
  }, [eventId]);

  const handleReply = (commentId: string) => {
    setReplyingTo((prevState) => (prevState === commentId ? null : commentId));
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { success, message } = await deleteComment({ id: commentId });
      if (!success) {
        toastAlert(
          "error",
          message || "Failed to delete comment. Please try again later."
        );
        return;
      }

      setComments((prev) => {
        const deletedComment = prev.find((c) => c?._id === commentId);
        const newComments = prev.filter((c) => c?._id !== commentId);
        if (deletedComment?.parentId) {
          const parentIndex = newComments.findIndex(
            (c) => c?._id === deletedComment.parentId
          );
          if (parentIndex !== -1 && newComments[parentIndex]?.reply_count) {
            newComments[parentIndex] = {
              ...newComments[parentIndex]!,
              reply_count: Math.max(
                0,
                (newComments[parentIndex]!.reply_count || 1) - 1
              ),
            };
          }
        }
        return newComments.filter((c) => c?.parentId !== commentId);
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const loadMoreComments = () => {
    if (!isFetching && hasMore) {
      fetchComments(page + 1);
    }
  };
    
  const handleCommentAdded = () => {
    fetchComments(1, true);
  };

  useEffect(() => {
    const socket = socketContext?.socket;
    if (!socket) {
      return;
    }

    socket.on("comment", handleCommentAdded);
    return () => {
      socket.off("comment", handleCommentAdded);
    };
  }, [socketContext?.socket]);

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">
        Comments ({total})
      </h2>
      <CommentForm eventId={eventId} onCommentAdded={handleCommentAdded} />
      <CommentList
        comments={comments}
        isLoading={isLoading}
        onReply={handleReply}
        onDelete={handleDelete}
        replyingTo={replyingTo}
        eventId={eventId}
        onReplyAdded={handleCommentAdded}
        currentUserWallet={account ? account : ""}
        hasMore={hasMore}
        onLoadMore={loadMoreComments}
        isFetching={isFetching}
      />
    </div>
  );
}
