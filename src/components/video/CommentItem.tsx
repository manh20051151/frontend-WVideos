'use client';

import { useState } from 'react';
import { CommentResponse, CommentStatus } from '@/types/comment.types';
import Image from 'next/image';

interface CommentItemProps {
  comment: CommentResponse;
  onDelete?: (commentId: string) => void;
  onEdit?: (commentId: string, newContent: string) => void;
  currentUserId?: string;
}

export default function CommentItem({ comment, onDelete, onEdit, currentUserId }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content || '');

  const MAX_CHARS = 500;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getStatusBadge = () => {
    if (comment.status === CommentStatus.PENDING) {
      return (
        <span className="text-xs px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
          Chờ duyệt
        </span>
      );
    }
    if (comment.status === CommentStatus.REJECTED) {
      return (
        <span className="text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
          Bị từ chối
        </span>
      );
    }
    return null;
  };

  const isOwner = currentUserId && comment.userId === currentUserId;
  const canEdit = isOwner && comment.status === CommentStatus.PENDING;
  const canDelete = isOwner;

  const handleSaveEdit = () => {
    if (!editContent.trim() || editContent.length > MAX_CHARS) return;
    onEdit?.(comment.id, editContent.trim());
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content || '');
    setIsEditing(false);
  };

  return (
    <div className="flex gap-3 p-4 rounded-lg hover:bg-white/5 transition-colors">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {comment.userAvatar ? (
          <Image
            src={comment.userAvatar}
            alt={comment.userFullName}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {comment.userFullName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-semibold text-foreground">
            {comment.userFullName}
          </span>
          <span className="text-sm text-foreground opacity-60">
            {formatTimeAgo(comment.createdAt)}
          </span>
          {getStatusBadge()}
        </div>

        {/* Comment content hoặc pending message */}
        {comment.canView ? (
          isEditing ? (
            // Edit mode
            <div className="mt-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={MAX_CHARS}
                rows={3}
                className="w-full px-3 py-2 border border-accent rounded-lg bg-primary text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim() || editContent.length > MAX_CHARS}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg disabled:opacity-50 transition-all"
                >
                  Lưu
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 text-sm text-foreground opacity-60 hover:opacity-100"
                >
                  Hủy
                </button>
                <span className={`text-xs ${editContent.length > MAX_CHARS * 0.9 ? 'text-red-500' : 'text-gray-400'}`}>
                  {editContent.length}/{MAX_CHARS}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-foreground opacity-90 whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          )
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm font-medium">
                Bình luận đang được kiểm duyệt
              </span>
            </div>
          </div>
        )}

        {/* Rejection reason */}
        {comment.status === CommentStatus.REJECTED && comment.rejectionReason && (
          <div className="mt-2 text-sm text-red-600 dark:text-red-400">
            <span className="font-medium">Lý do từ chối:</span> {comment.rejectionReason}
          </div>
        )}

        {/* Actions */}
        {!isEditing && (canEdit || canDelete) && (
          <div className="mt-2 flex items-center gap-3">
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Sửa
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete?.(comment.id)}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                Xóa
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
