const mongoose = require('mongoose');

// 1. CHUỖI KẾT NỐI DB
const MONGO_URI = 'mongodb+srv://hungso:ApolloVnGame%40vku.udn.vn@cluster0.mfxds.mongodb.net/growary?retryWrites=true&w=majority&appName=Cluster0';

// 2. Schema khớp backend: models/MilestoneReward.ts → model name 'MilestoneReward'
const milestoneSchema = new mongoose.Schema({
    type: { type: String, enum: ['streak', 'spending'], required: true },
    target: { type: Number, required: true, min: 1 },
    coins: { type: Number, default: 0, min: 0 },
    gachaTickets: { type: Number, default: 0, min: 0 },
    rewardItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reward' }]
}, { timestamps: true });

// ĐÚNG tên model backend dùng: 'MilestoneReward' → collection 'milestonerewards'
const MilestoneReward = mongoose.model('MilestoneReward', milestoneSchema);

async function seedMilestones() {
    try {
        console.log('Đang kết nối Database...');
        await mongoose.connect(MONGO_URI);
        console.log('Kết nối thành công!');

        // Xóa data cũ ở ĐÚNG collection 'milestonerewards'
        await MilestoneReward.deleteMany({});
        console.log('Đã xóa data MilestoneReward cũ.');

        // Xóa luôn collection sai tên 'milestonesettings' nếu tồn tại (do seed cũ tạo nhầm)
        const collections = await mongoose.connection.db.listCollections({ name: 'milestonesettings' }).toArray();
        if (collections.length > 0) {
            await mongoose.connection.db.dropCollection('milestonesettings');
            console.log('Đã xóa collection "milestonesettings" sai tên.');
        }

        const milestonesToInsert = [];

        // ==========================================
        // 3A. STREAK (Max 9.999 ngày, bước nhảy 5)
        // Vé gacha: chỉ tặng ở mốc chia hết cho 10 (10, 20, 30...)
        // Tối đa 1 vé/mốc, cap 2 vé cho mốc >= 100
        // ==========================================
        const MAX_STREAK_DAYS = 9999;
        for (let i = 5; i <= MAX_STREAK_DAYS; i += 5) {
            let tickets = 0;
            if (i % 10 === 0) {
                tickets = i >= 100 ? 2 : 1;
            }

            milestonesToInsert.push({
                type: 'streak',
                target: i,
                coins: i * 10,
                gachaTickets: tickets,
                rewardItems: []
            });
        }

        // ==========================================
        // 3B. SPENDING (Max 10.000.000)
        // Vàng: Tặng mỗi 10.000 spending (10k, 20k, 30k...)
        // Vé gacha: Tặng mỗi 15.000 spending (15k, 30k, 45k...)
        // Tối đa 1 vé/mốc, cap 2 vé cho mốc >= 150.000
        // ==========================================
        const MAX_SPENDING = 10000000;
        for (let j = 5000; j <= MAX_SPENDING; j += 5000) {
            let coins = 0;
            let tickets = 0;

            if (j % 10000 === 0) {
                coins = Math.max(100, j / 100);
            }
            if (j % 15000 === 0) {
                tickets = j >= 150000 ? 2 : 1;
            }

            if (coins === 0 && tickets === 0) continue;

            milestonesToInsert.push({
                type: 'spending',
                target: j,
                coins: coins,
                gachaTickets: tickets,
                rewardItems: []
            });
        }

        console.log(`Đang push ${milestonesToInsert.length} mốc phần thưởng MilestoneReward...`);
        await MilestoneReward.insertMany(milestonesToInsert);
        console.log('✅ Hoàn thành! Data đã vào đúng collection "milestonerewards".');
        process.exit(0);
    } catch (error) {
        console.error('Lỗi trong quá trình push data:', error);
        process.exit(1);
    }
}

seedMilestones();