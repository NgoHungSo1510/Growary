import React from 'react';

interface ApproveTaskData {
    planId: string;
    taskId: string;
    title: string;
    pointsReward: number;
    coinReward: number;
}

interface ApproveTaskModalProps {
    isOpen: boolean;
    data: ApproveTaskData | null;
    onClose: () => void;
    onConfirm: (planId: string, taskId: string, points: number, coins: number) => Promise<void>;
}

export const ApproveTaskModal: React.FC<ApproveTaskModalProps> = ({
    isOpen,
    data,
    onClose,
    onConfirm,
}) => {
    if (!isOpen || !data) return null;

    const [points, setPoints] = React.useState(data.pointsReward);
    const [coins, setCoins] = React.useState(data.coinReward);

    React.useEffect(() => {
        setPoints(data.pointsReward);
        setCoins(data.coinReward);
    }, [data]);

    return (
        <div className="modal">
            <div className="modal__content" style={{ maxWidth: 400 }}>
                <div className="modal__header">
                    <h2 className="modal__title">✅ Duyệt nhiệm vụ</h2>
                    <button className="modal__close" onClick={onClose}>×</button>
                </div>
                <div className="modal__body">
                    <p style={{ marginBottom: 16 }}>
                        Nhiệm vụ: <strong>{data.title}</strong>
                    </p>

                    <div className="form-group">
                        <label>Mức XP thưởng</label>
                        <input
                            type="number"
                            min="1"
                            max="10000"
                            value={points}
                            onChange={e => setPoints(Number(e.target.value))}
                            style={{ flex: 1 }}
                        />
                    </div>

                    <div className="form-group" style={{ marginTop: 16 }}>
                        <label>Mức Coin thưởng</label>
                        <input
                            type="number"
                            min="0"
                            max="10000"
                            value={coins}
                            onChange={e => setCoins(Number(e.target.value))}
                            style={{ flex: 1 }}
                        />
                    </div>
                </div>
                <div className="modal__footer">
                    <button className="btn btn--secondary" onClick={onClose}>Hủy</button>
                    <button
                        className="btn btn--success"
                        onClick={() => onConfirm(data.planId, data.taskId, points, coins)}
                    >
                        Xác nhận {points} XP + {coins} Coin
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApproveTaskModal;
