'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import commentApi from '@/lib/apis/comment.api';
import CommentItem from './CommentItem';
import { useAuth } from '@/lib/hooks/useAuth';
import Image from 'next/image';

interface CommentSectionProps {
  videoId: string;
}

const MAX_CHARS = 500;

export default function CommentSection({ videoId }: CommentSectionProps) {
  const [content, setContent] = useState('');
  const [page, setPage] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Lấy danh sách comments
  const { data: commentsData, isLoading } = useQuery({
    queryKey: ['videoComments', videoId, page],
    queryFn: () => commentApi.getVideoComments(videoId, page, 20),
    staleTime: 2 * 60 * 1000,
  });

  // Tổng số comments (gồm cả trả lời, loại đã xóa) - dùng cho badge đếm
  const { data: totalCount } = useQuery({
    queryKey: ['videoCommentsCount', videoId],
    queryFn: () => commentApi.getVideoCommentsCount(videoId),
    staleTime: 2 * 60 * 1000,
  });

  // Mutation tạo comment
  const createMutation = useMutation({
    mutationFn: (commentContent: string) => commentApi.createComment(videoId, commentContent),
    onSuccess: () => {
      setContent('');
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['videoComments', videoId] });
    },
  });

  // Mutation xóa comment
  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => commentApi.deleteComment(videoId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoComments', videoId] });
    },
  });

  // Mutation sửa comment (khi PENDING hoặc APPROVED)
  const editMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      commentApi.editComment(videoId, commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoComments', videoId] });
    },
  });

  // Mutation trả lời comment
  const replyMutation = useMutation({
    mutationFn: ({ parentId, content }: { parentId: string; content: string }) =>
      commentApi.createReply(videoId, parentId, content),
    onSuccess: () => {
      setReplyToId(null);
      queryClient.invalidateQueries({ queryKey: ['videoComments', videoId] });
    },
  });

  // Tự động ẩn thông báo thành công sau 4 giây
  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => setShowSuccess(false), 4000);
    return () => clearTimeout(timer);
  }, [showSuccess]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.length > MAX_CHARS) return;
    createMutation.mutate(content.trim());
  };

  const handleDelete = (commentId: string) => {
    if (confirm('Bạn có chắc muốn xóa bình luận này?')) {
      deleteMutation.mutate(commentId);
    }
  };

  const handleEdit = (commentId: string, newContent: string) => {
    editMutation.mutate({ commentId, content: newContent });
  };

  const handleReact = async (commentId: string, type: 'LIKE' | 'DISLIKE') => {
    await commentApi.reactToComment(commentId, type);
    // Làm mới danh sách để sắp xếp lại theo điểm like - dislike
    queryClient.invalidateQueries({ queryKey: ['videoComments', videoId] });
  };

  const handleStartReply = (commentId: string) => {
    setReplyToId((prev) => (prev === commentId ? null : commentId));
  };

  const handleCancelReply = () => {
    setReplyToId(null);
  };

  const handleSubmitReply = async (commentId: string, content: string) => {
    await replyMutation.mutateAsync({ parentId: commentId, content });
  };

  const comments = (commentsData?.content || []).filter(Boolean);
  const totalPages = commentsData?.totalPages || 0;
  // Badge hiển thị tổng comments (gồm cả reply); fallback về số top-level nếu chưa có
  const commentCount = totalCount ?? commentsData?.totalElements ?? 0;
  const nearLimit = content.length > MAX_CHARS * 0.9;

  return (
    <section className="mt-10">
      {/* Header */}
      <h3 className="flex items-center gap-2.5 mb-5">
        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent/10 text-accent">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </span>
        <span className="text-lg font-bold text-foreground">Bình luận</span>
        <span className="px-2.5 py-0.5 rounded-full bg-secondary text-sm font-semibold text-foreground/70 tabular-nums">
          {commentCount}
        </span>
      </h3>

      {/* Form thêm comment */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-2">
          <div className="flex gap-3">
            <div className="flex-shrink-0 pt-0.5">
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.fullName || 'Bạn'}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover bg-secondary"
                />
              ) : (
                <span className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold">
                  {(user?.fullName || user?.email || 'B').charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="rounded-2xl bg-secondary border border-transparent focus-within:border-accent/40 transition-colors">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={MAX_CHARS}
                  placeholder="Viết bình luận..."
                  rows={content ? 3 : 1}
                  className="w-full px-4 pt-3 pb-1 bg-transparent text-foreground text-[15px] placeholder-foreground/40 focus:outline-none resize-none"
                />
                <div className="flex items-center justify-end gap-3 px-3 pb-2.5">
                  {content && (
                    <span
                      className={`text-xs tabular-nums ${
                        nearLimit ? 'text-red-500' : 'text-foreground/40'
                      }`}
                    >
                      {content.length}/{MAX_CHARS}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!content.trim() || content.length > MAX_CHARS || createMutation.isPending}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full btn-accent text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {createMutation.isPending ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                        Bình luận
                      </>
                    )}
                  </button>
                </div>
              </div>

              {createMutation.isError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Lỗi khi gửi bình luận. Vui lòng thử lại.
                </p>
              )}
            </div>
          </div>

          {showSuccess && (
            <p className="ml-[52px] mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Bình luận đã được đăng.
            </p>
          )}
        </form>
      ) : (
        <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl bg-secondary px-4 py-5 text-sm text-foreground/70">
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('show-auth-modal', { detail: { tab: 'login' } }))}
            className="font-semibold text-accent hover:underline"
          >
            Đăng nhập
          </button>
          để tham gia bình luận
        </div>
      )}

      {/* Danh sách comments */}
      {isLoading ? (
        <div className="divide-y divide-accent/20">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 py-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-secondary shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-secondary rounded w-1/4" />
                <div className="h-3 bg-secondary rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-14">
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-accent mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </span>
          <p className="font-medium text-foreground">Chưa có bình luận nào</p>
          <p className="text-sm text-foreground/50 mt-1">Hãy là người đầu tiên bình luận!</p>
        </div>
      ) : (
        <div className="divide-y divide-accent/20">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onReact={isAuthenticated ? handleReact : undefined}
              onStartReply={isAuthenticated ? handleStartReply : undefined}
              onCancelReply={handleCancelReply}
              onSubmitReply={isAuthenticated ? handleSubmitReply : undefined}
              replyingToId={replyToId}
              replyPending={replyMutation.isPending}
              canReact={isAuthenticated}
              canReply={isAuthenticated}
              currentUserAvatar={user?.avatar}
              currentUserName={user?.fullName}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3 mt-6" aria-label="Phân trang bình luận">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            aria-label="Trang trước"
            className="p-2 rounded-full bg-secondary text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:text-accent transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm text-foreground/60 tabular-nums">
            Trang {page + 1}/{totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            aria-label="Trang sau"
            className="p-2 rounded-full bg-secondary text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:text-accent transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </nav>
      )}
    </section>
  );
}
