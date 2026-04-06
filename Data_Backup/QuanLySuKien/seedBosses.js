const mongoose = require('mongoose');

// 1. ĐIỀN CHUỖI KẾT NỐI DB
const MONGO_URI = 'mongodb+srv://hungso:ApolloVnGame%40vku.udn.vn@cluster0.mfxds.mongodb.net/growary?retryWrites=true&w=majority&appName=Cluster0';

const bossSchema = new mongoose.Schema({
    title: String,
    description: String,
    startTime: Date,
    endTime: Date,
    maxHp: Number,
    currentHp: Number,
    baseRewardCoins: Number,
    baseRewardXp: Number,
    gachaTickets: Number,
    status: { type: String, enum: ['completed', 'failed', 'active', 'upcoming'] },
    colorBg: String,
    colorIcon: String,
    iconName: String,
    rewardItems: { type: Array, default: [] }
}, { timestamps: true });

const Boss = mongoose.model('BossEvent', bossSchema);

async function seedBosses() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Kết nối thành công. Đang xóa data Boss cũ...');
        await Boss.deleteMany({}); // Xóa list cũ bị lỗi thời gian

        // Ngày bắt đầu Boss đầu tiên trong lịch sử của bạn
        let currentStartDate = new Date('2026-02-24T03:23:59.853Z');
        // Ngày hiện tại (dùng để check trạng thái)
        const NOW = new Date();

        // Danh sách Boss với mức Máu đã được thiết kế lại hợp lý hơn
        const bossConfigs = [
            { hp: 500, title: "Tuần Lễ Rèn Luyện Thể Chất", icon: "directions-run", bg: "#dc2626", ic: "#fca5a5", desc: "Vượt qua sức ỳ của bản thân, đánh bại con quái vật lười vận động!" },
            { hp: 700, title: "Thử Thách Tập Trung Cao Độ", icon: "psychology", bg: "#2563eb", ic: "#93c5fd", desc: "Đánh bại quỷ xao nhãng để lấy lại thời gian cho bản thân!" },
            { hp: 500, title: "Chiến Dịch Đọc Sách", icon: "menu-book", bg: "#059669", ic: "#6ee7b7", desc: "Quái vật Mù Chữ đang tấn công, hãy dùng tri thức để chống lại!" },
            { hp: 350, title: "Ác Quỷ Ăn Vặt Ban Đêm", icon: "fastfood", bg: "#d97706", ic: "#fcd34d", desc: "Ngăn chặn thói quen ăn đêm để bảo vệ vòng eo của bạn!" },
            { hp: 2000, title: "Trùm Trì Hoãn Công Việc", icon: "timer", bg: "#7c3aed", ic: "#c4b5fd", desc: "Không để việc hôm nay ngày mai mới làm!" }, // Boss Tháng
            { hp: 1000, title: "Quái Thú Màn Hình Điện Thoại", icon: "smartphone", bg: "#db2777", ic: "#f9a8d4", desc: "Giải phóng đôi mắt khỏi ánh sáng xanh!" },
            { hp: 1500, title: "Chúa Tể Ngủ Nướng", icon: "alarm-on", bg: "#0891b2", ic: "#67e8f9", desc: "Dậy sớm để thành công! Tiêu diệt cơn buồn ngủ!" },
            { hp: 800, title: "Bóng Ma Tự Ti", icon: "self-improvement", bg: "#4f46e5", ic: "#a5b4fc", desc: "Xây dựng sự tự tin bằng những thói quen tích cực mỗi ngày." },
            { hp: 600, title: "Vua Mua Sắm Bốc Đồng", icon: "shopping-cart-checkout", bg: "#ea580c", ic: "#fdba74", desc: "Bảo vệ túi tiền, chỉ tiêu pha vào những gì thực sự cần thiết." },
            { hp: 700, title: "Kẻ Gây Roi Rối Không Gian", icon: "cleaning-services", bg: "#65a30d", ic: "#bef264", desc: "Dọn dẹp phòng ốc, trả lại không gian sống gọn gàng!" },
            { hp: 1200, title: "Thực Thể Sống Ảo", icon: "public", bg: "#e11d48", ic: "#fecdd3", desc: "Giảm bớt thời gian lướt mạng xã hội vô bổ!" },
            { hp: 1000, title: "Linh Hồn Nóng Giận", icon: "spa", bg: "#9333ea", ic: "#d8b4fe", desc: "Thiền định và kiểm soát cảm xúc để giành chiến thắng." },
            { hp: 900, title: "Bậc Thầy Lý Do", icon: "directions-walk", bg: "#2563eb", ic: "#5eead4", desc: "Hành động thay vì viện cớ!" },
            { hp: 1100, title: "Cái Bóng Ghen Tị", icon: "emoji-objects", bg: "#0f766e", ic: "#5eead4", desc: "Tập trung vào sự phát triển của chính mình." },
            { hp: 3000, title: "Trùm Độc Hại", icon: "local-hospital", bg: "#be123c", ic: "#fda4af", desc: "Loại bỏ những thói quen tàn phá cơ thể như hút thuốc, rượu bia." } // Siêu Boss Cối
        ];

        const bossesToInsert = [];

        for (let config of bossConfigs) {
            // 1. Tính toán thời gian dựa trên máu (Trung bình 70 HP / ngày)
            let daysRequired = Math.ceil(config.hp / 70);
            let durationMs = daysRequired * 24 * 60 * 60 * 1000;
            let endTime = new Date(currentStartDate.getTime() + durationMs);

            // 2. Tính toán phần thưởng tỉ lệ thuận với lượng máu
            let coins = config.hp;
            let xp = Math.floor(config.hp * 1.2);
            let tickets = Math.max(1, Math.floor(config.hp / 300));

            // 3. Phân tích logic trạng thái dựa vào dòng thời gian thực tế
            let status = 'upcoming';
            let currentHp = config.hp;

            if (endTime < NOW) {
                status = 'completed';
                currentHp = 0; // Đã đánh xong
            } else if (currentStartDate <= NOW && endTime >= NOW) {
                status = 'active';
                // Tính lượng máu đang còn (giả lập người chơi đã đánh 1 nửa)
                currentHp = Math.floor(config.hp * 0.4);
            }

            bossesToInsert.push({
                title: config.title,
                description: config.desc,
                startTime: currentStartDate,
                endTime: endTime,
                maxHp: config.hp,
                currentHp: currentHp,
                baseRewardCoins: coins,
                baseRewardXp: xp,
                gachaTickets: tickets,
                status: status,
                colorBg: config.bg,
                colorIcon: config.ic,
                iconName: config.icon
            });

            // Ngày kết thúc của Boss này là ngày bắt đầu của Boss sau
            currentStartDate = endTime;
        }

        console.log(`Đang push ${bossesToInsert.length} Bosses vào Database...`);
        await Boss.insertMany(bossesToInsert);
        console.log('Hoàn thành! Timeline Boss đã được sắp xếp nối tiếp nhau hoàn hảo.');
        process.exit(0);
    } catch (error) {
        console.error('Lỗi:', error);
        process.exit(1);
    }
}

seedBosses();