'use client';

import { useState } from 'react';
import { CommentResponse, CommentStatus } from '@/types/comment.types';
import Image from 'next/image';

type CommentReactionType = 'LIKE' | 'DISLIKE';

interface CommentItemProps extends SharedCommentProps {
  comment: CommentResponse;
  compact?: boolean;
}

interface SharedCommentProps {
  onDelete?: (commentId: string) => void;
  onEdit?: (commentId: string, newContent: string) => void;
  onReact?: (commentId: string, type: CommentReactionType) => Promise<void>;
  onStartReply?: (commentId: string) => void;
  onCancelReply?: () => void;
  onSubmitReply?: (commentId: string, content: string) => Promise<void>;
  replyingToId?: string | null;
  replyPending?: boolean;
  currentUserId?: string;
  canReact?: boolean;
  canReply?: boolean;
  currentUserAvatar?: string | null;
  currentUserName?: string;
}

const MAX_CHARS = 500;

function formatCount(n?: number): string {
  const v = n ?? 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, '')}N`;
  return String(v);
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

function Avatar({
  src,
  name,
  size,
}: {
  src?: string | null;
  name?: string;
  size: number;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name || 'Avatar'}
        width={size}
        height={size}
        className="rounded-full object-cover bg-secondary"
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      className="rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold shrink-0"
    >
      {(name || 'U').charAt(0).toUpperCase()}
    </span>
  );
}

export default function CommentItem({
  comment,
  onDelete,
  onEdit,
  onReact,
  onStartReply,
  onCancelReply,
  onSubmitReply,
  replyingToId,
  replyPending = false,
  currentUserId,
  canReact = false,
  canReply = false,
  currentUserAvatar,
  currentUserName,
  compact = false,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content || '');
  const [replyContent, setReplyContent] = useState('');
  const [reaction, setReaction] = useState<CommentReactionType | null>(comment.userReaction ?? null);
  const [likeCount, setLikeCount] = useState(comment.likeCount ?? 0);
  const [dislikeCount, setDislikeCount] = useState(comment.dislikeCount ?? 0);
  const [reacting, setReacting] = useState(false);

  const avatarSize = compact ? 32 : 40;
  const isOwner = !!currentUserId && comment.userId === currentUserId;
  const canEdit =
    isOwner &&
    (comment.status === CommentStatus.PENDING || comment.status === CommentStatus.APPROVED);
  const canDelete = isOwner;

  const handleReact = async (type: CommentReactionType) => {
    if (!onReact || reacting) return;
    setReacting(true);
    // Optimistic update
    const prev = { reaction, likeCount, dislikeCount };
    const switching = reaction !== null && reaction !== type;
    let nextReaction: CommentReactionType | null;
    if (reaction === type) {
      nextReaction = null;
      if (type === 'LIKE') setLikeCount((c) => c - 1);
      else setDislikeCount((c) => c - 1);
    } else {
      nextReaction = type;
      if (switching) {
        if (type === 'LIKE') {
          setLikeCount((c) => c + 1);
          setDislikeCount((c) => c - 1);
        } else {
          setDislikeCount((c) => c + 1);
          setLikeCount((c) => c - 1);
        }
      } else {
        if (type === 'LIKE') setLikeCount((c) => c + 1);
        else setDislikeCount((c) => c + 1);
      }
    }
    setReaction(nextReaction);
    try {
      await onReact(comment.id, type);
    } catch {
      // Rollback khi lỗi
      setReaction(prev.reaction);
      setLikeCount(prev.likeCount);
      setDislikeCount(prev.dislikeCount);
    } finally {
      setReacting(false);
    }
  };

  const handleSaveEdit = () => {
    if (!editContent.trim() || editContent.length > MAX_CHARS) return;
    onEdit?.(comment.id, editContent.trim());
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content || '');
    setIsEditing(false);
  };

  const isReplyOpen = canReply && replyingToId === comment.id;
  const handleCancelReply = () => {
    setReplyContent('');
    onCancelReply?.();
  };
  const handleSubmitReply = () => {
    const trimmed = replyContent.trim();
    if (!trimmed || trimmed.length > MAX_CHARS) return;
    onSubmitReply?.(comment.id, trimmed);
    setReplyContent('');
  };

  const statusBadge = () => {
    if (comment.status === CommentStatus.PENDING) {
      return (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-medium">
          Chờ duyệt
        </span>
      );
    }
    if (comment.status === CommentStatus.REJECTED) {
      return (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium">
          Bị từ chối
        </span>
      );
    }
    return null;
  };

  return (
    <div className="group flex gap-3 py-4">
      <div className="flex-shrink-0 pt-0.5">
        <Avatar src={comment.userAvatar} name={comment.userFullName} size={avatarSize} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-semibold text-foreground ${compact ? 'text-[13px]' : ''}`}>
            {comment.userFullName || 'Người dùng'}
          </span>
          <span className="text-xs text-foreground/50">
            {formatTimeAgo(comment.createdAt)}
            {comment.isEdited && ' (đã chỉnh sửa)'}
          </span>
          {statusBadge()}
        </div>

        {comment.canView ? (
          isEditing ? (
            <div className="mt-2 rounded-xl bg-secondary p-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={MAX_CHARS}
                rows={3}
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-accent bg-primary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none transition-all"
              />
              <div className="flex items-center justify-between mt-2">
                <span
                  className={`text-xs tabular-nums ${
                    editContent.length > MAX_CHARS * 0.9 ? 'text-red-500' : 'text-foreground/50'
                  }`}
                >
                  {editContent.length}/{MAX_CHARS}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-1.5 text-sm font-medium rounded-full text-foreground/70 hover:bg-accent/10 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editContent.trim() || editContent.length > MAX_CHARS}
                    className="px-4 py-1.5 text-sm font-medium rounded-full btn-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          )
        ) : (
          <div className="mt-1 inline-flex items-center gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-3 py-2 text-yellow-700 dark:text-yellow-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="text-sm font-medium">Bình luận đang được kiểm duyệt</span>
          </div>
        )}

        {!comment.canView && comment.status === CommentStatus.REJECTED && comment.rejectionReason && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            <span className="font-medium">Lý do từ chối:</span> {comment.rejectionReason}
          </p>
        )}

        {/* Reactions + Actions */}
        {!isEditing && (
          <div className="mt-2 -ml-1 flex items-center gap-1 flex-wrap">
            <button
              onClick={() => handleReact('LIKE')}
              disabled={!canReact || reacting}
              title={canReact ? 'Thích' : 'Đăng nhập để thích'}
              aria-pressed={reaction === 'LIKE'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                reaction === 'LIKE'
                  ? 'text-accent bg-accent/15'
                  : 'text-foreground/60 hover:text-accent hover:bg-accent/10'
              } ${!canReact ? 'cursor-default opacity-70' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10v12" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"
                />
              </svg>
              {likeCount > 0 && <span className="tabular-nums">{formatCount(likeCount)}</span>}
            </button>
            <button
              onClick={() => handleReact('DISLIKE')}
              disabled={!canReact || reacting}
              title={canReact ? 'Không thích' : 'Đăng nhập để đánh giá'}
              aria-pressed={reaction === 'DISLIKE'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                reaction === 'DISLIKE'
                  ? 'text-red-500 bg-red-500/10'
                  : 'text-foreground/60 hover:text-red-500 hover:bg-red-500/10'
              } ${!canReact ? 'cursor-default opacity-70' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14V2" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"
                />
              </svg>
              {dislikeCount > 0 && <span className="tabular-nums">{formatCount(dislikeCount)}</span>}
            </button>

            {canReply && (
              <button
                onClick={() => (isReplyOpen ? handleCancelReply() : onStartReply?.(comment.id))}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium text-foreground/60 hover:text-accent hover:bg-accent/10 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
                {isReplyOpen ? 'Hủy trả lời' : 'Trả lời'}
              </button>
            )}

            {(canEdit || canDelete) && (
              <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                {canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium text-foreground/60 hover:text-accent hover:bg-accent/10 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Sửa
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => onDelete?.(comment.id)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium text-foreground/60 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Xóa
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reply composer */}
        {isReplyOpen && (
          <div className="mt-3 flex items-start gap-2">
            <div className="flex-shrink-0 pt-0.5">
              <Avatar src={currentUserAvatar} name={currentUserName} size={28} />
            </div>
            <div className="flex-1 min-w-0 rounded-xl bg-secondary p-2.5">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                maxLength={MAX_CHARS}
                rows={2}
                autoFocus
                placeholder={`Trả lời ${comment.userFullName || 'bình luận'}...`}
                className="w-full px-2 py-1.5 rounded-lg border border-transparent bg-primary text-foreground text-sm placeholder-foreground/40 focus:outline-none focus:border-accent/40 resize-none transition-colors"
              />
              <div className="flex items-center justify-between mt-1">
                <span
                  className={`text-xs tabular-nums ${
                    replyContent.length > MAX_CHARS * 0.9 ? 'text-red-500' : 'text-foreground/40'
                  }`}
                >
                  {replyContent.length}/{MAX_CHARS}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelReply}
                    disabled={replyPending}
                    className="px-3.5 py-1.5 text-sm font-medium rounded-full text-foreground/70 hover:bg-accent/10 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSubmitReply}
                    disabled={!replyContent.trim() || replyContent.length > MAX_CHARS || replyPending}
                    className="px-3.5 py-1.5 text-sm font-medium rounded-full btn-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {replyPending ? 'Đang gửi...' : 'Trả lời'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 border-l-2 border-accent/20 pl-4 space-y-1">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onDelete={onDelete}
                onEdit={onEdit}
                onReact={onReact}
                onStartReply={onStartReply}
                onCancelReply={onCancelReply}
                onSubmitReply={onSubmitReply}
                replyingToId={replyingToId}
                replyPending={replyPending}
                currentUserId={currentUserId}
                canReact={canReact}
                canReply={canReply}
                currentUserAvatar={currentUserAvatar}
                currentUserName={currentUserName}
                compact
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
