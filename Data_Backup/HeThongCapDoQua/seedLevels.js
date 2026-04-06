const mongoose = require('mongoose');

// 1. THAY THẾ CHUỖI KẾT NỐI DB CỦA BẠN VÀO ĐÂY
const MONGO_URI = 'mongodb+srv://hungso:ApolloVnGame%40vku.udn.vn@cluster0.mfxds.mongodb.net/growary?retryWrites=true&w=majority&appName=Cluster0';

// 2. Định nghĩa Schema (Khớp với dữ liệu cũ của bạn)
const levelSchema = new mongoose.Schema({
    level: Number,
    xpRequired: Number,
    coinReward: Number,
    gachaTickets: Number,
    unlockDescription: { type: String, default: "" },
    rewards: { type: Array, default: [] },
    rewardItems: { type: Array, default: [] }
}, { timestamps: true }); // Tự động xử lý createdAt và updatedAt

const Level = mongoose.model('Level', levelSchema);

async function seedData() {
    try {
        console.log('Đang kết nối tới Database...');
        await mongoose.connect(MONGO_URI);
        console.log('Kết nối thành công!');

        // Xóa data cũ (NẾU BẠN MUỐN LÀM SẠCH TRƯỚC KHI PUSH). 
        // Nếu chỉ muốn push nối tiếp từ cấp hiện tại, hãy comment dòng dưới lại.
        await Level.deleteMany({}); 

        const levelsToInsert = [];

        // 3. Vòng lặp tạo 200 cấp dự phòng
        for (let i = 1; i <= 200; i++) {
            // Công thức nền tảng
            let xp = i >= 5 ? i * 50 + 150 : (i === 1 ? 150 : i * 50 + 100);
            let coin = i >= 5 ? i * 20 + 200 : (i === 1 ? 200 : i * 20 + 180);
            let tickets = (i % 5 === 0) ? (i / 5) : 0;

            // Fix cứng các cấp đầu cho khớp
            if (i === 1) { xp = 150; coin = 200; }
            if (i === 2) { xp = 200; coin = 220; }
            if (i === 3) { xp = 250; coin = 240; }
            if (i === 4) { xp = 300; coin = 260; }

            // BẠN CÓ THỂ CHÈN LOGIC PHẦN THƯỞNG ĐẶC BIỆT TRƯỚC KHI PUSH Ở ĐÂY
            let customRewardItems = [];
            if (i === 10) customRewardItems = ["69ad1fa709a30390481cf962"]; // Khớp data cũ của bạn
            if (i === 50 || i === 100) customRewardItems = ["item_dac_biet_id"]; // Ví dụ thêm

            levelsToInsert.push({
                level: i,
                xpRequired: xp,
                coinReward: coin,
                gachaTickets: tickets,
                rewardItems: customRewardItems
            });
        }

        console.log('Đang tiến hành push 200 cấp độ vào Database...');
        await Level.insertMany(levelsToInsert);

        console.log('Hoàn thành! Đã push thành công.');
        process.exit(0);
    } catch (error) {
        console.error('Lỗi trong quá trình push data:', error);
        process.exit(1);
    }
}

seedData();