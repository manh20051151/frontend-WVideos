'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import commentApi from '@/lib/apis/comment.api';
import CommentItem from './CommentItem';
import { useAuth } from '@/lib/hooks/useAuth';

interface CommentSectionProps {
  videoId: string;
}

export default function CommentSection({ videoId }: CommentSectionProps) {
  const [content, setContent] = useState('');
  const [page, setPage] = useState(0);
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const MAX_CHARS = 500;

  // Lấy danh sách comments
  const { data: commentsData, isLoading } = useQuery({
    queryKey: ['videoComments', videoId, page],
    queryFn: () => commentApi.getVideoComments(videoId, page, 20),
    staleTime: 2 * 60 * 1000,
  });

  // Mutation tạo comment
  const createMutation = useMutation({
    mutationFn: (commentContent: string) => commentApi.createComment(videoId, commentContent),
    onSuccess: () => {
      setContent('');
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

  // Mutation sửa comment (chỉ khi PENDING)
  const editMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      commentApi.editComment(videoId, commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoComments', videoId] });
    },
  });

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

  const comments = (commentsData?.content || []).filter(Boolean);
  const totalPages = commentsData?.totalPages || 0;

  return (
    <div className="mt-8">
      {/* Header */}
      <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Bình luận
        {commentsData?.totalElements !== undefined && (
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({commentsData.totalElements})
          </span>
        )}
      </h3>

      {/* Form thêm comment */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={MAX_CHARS}
              placeholder="Viết bình luận..."
              rows={3}
              className="w-full px-4 py-3 border border-accent rounded-xl bg-primary text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
            />
            <div className="flex items-center justify-between mt-2">
              <span className={`text-sm ${content.length > MAX_CHARS * 0.9 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                {content.length}/{MAX_CHARS}
              </span>
              <button
                type="submit"
                disabled={!content.trim() || content.length > MAX_CHARS || createMutation.isPending}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createMutation.isPending ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang gửi...
                  </>
                ) : (
                  'Bình luận'
                )}
              </button>
            </div>
          </div>
          {createMutation.isSuccess && (
            <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
              ⏳ Bình luận đã được gửi và đang chờ admin duyệt.
            </p>
          )}
          {createMutation.isError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              ❌ Lỗi khi gửi bình luận. Vui lòng thử lại.
            </p>
          )}
        </form>
      ) : (
        <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Đăng nhập
            </a>{' '}
            để bình luận
          </p>
        </div>
      )}

      {/* Danh sách comments */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-lg animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4" />
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">Chưa có bình luận nào</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Hãy là người đầu tiên bình luận!</p>
        </div>
      ) : (
        <div className="divide-y divide-accent/30">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={handleDelete}
              onEdit={handleEdit}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 transition-all"
          >
            ←
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 transition-all"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
