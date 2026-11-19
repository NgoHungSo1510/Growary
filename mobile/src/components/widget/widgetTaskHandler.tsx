import React from 'react';
import { getWidgetSnapshot, WidgetSnapshotData } from '../../utils/widgetSnapshot';
import { GrowaryTaskWidget } from './GrowaryTaskWidget';

export interface WidgetTaskEvent {
    widgetAction: 'WIDGET_ADDED' | 'WIDGET_UPDATE' | 'WIDGET_RESIZED' | 'WIDGET_DELETED' | 'WIDGET_CLICK';
    renderWidget: (element: React.ReactElement) => void;
}

const DEFAULT_EMPTY_SNAPSHOT: WidgetSnapshotData = {
    date: new Date().toISOString().split('T')[0],
    completedCount: 0,
    totalCount: 0,
    streak: 0,
    coins: 0,
    nextTasks: [],
    pendingSyncCount: 0,
    updatedAt: new Date().toISOString(),
};

/**
 * Handler xử lý cập nhật giao diện Android Home Screen Widget từ dữ liệu Offline Cache.
 * @param props - Sự kiện từ hệ điều hành Android Widget
 */
export async function widgetTaskHandler(props: WidgetTaskEvent): Promise<void> {
    if (props.widgetAction === 'WIDGET_DELETED') {
        return;
    }
    const snapshot = (await getWidgetSnapshot()) ?? DEFAULT_EMPTY_SNAPSHOT;
    props.renderWidget(<GrowaryTaskWidget snapshot={snapshot} />);
}

