import { useState } from 'react';
import type {
    PassBoxRarity,
    PassReward,
    PassRewardType,
    SeasonPassTier,
} from '@shared';

interface Props {
    tier: SeasonPassTier;
    eliteAvatarFrameId: string;
    saving: boolean;
    onClose: () => void;
    onSave: (freeReward: PassReward | null, eliteReward: PassReward | null) => Promise<void>;
}

const DEFAULT_REWARD: PassReward = {
    type: 'coins',
    amount: 25,
    label: '25 Xu',
};

const toEditable = (reward: PassReward | null): { enabled: boolean; value: PassReward } => ({
    enabled: reward !== null,
    value: reward ? { ...reward } : { ...DEFAULT_REWARD },
});

function RewardTrackForm({
    title,
    state,
    eliteAvatarFrameId,
    onChange,
}: {
    title: string;
    state: { enabled: boolean; value: PassReward };
    eliteAvatarFrameId: string;
    onChange: (next: { enabled: boolean; value: PassReward }) => void;
}) {
    const updateValue = (patch: Partial<PassReward>) => {
        onChange({ ...state, value: { ...state.value, ...patch } });
    };

    const handleTypeChange = (type: PassRewardType) => {
        if (type === 'avatar_frame') {
            updateValue({ type, amount: 1, frameId: eliteAvatarFrameId, label: 'Khung Avatar Mùa' });
        } else if (type === 'mystery_box') {
            updateValue({ type, amount: 1, boxRarity: 'rare', label: 'Rương Hiếm' });
        } else {
            updateValue({ type, boxRarity: undefined, frameId: undefined });
        }
    };

    return (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <strong>{title}</strong>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <input
                        type="checkbox"
                        checked={state.enabled}
                        onChange={(e) => onChange({ ...state, enabled: e.target.checked })}
                    />
                    Có phần thưởng
                </label>
            </div>
            {state.enabled && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', gap: 10 }}>
                    <select
                        value={state.value.type}
                        onChange={(e) => handleTypeChange(e.target.value as PassRewardType)}
                        style={{ padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}
                    >
                        <option value="coins">Xu</option>
                        <option value="xp">EXP</option>
                        <option value="gacha_ticket">Vé Gacha</option>
                        <option value="mystery_box">Rương Bí Ẩn</option>
                        <option value="avatar_frame">Khung Avatar</option>
                    </select>
                    <input
                        type="number"
                        min={1}
                        value={state.value.amount}
                        onChange={(e) => updateValue({ amount: Math.max(1, Number(e.target.value) || 1) })}
                        style={{ padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}
                    />
                    <input
                        type="text"
                        placeholder="Nhãn hiển thị"
                        value={state.value.label}
                        onChange={(e) => updateValue({ label: e.target.value })}
                        style={{ padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}
                    />
                    {state.value.type === 'mystery_box' && (
                        <select
                            value={state.value.boxRarity ?? 'common'}
                            onChange={(e) => updateValue({ boxRarity: e.target.value as PassBoxRarity })}
                            style={{ padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', gridColumn: 'span 3' }}
                        >
                            <option value="common">Common (Rương Gỗ)</option>
                            <option value="rare">Rare (Rương Hiếm)</option>
                            <option value="epic">Epic (Rương Sử Thi)</option>
                            <option value="legendary">Legendary (Rương Vô Cực)</option>
                        </select>
                    )}
                    {state.value.type === 'avatar_frame' && (
                        <input
                            type="text"
                            placeholder="Frame ID"
                            value={state.value.frameId ?? eliteAvatarFrameId}
                            onChange={(e) => updateValue({ frameId: e.target.value })}
                            style={{ padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', gridColumn: 'span 3' }}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

export default function TierRewardEditorModal({ tier, eliteAvatarFrameId, saving, onClose, onSave }: Props) {
    const [freeState, setFreeState] = useState(() => toEditable(tier.freeReward));
    const [eliteState, setEliteState] = useState(() => toEditable(tier.eliteReward));

    const handleSubmit = async () => {
        await onSave(
            freeState.enabled ? freeState.value : null,
            eliteState.enabled ? eliteState.value : null
        );
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}
        >
            <div style={{ background: '#fff', borderRadius: 14, width: 560, maxWidth: '94vw', padding: 24 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>
                    Chỉnh sửa phần thưởng — Cấp {tier.level}
                </h3>
                <RewardTrackForm
                    title="Nhánh Tập Sự (Free)"
                    state={freeState}
                    eliteAvatarFrameId={eliteAvatarFrameId}
                    onChange={setFreeState}
                />
                <RewardTrackForm
                    title="Nhánh Tinh Anh (Elite)"
                    state={eliteState}
                    eliteAvatarFrameId={eliteAvatarFrameId}
                    onChange={setEliteState}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                    >
                        {saving ? 'Đang lưu...' : 'Lưu Cấp Thưởng'}
                    </button>
                </div>
            </div>
        </div>
    );
}

