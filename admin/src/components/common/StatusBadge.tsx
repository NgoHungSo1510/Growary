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
        return { badgeClass: 'badge--success', defaultLabel: label || 'Hoạt động' };
      case 'inactive':
      case 'rejected':
      case 'cancelled':
      case 'expired':
        return { badgeClass: 'badge--danger', defaultLabel: label || 'Đã hủy / Khóa' };
      case 'pending':
      case 'in_progress':
        return { badgeClass: 'badge--warning', defaultLabel: label || 'Đang chờ' };
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
