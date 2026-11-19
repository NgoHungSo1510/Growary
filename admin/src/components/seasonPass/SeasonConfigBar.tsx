import React, { useState } from 'react';
import type { SeasonPassConfigPatch, SeasonPassDTO } from '@shared';

interface SeasonConfigBarProps {
    season: SeasonPassDTO;
    saving: boolean;
    onSaveConfig: (patch: SeasonPassConfigPatch) => Promise<void>;
}

export const SeasonConfigBar: React.FC<SeasonConfigBarProps> = ({ season, saving, onSaveConfig }) => {
    const [eliteUnlockCost, setEliteUnlockCost] = useState(season.eliteUnlockCost ?? 1500);
    const [eliteFreeVipTier, setEliteFreeVipTier] = useState(season.eliteFreeVipTier ?? 4);
    const [eliteBonusXp, setEliteBonusXp] = useState(season.eliteBonusXp ?? 500);
    const [vaultMaxDeposit, setVaultMaxDeposit] = useState(season.vaultMaxDeposit ?? 2000);
    const [vaultWithdrawLevel, setVaultWithdrawLevel] = useState(season.vaultWithdrawLevel ?? 60);
    const [vaultLastDays, setVaultLastDays] = useState(season.vaultLastDays ?? 7);
    const [defaultXpPerLevel, setDefaultXpPerLevel] = useState<number | ''>('');
    const [collapsed, setCollapsed] = useState(false);

    const handleSave = async () => {
        const patch: SeasonPassConfigPatch = {
            eliteUnlockCost,
            eliteFreeVipTier,
            eliteBonusXp,
            vaultMaxDeposit,
            vaultWithdrawLevel,
            vaultLastDays,
        };
        if (typeof defaultXpPerLevel === 'number' && defaultXpPerLevel >= 10) {
            patch.defaultXpPerLevel = defaultXpPerLevel;
        }
        await onSaveConfig(patch);
        setDefaultXpPerLevel('');
    };

    return (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: collapsed ? 0 : 16 }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        ⚙️ Cấu Hình Mùa & Sổ Tinh Anh / Két Sắt
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                        Tùy chỉnh giá mở sổ, điều kiện VIP miễn phí, giới hạn Két Sắt và EXP cấp độ
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        type="button"
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: 13 }}
                    >
                        {collapsed ? 'Mở rộng ▼' : 'Thu gọn ▲'}
                    </button>
                    {!collapsed && (
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                        >
                            {saving ? '⏳ Đang lưu...' : '💾 Lưu cấu hình'}
                        </button>
                    )}
                </div>
            </div>

            {!collapsed && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #edf2f7' }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                            💎 Giá mở Sổ Tinh Anh (Xu)
                        </label>
                        <input
                            type="number"
                            min={0}
                            value={eliteUnlockCost}
                            onChange={(e) => setEliteUnlockCost(Math.max(0, Number(e.target.value) || 0))}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                        />
                    </div>

                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #edf2f7' }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                            👑 Cấp VIP mở miễn phí (VIP Tier)
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={10}
                            value={eliteFreeVipTier}
                            onChange={(e) => setEliteFreeVipTier(Math.max(1, Number(e.target.value) || 1))}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                        />
                    </div>

                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #edf2f7' }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                            🌟 Pass XP thưởng khi mở Sổ
                        </label>
                        <input
                            type="number"
                            min={0}
                            value={eliteBonusXp}
                            onChange={(e) => setEliteBonusXp(Math.max(0, Number(e.target.value) || 0))}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                        />
                    </div>

                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #edf2f7' }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                            🏦 Sức chứa Két Sắt Mùa (Xu)
                        </label>
                        <input
                            type="number"
                            min={0}
                            value={vaultMaxDeposit}
                            onChange={(e) => setVaultMaxDeposit(Math.max(0, Number(e.target.value) || 0))}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                        />
                    </div>

                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #edf2f7' }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                            🔓 Cấp mở rút Két Sắt sớm
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={80}
                            value={vaultWithdrawLevel}
                            onChange={(e) => setVaultWithdrawLevel(Math.max(1, Number(e.target.value) || 1))}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                        />
                    </div>

                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #edf2f7' }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                            ⏳ Ngày cuối mùa cho rút Két
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={30}
                            value={vaultLastDays}
                            onChange={(e) => setVaultLastDays(Math.max(1, Number(e.target.value) || 1))}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                        />
                    </div>

                    <div style={{ background: '#fffbeb', padding: 12, borderRadius: 8, border: '1px solid #fde68a', gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>
                            ⚡ Đặt đồng loạt EXP cho toàn bộ 80 cấp (Tùy chọn)
                        </label>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <input
                                type="number"
                                min={10}
                                max={10000}
                                placeholder="Nhập EXP (ví dụ 100)"
                                value={defaultXpPerLevel}
                                onChange={(e) => setDefaultXpPerLevel(e.target.value ? Number(e.target.value) : '')}
                                style={{ width: 180, padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff' }}
                            />
                            <span style={{ fontSize: 12, color: '#78350f' }}>
                                Nhấn <strong>Lưu cấu hình</strong> để áp dụng số EXP này cho toàn bộ cấp.
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

