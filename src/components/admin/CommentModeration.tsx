'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import commentApi from '@/lib/apis/comment.api';
import { CommentResponse, CommentModerationRequest, CommentStatus } from '@/types/comment.types';
import Image from 'next/image';
import Link from 'next/link';

type AdminTab = 'pending' | 'all';

const STATUS_LABELS: Record<CommentStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

const STATUS_STYLES: Record<CommentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

export default function CommentModeration() {
  const [activeTab, setActiveTab] = useState<AdminTab>('pending');
  const [page, setPage] = useState(0);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CommentStatus | ''>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [banningUser, setBanningUser] = useState<CommentResponse | null>(null);
  const [banHours, setBanHours] = useState(24);
  const [banReason, setBanReason] = useState('');
  const queryClient = useQueryClient();

  // Lấy danh sách pending comments
  const { data, isLoading } = useQuery({
    queryKey: ['pendingComments', page],
    queryFn: () => commentApi.getPendingComments(page, 20),
    staleTime: 30 * 1000,
    enabled: activeTab === 'pending',
  });

  // Lấy tất cả comments (tìm kiếm + lọc trạng thái)
  const { data: allCommentsData, isLoading: allCommentsLoading } = useQuery({
    queryKey: ['allComments', page, searchQuery, statusFilter],
    queryFn: () => commentApi.getAllComments(page, 20, searchQuery || undefined, statusFilter || undefined),
    staleTime: 30 * 1000,
    enabled: activeTab === 'all',
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
      queryClient.invalidateQueries({ queryKey: ['allComments'] });
      queryClient.invalidateQueries({ queryKey: ['pendingCommentsCount'] });
      setRejectingId(null);
      setRejectionReason('');
      setEditingId(null);
      setEditedContent('');
    },
  });

  // Mutation xóa comment
  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => commentApi.adminDeleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingComments'] });
      queryClient.invalidateQueries({ queryKey: ['allComments'] });
      queryClient.invalidateQueries({ queryKey: ['pendingCommentsCount'] });
      setDeletingId(null);
    },
  });

  // Mutation khóa bình luận user
  const banMutation = useMutation({
    mutationFn: ({ userId, hours, reason }: { userId: string; hours: number; reason: string }) =>
      commentApi.banUserCommenting(userId, hours, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingComments'] });
      queryClient.invalidateQueries({ queryKey: ['allComments'] });
      setBanningUser(null);
      setBanReason('');
    },
  });

  // Mutation mở khóa bình luận user
  const unbanMutation = useMutation({
    mutationFn: (userId: string) => commentApi.removeCommentBan(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingComments'] });
      queryClient.invalidateQueries({ queryKey: ['allComments'] });
    },
  });

  // Reset về trang đầu khi đổi tab/search/filter
  const switchTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setPage(0);
  };

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

  // Xóa comment
  const handleDelete = (comment: CommentResponse) => {
    if (!confirm(`Xóa bình luận của "${comment.userFullName}"? Toàn bộ reply và reaction cũng sẽ bị xóa.`)) return;
    setDeletingId(comment.id);
    deleteMutation.mutate(comment.id);
  };

  // Mở khóa bình luận
  const handleUnban = (comment: CommentResponse) => {
    if (!confirm(`Mở khóa bình luận cho "${comment.userFullName}"?`)) return;
    unbanMutation.mutate(comment.userId);
  };

  // Xác nhận khóa bình luận
  const handleConfirmBan = () => {
    if (!banningUser || !banReason.trim()) return;
    banMutation.mutate({ userId: banningUser.userId, hours: banHours, reason: banReason.trim() });
  };

  // Kiểm tra user còn bị khóa hay không
  const isCommentBanned = (comment: CommentResponse) =>
    !!comment.commentBannedUntil && new Date(comment.commentBannedUntil).getTime() > new Date().getTime();

  const formatBannedUntil = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
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

  const comments = activeTab === 'pending' ? (data?.content || []) : (allCommentsData?.content || []);
  const totalPages = activeTab === 'pending' ? (data?.totalPages || 0) : (allCommentsData?.totalPages || 0);
  const loading = activeTab === 'pending' ? isLoading : allCommentsLoading;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Quản lý bình luận
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-accent">
        <button
          onClick={() => switchTab('pending')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-accent text-white'
              : 'text-foreground opacity-70 hover:opacity-100'
          }`}
        >
          Chờ duyệt
          {typeof pendingCount === 'number' && pendingCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => switchTab('all')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-accent text-white'
              : 'text-foreground opacity-70 hover:opacity-100'
          }`}
        >
          Tất cả bình luận
        </button>
      </div>

      {/* Toolbar (tab Tất cả) */}
      {activeTab === 'all' && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              placeholder="🔍 Tìm theo nội dung hoặc tên người dùng..."
              className="w-full px-4 py-3 pl-12 bg-secondary border border-accent rounded-lg text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent transition-all"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setPage(0); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground opacity-50 hover:opacity-100 transition-opacity"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as CommentStatus | ''); setPage(0); }}
            className="px-4 py-3 bg-secondary border border-accent rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
          >
            <option value="">Tất cả trạng thái</option>
            <option value={CommentStatus.PENDING}>Chờ duyệt</option>
            <option value={CommentStatus.APPROVED}>Đã duyệt</option>
            <option value={CommentStatus.REJECTED}>Từ chối</option>
          </select>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-6 rounded-xl bg-secondary animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-primary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-primary rounded w-1/4" />
                  <div className="h-3 bg-primary rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-16 rounded-xl bg-secondary border border-accent">
          <svg className="w-16 h-16 mx-auto text-green-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-foreground opacity-70 text-lg">
            {activeTab === 'pending'
              ? 'Không có bình luận nào cần duyệt'
              : searchQuery || statusFilter
                ? 'Không tìm thấy bình luận phù hợp'
                : 'Chưa có bình luận nào'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="p-6 rounded-xl bg-secondary border border-accent shadow-sm">
              {/* User info + status */}
              <div className="flex items-start gap-3 mb-3">
                {comment.userAvatar ? (
                  <Image src={comment.userAvatar} alt={comment.userFullName} width={40} height={40} className="rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-semibold">
                    {comment.userFullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{comment.userFullName}</p>
                  <p className="text-sm text-foreground opacity-60">{formatTimeAgo(comment.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isCommentBanned(comment) && (
                    <span
                      title={comment.commentBanReason ? `Lý do: ${comment.commentBanReason}` : undefined}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
                    >
                      🔒 Khóa BL đến {formatBannedUntil(comment.commentBannedUntil!)}
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[comment.status]}`}>
                    {STATUS_LABELS[comment.status]}
                  </span>
                </div>
              </div>

              {/* Video info */}
              <div className="mb-3">
                <Link
                  href={`/watch/${comment.videoSlug || comment.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-highlight transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {comment.videoTitle || 'Xem video'}
                </Link>
                {comment.parentId && (
                  <span className="ml-2 text-xs text-foreground opacity-50">(trả lời)</span>
                )}
              </div>

              {/* Content - có thể edit */}
              {editingId === comment.id ? (
                <div className="mb-4">
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="w-full px-4 py-3 border border-accent rounded-lg bg-primary text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={cancelEdit} className="px-3 py-1 text-sm text-foreground opacity-70 hover:opacity-100 transition-opacity">
                      Hủy
                    </button>
                    <span className="text-sm text-foreground opacity-60">{editedContent.length}/500</span>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-4 rounded-lg bg-primary">
                  <p className="text-foreground whitespace-pre-wrap">{comment.canView ? comment.content : '(nội dung bị ẩn)'}</p>
                  {comment.isEdited && (
                    <p className="mt-1 text-xs text-foreground opacity-50">(đã chỉnh sửa)</p>
                  )}
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
                      className="px-4 py-2 text-sm text-foreground opacity-70 hover:opacity-100 transition-opacity"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {rejectingId !== comment.id && (
                <div className="flex items-center gap-3 flex-wrap">
                  {comment.status === CommentStatus.PENDING && (
                    <>
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
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Từ chối
                      </button>
                    </>
                  )}
                  {editingId !== comment.id && comment.status !== CommentStatus.REJECTED && (
                    <button
                      onClick={() => startEdit(comment)}
                      className="flex items-center gap-2 px-4 py-2 btn-accent text-white text-sm font-medium rounded-lg transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Sửa nội dung
                    </button>
                  )}
                  {editingId === comment.id && (
                    <button
                      onClick={() => handleApprove(comment.id)}
                      disabled={moderateMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-all"
                    >
                      Lưu nội dung
                    </button>
                  )}
                  {isCommentBanned(comment) ? (
                    <button
                      onClick={() => handleUnban(comment)}
                      disabled={unbanMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-all"
                    >
                      🔓 Mở khóa bình luận
                    </button>
                  ) : (
                    <button
                      onClick={() => { setBanningUser(comment); setBanHours(24); setBanReason(''); }}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Khóa bình luận
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(comment)}
                    disabled={deleteMutation.isPending || deletingId === comment.id}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-all ml-auto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Xóa
                  </button>
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
            className="px-4 py-2 bg-secondary border border-accent rounded-lg text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary transition-colors"
          >
            ← Trước
          </button>
          <span className="text-sm text-foreground opacity-70 px-2">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 bg-secondary border border-accent rounded-lg text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary transition-colors"
          >
            Sau →
          </button>
        </div>
      )}

      {/* Modal khóa bình luận */}
      {banningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-primary rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-accent">
              <h3 className="text-lg font-semibold text-foreground">
                🔒 Khóa bình luận
              </h3>
              <button
                onClick={() => setBanningUser(null)}
                className="text-foreground opacity-70 hover:opacity-100 transition-opacity"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-foreground opacity-70">
                Khóa quyền bình luận của <span className="font-semibold text-foreground">{banningUser.userFullName}</span> (mọi video, bao gồm trả lời).
              </p>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Thời gian khóa
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[1, 6, 24, 72].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setBanHours(h)}
                      className={`px-2 py-2 text-sm rounded-lg border transition-all ${
                        banHours === h
                          ? 'bg-accent text-white border-accent font-semibold'
                          : 'bg-secondary text-foreground border-accent hover:bg-primary'
                      }`}
                    >
                      {h} giờ
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[168, 720, 2160, 8760].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setBanHours(h)}
                      className={`px-2 py-2 text-sm rounded-lg border transition-all ${
                        banHours === h
                          ? 'bg-accent text-white border-accent font-semibold'
                          : 'bg-secondary text-foreground border-accent hover:bg-primary'
                      }`}
                    >
                      {h === 720 ? '30 ngày' : h === 2160 ? '90 ngày' : h === 8760 ? '1 năm' : '7 ngày'}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-foreground opacity-50">
                  Hoặc nhập số giờ tùy chỉnh
                </p>
                <input
                  type="number"
                  min={1}
                  max={8760}
                  value={banHours}
                  onChange={(e) => setBanHours(Math.max(1, Math.min(8760, parseInt(e.target.value) || 1)))}
                  className="mt-1 w-full px-4 py-3 bg-secondary border border-accent rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Lý do khóa *
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="VD: Spam bình luận, nội dung không phù hợp..."
                  rows={3}
                  maxLength={255}
                  className="w-full px-4 py-3 bg-secondary border border-accent rounded-lg text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
                <p className="mt-1 text-xs text-foreground opacity-50">{banReason.length}/255</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setBanningUser(null)}
                  className="flex-1 px-4 py-2 border border-accent text-foreground rounded-lg hover:bg-secondary transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmBan}
                  disabled={!banReason.trim() || banMutation.isPending}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 transition-all"
                >
                  {banMutation.isPending ? 'Đang khóa...' : 'Xác nhận khóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}