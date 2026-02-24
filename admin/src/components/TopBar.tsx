import './TopBar.css';

export default function TopBar() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <header className="topbar">
            <div className="topbar__left">
                <div>
                    <div className="topbar__greeting">Xin chào, Admin 👋</div>
                    <div className="topbar__date">{dateStr}</div>
                </div>
            </div>

            <div className="topbar__right">
                <div className="topbar__search">
                    <span className="topbar__search-icon">🔍</span>
                    <input type="text" placeholder="Tìm kiếm..." />
                </div>
                <div className="topbar__avatar">A</div>
            </div>
        </header>
    );
}
