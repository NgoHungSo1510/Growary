const mongoose = require('mongoose');

// 1. CHUỖI KẾT NỐI DB
const MONGO_URI = 'mongodb+srv://hungso:ApolloVnGame%40vku.udn.vn@cluster0.mfxds.mongodb.net/growary?retryWrites=true&w=majority&appName=Cluster0';

// 2. Schema khớp backend: models/GachaItem.ts → model name 'GachaItem'
const gachaSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['coins', 'xp', 'tickets', 'item'], required: true },
    value: { type: Number, min: 0 },
    rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward' },
    rarity: { type: String, enum: ['normal', 'rare', 'epic', 'legend'], required: true },
    probability: { type: Number, required: true, min: 0, max: 100 },
    tier: { type: Number, default: 1, min: 1 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// ĐÚng tên model backend dùng: 'GachaItem' → collection 'gachaitems'
const GachaItem = mongoose.model('GachaItem', gachaSchema);

async function seedAllGachaTiers() {
    try {
        console.log('Đang kết nối Database...');
        await mongoose.connect(MONGO_URI);
        console.log('Kết nối thành công!');

        // Xóa data cũ ở ĐÚNG collection 'gachaitems'
        await GachaItem.deleteMany({});
        console.log('Đã xóa data GachaItem cũ.');

        // Xóa luôn collection sai tên 'gachas' nếu tồn tại (do seed cũ tạo nhầm)
        const collections = await mongoose.connection.db.listCollections({ name: 'gachas' }).toArray();
        if (collections.length > 0) {
            await mongoose.connection.db.dropCollection('gachas');
            console.log('Đã xóa collection "gachas" sai tên.');
        }

        const gachaItemsToInsert = [];
        const ADMIN_ID = new mongoose.Types.ObjectId("6995dd3be4ecb4fec89634aa");

        // ==========================================
        // BẢNG ĐIỀU KHIỂN DÀNH CHO ADMIN
        // Tương ứng từ Tầng 1 đến Tầng 10
        // ==========================================
        const baseCoins = [30, 80, 150, 300, 500, 800, 1200, 1800, 2500, 4000];
        const baseXP = [30, 60, 120, 200, 350, 550, 800, 1200, 1800, 3000];
        const epicCoins = [50, 150, 300, 600, 1000, 1800, 2800, 4000, 6000, 10000];

        for (let tier = 1; tier <= 10; tier++) {
            let currentCoin = baseCoins[tier - 1];
            let currentXP = baseXP[tier - 1];
            let currentEpicCoin = epicCoins[tier - 1];

            // 1. Normal - Xu
            gachaItemsToInsert.push({
                name: `${currentCoin} Xu`, type: 'coins', value: currentCoin,
                rarity: 'normal', probability: 30 + tier, tier, isActive: true, createdBy: ADMIN_ID
            });

            // 2. Normal - XP
            gachaItemsToInsert.push({
                name: `${currentXP} XP`, type: 'xp', value: currentXP,
                rarity: 'normal', probability: 30 + tier, tier, isActive: true, createdBy: ADMIN_ID
            });

            // 3. Rare - Vé quay
            let rareTickets = Math.max(1, Math.floor(tier / 2));
            gachaItemsToInsert.push({
                name: `${rareTickets} Vé Quay Trả Lại`, type: 'tickets', value: rareTickets,
                rarity: 'rare', probability: 15, tier, isActive: true, createdBy: ADMIN_ID
            });

            // 4. Epic - Xu Nhanh
            gachaItemsToInsert.push({
                name: `${currentEpicCoin} Xu Nhanh`, type: 'coins', value: currentEpicCoin,
                rarity: 'epic', probability: 10, tier, isActive: true, createdBy: ADMIN_ID
            });

            // 5. Epic - Vé VIP
            let epicTickets = Math.floor(tier / 1.5) + 1;
            gachaItemsToInsert.push({
                name: `${epicTickets} Vé Quay VIP`, type: 'tickets', value: epicTickets,
                rarity: 'epic', probability: Math.max(5, 10 - tier), tier, isActive: true, createdBy: ADMIN_ID
            });

            // 6. Legend
            let legendProb = Math.max(1, 11 - tier);
            if (tier < 10) {
                gachaItemsToInsert.push({
                    name: `✨ Chìa Khóa Tầng ${tier + 1}`, type: 'item',
                    rewardId: new mongoose.Types.ObjectId(),
                    rarity: 'legend', probability: legendProb, tier, isActive: true, createdBy: ADMIN_ID
                });
            } else {
                gachaItemsToInsert.push({
                    name: `👑 SIÊU JACKPOT 500,000 XU`, type: 'coins', value: 500000,
                    rarity: 'legend', probability: 1, tier, isActive: true, createdBy: ADMIN_ID
                });
            }

            // 7. Filler (Rác) - làm loãng vòng quay
            for (let filler = 1; filler < tier; filler++) {
                let trashCoin = filler * 10;
                gachaItemsToInsert.push({
                    name: `${trashCoin} Xu Lẻ`, type: 'coins', value: trashCoin,
                    rarity: 'normal', probability: 15 + tier, tier, isActive: true, createdBy: ADMIN_ID
                });
            }
        }

        console.log(`Đang push ${gachaItemsToInsert.length} vật phẩm GachaItem...`);
        await GachaItem.insertMany(gachaItemsToInsert);
        console.log('✅ Hoàn thành! Data đã vào đúng collection "gachaitems".');
        process.exit(0);
    } catch (error) {
        console.error('Lỗi:', error);
        process.exit(1);
    }
}

seedAllGachaTiers();