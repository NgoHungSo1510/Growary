import React from 'react';

export type StatusType =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
  const normalizedStatus = String(status).toLowerCase();

  const getBadgeStyle = (): { badgeClass: string; defaultLabel: string } => {
    switch (normalizedStatus) {
      case 'active':
      case 'approved':
      case 'completed':
      case 'confirmed':
        return { badgeClass: 'badge--success', defaultLabel: label || 'Đã xác nhận' };
      case 'inactive':
      case 'rejected':
      case 'cancelled':
      case 'expired':
      case 'revoked':
        return { badgeClass: 'badge--danger', defaultLabel: label || 'Đã thu hồi / Hủy' };
      case 'pending':
      case 'in_progress':
      case 'pending_review':
      case 'flagged':
        return { badgeClass: 'badge--warning', defaultLabel: label || 'Chờ xem lại' };
      case 'auto_approved':
        return { badgeClass: 'badge--info', defaultLabel: label || '🤖 Tự duyệt' };
      default:
        return { badgeClass: 'badge--info', defaultLabel: label || status };
    }
  };

  const { badgeClass, defaultLabel } = getBadgeStyle();

  return (
    <span className={`badge ${badgeClass} ${className}`}>
      {defaultLabel}
    </span>
  );
};

export default StatusBadge;
