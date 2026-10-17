import { useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/api';
import { DailyPlan, GrantedRewards } from '../types';
import { getErrorMessage, showApiError } from '../utils/errorHandler';

export function useDailyPlan(type: 'today' | 'tomorrow' = 'today') {
    const [plan, setPlan] = useState<DailyPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPlan = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = type === 'today'
                ? await apiService.getTodayPlan()
                : await apiService.getTomorrowPlan();
            setPlan(res.plan);
            return res.plan;
        } catch (err: unknown) {
            const msg = getErrorMessage(err);
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    }, [type]);

    useEffect(() => {
        fetchPlan();
    }, [fetchPlan]);

    const completeTask = async (
        taskIndex: number,
        isCompleted: boolean,
        proofImageUrl?: string
    ): Promise<{ plan: DailyPlan; grantedRewards?: GrantedRewards } | null> => {
        if (!plan?._id) return null;
        try {
            const res = await apiService.completeTask(plan._id, taskIndex, isCompleted, proofImageUrl);
            if (res.plan) {
                setPlan(res.plan);
            }
            return res;
        } catch (err: unknown) {
            showApiError(err, 'Không thể cập nhật trạng thái nhiệm vụ');
            return null;
        }
    };

    const addTask = async (taskData: any): Promise<DailyPlan | null> => {
        if (!plan?._id) return null;
        try {
            const res = await apiService.addTaskToPlan(plan._id, taskData);
            if (res.plan) {
                setPlan(res.plan);
            }
            return res.plan;
        } catch (err: unknown) {
            showApiError(err, 'Không thể thêm nhiệm vụ');
            return null;
        }
    };

    return {
        plan,
        loading,
        error,
        refreshPlan: fetchPlan,
        completeTask,
        addTask,
        setPlan,
    };
}
