import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import SpecialItem from '../models/SpecialItem';
import { MysteryBox } from '../models/MysteryBox';
import { GachaItem } from '../models/GachaItem';
import { GachaWeeklyEvent } from '../models/GachaWeeklyEvent';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/growary';
const BACKUP_DIR = path.resolve(__dirname, '../../../Data_Backup');

/**
 * Script sao lưu toàn bộ dữ liệu Kho đặc biệt, Rương thần bí và Vòng quay Gacha các tầng.
 * Dữ liệu xuất ra file JSON có cấu trúc trong thư mục Data_Backup/ để bảo tồn và phục vụ soạn data.
 */
async function runBackup() {
    console.log('🔄 Bắt đầu tiến trình sao lưu dữ liệu...');
    console.log(`📁 Thư mục lưu trữ: ${BACKUP_DIR}`);

    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Đã kết nối MongoDB thành công');

        // 1. Backup SpecialItems (Kho đặc biệt)
        const specialItems = await SpecialItem.find({}).lean();
        const specialItemsPath = path.join(BACKUP_DIR, 'SpecialItems_backup.json');
        fs.writeFileSync(specialItemsPath, JSON.stringify(specialItems, null, 2), 'utf-8');
        console.log(`📦 Đã sao lưu ${specialItems.length} SpecialItems -> ${specialItemsPath}`);

        // 2. Backup MysteryBoxes (Rương thần bí)
        const mysteryBoxes = await MysteryBox.find({}).lean();
        const mysteryBoxesPath = path.join(BACKUP_DIR, 'MysteryBoxes_backup.json');
        fs.writeFileSync(mysteryBoxesPath, JSON.stringify(mysteryBoxes, null, 2), 'utf-8');
        console.log(`🎁 Đã sao lưu ${mysteryBoxes.length} MysteryBoxes -> ${mysteryBoxesPath}`);

        // 3. Backup GachaItems (Vòng quay các tầng)
        const gachaItems = await GachaItem.find({}).sort({ wheelLevel: 1, probability: -1 }).lean();
        const gachaItemsPath = path.join(BACKUP_DIR, 'GachaWheel_AllTiers_backup.json');
        fs.writeFileSync(gachaItemsPath, JSON.stringify(gachaItems, null, 2), 'utf-8');
        console.log(`🎡 Đã sao lưu ${gachaItems.length} GachaItems (tất cả các tầng) -> ${gachaItemsPath}`);

        // 4. Backup GachaWeeklyEvents (Sự kiện vòng quay tuần)
        const weeklyEvents = await GachaWeeklyEvent.find({}).sort({ weekStart: -1 }).lean();
        const weeklyEventsPath = path.join(BACKUP_DIR, 'GachaWeeklyEvents_backup.json');
        fs.writeFileSync(weeklyEventsPath, JSON.stringify(weeklyEvents, null, 2), 'utf-8');
        console.log(`📅 Đã sao lưu ${weeklyEvents.length} GachaWeeklyEvents -> ${weeklyEventsPath}`);

        console.log('🎉 Hoàn tất sao lưu toàn bộ dữ liệu vào Data_Backup thành công!');
    } catch (error) {
        console.error('❌ Lỗi trong quá trình sao lưu:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Đã ngắt kết nối database.');
    }
}

if (require.main === module) {
    runBackup();
}

export { runBackup };
