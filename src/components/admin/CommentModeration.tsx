'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import commentApi from '@/lib/apis/comment.api';
import { CommentResponse, CommentModerationRequest } from '@/types/comment.types';
import Image from 'next/image';

export default function CommentModeration() {
  const [page, setPage] = useState(0);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const queryClient = useQueryClient();

  // Lấy danh sách pending comments
  const { data, isLoading } = useQuery({
    queryKey: ['pendingComments', page],
    queryFn: () => commentApi.getPendingComments(page, 20),
    staleTime: 30 * 1000,
  });

  // Lấy số lượng pending
  const { data: pendingCount } = useQuery({
    queryKey: ['pendingCommentsCount'],
    queryFn: () => commentApi.getPendingCommentsCount(),
    staleTime: 30 * 1000,
  });

  // Mutation duyệt/từ chối
  const moderateMutation = useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: CommentModerationRequest }) =>
      commentApi.moderateComment(commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingComments'] });
      queryClient.invalidateQueries({ queryKey: ['pendingCommentsCount'] });
      setRejectingId(null);
      setRejectionReason('');
      setEditingId(null);
      setEditedContent('');
    },
  });

  // Duyệt comment
  const handleApprove = (commentId: string) => {
    const data: CommentModerationRequest = { status: 'APPROVED' };

    // Nếu đang edit thì gửi content đã edit
    if (editingId === commentId && editedContent.trim()) {
      data.editedContent = editedContent.trim();
    }

    moderateMutation.mutate({ commentId, data });
  };

  // Từ chối comment
  const handleReject = (commentId: string) => {
    if (!rejectionReason.trim()) return;

    moderateMutation.mutate({
      commentId,
      data: {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
      },
    });
  };

  // Bắt đầu edit
  const startEdit = (comment: CommentResponse) => {
    setEditingId(comment.id);
    setEditedContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditedContent('');
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const comments = data?.content || [];
  const totalPages = data?.totalPages || 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Duyệt bình luận
          {typeof pendingCount === 'number' && pendingCount > 0 && (
            <span className="px-3 py-1 text-sm font-bold bg-red-500 text-white rounded-full">
              {pendingCount}
            </span>
          )}
        </h2>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-6 rounded-xl bg-white dark:bg-gray-800 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4" />
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-16 rounded-xl bg-white dark:bg-gray-800">
          <svg className="w-16 h-16 mx-auto text-green-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Không có bình luận nào cần duyệt</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              {/* User info */}
              <div className="flex items-start gap-3 mb-4">
                {comment.userAvatar ? (
                  <Image src={comment.userAvatar} alt={comment.userFullName} width={40} height={40} className="rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {comment.userFullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{comment.userFullName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatTimeAgo(comment.createdAt)}</p>
                </div>
              </div>

              {/* Content - có thể edit */}
              {editingId === comment.id ? (
                <div className="mb-4">
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="w-full px-4 py-3 border border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={cancelEdit} className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                      Hủy
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{editedContent.length}/500</span>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{comment.content}</p>
                </div>
              )}

              {/* Reject form */}
              {rejectingId === comment.id && (
                <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                    Lý do từ chối:
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Nhập lý do từ chối..."
                    rows={2}
                    className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleReject(comment.id)}
                      disabled={!rejectionReason.trim() || moderateMutation.isPending}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-all"
                    >
                      Xác nhận từ chối
                    </button>
                    <button
                      onClick={() => { setRejectingId(null); setRejectionReason(''); }}
                      className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {rejectingId !== comment.id && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleApprove(comment.id)}
                    disabled={moderateMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Duyệt
                  </button>
                  <button
                    onClick={() => setRejectingId(comment.id)}
                    disabled={moderateMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Từ chối
                  </button>
                  {editingId !== comment.id && (
                    <button
                      onClick={() => startEdit(comment)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Sửa nội dung
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50"
          >
            ←
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
