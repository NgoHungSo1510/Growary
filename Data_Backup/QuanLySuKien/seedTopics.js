const mongoose = require('mongoose');

// 1. CHUỖI KẾT NỐI DB
const MONGO_URI = 'mongodb+srv://hungso:ApolloVnGame%40vku.udn.vn@cluster0.mfxds.mongodb.net/growary?retryWrites=true&w=majority&appName=Cluster0';

const topicSchema = new mongoose.Schema({
  title: String,
  description: String,
  colorBg: String,
  colorAccent: String,
  totalSlots: Number,
  rewardPerEntry: { coins: Number, xp: Number, gachaTickets: Number },
  milestoneRewards: Array,
  isActive: { type: Boolean, default: true },
  order: Number
}, { timestamps: true });

const Topic = mongoose.model('CollectionTopic', topicSchema);

const palettes = [
  { bg: '#3b82f6', acc: '#ffffff' }, // Xanh dương
  { bg: '#10b981', acc: '#ffffff' }, // Xanh lá
  { bg: '#f59e0b', acc: '#ffffff' }, // Vàng cam
  { bg: '#8b5cf6', acc: '#ffffff' }, // Tím
  { bg: '#ef4444', acc: '#ffffff' }, // Đỏ
  { bg: '#14b8a6', acc: '#ffffff' }  // Xanh Teal
];

async function seedTopics() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Kết nối thành công. Đang xóa data Topic cũ...');
    await Topic.deleteMany({}); // Làm sạch data cũ

    // ==========================================
    // 50 CHỦ ĐỀ: ĐỜI SỐNG LÀ CHÍNH, KHOA HỌC LÀ PHỤ
    // (Sắp xếp từ DỄ đến KHÓ, từ TRONG NHÀ ra THẾ GIỚI)
    // ==========================================
    const rawTopics = [
      // --- TẦNG ĐẦU: TRONG NHÀ & DỄ CHỤP ẢNH (Slot nhỏ 5-10) ---
      { t: "Dụng Cụ Học Tập", d: "Bút, thước, tẩy... Nhìn trên bàn học là thấy ngay!", s: 8 },
      { t: "Trái Cây Quen Thuộc", d: "Chuối, táo, cam... trong tủ lạnh nhà bạn có gì?", s: 10 },
      { t: "Nội Thất Phòng Khách", d: "Sofa, bàn, tivi... những món đồ quen thuộc.", s: 8 },
      { t: "Đồ Dùng Nhà Bếp", d: "Dao, thớt, chảo... giúp mẹ nấu những bữa ăn ngon.", s: 12 },
      { t: "Gia Vị Nấu Ăn", d: "Mắm, muối, đường, tiêu... khám phá góc bếp.", s: 8 },
      { t: "Bữa Sáng Mỗi Ngày", d: "Bánh mì, xôi, phở... bạn ăn gì vào buổi sáng?", s: 10 },
      { t: "Đồ Dùng Vệ Sinh", d: "Bàn chải, khăn mặt, xà phòng trong phòng tắm.", s: 8 },
      { t: "Trang Phục Mùa Hè", d: "Áo phông, quần đùi, dép lê thoáng mát.", s: 8 },
      { t: "Đồ Uống Giải Khát", d: "Nước lọc, trà đá, nước cam thanh mát.", s: 8 },
      { t: "Các Loại Giày Dép", d: "Giày thể thao, dép lê, giày búp bê.", s: 6 },
      { t: "Đồ Chơi Của Bé", d: "Gấu bông, lego, ô tô đồ chơi.", s: 10 },
      { t: "Các Loại Bánh Kẹo", d: "Bim bim, kẹo mút, socola ngọt ngào.", s: 10 },
      { t: "Đồ Điện Tử Trong Nhà", d: "Quạt, điều hòa, nồi cơm điện.", s: 10 },
      { t: "Thú Cưng Trong Nhà", d: "Chó, mèo, cá cảnh... những người bạn nhỏ.", s: 5 },

      // --- TẦNG GIỮA: KHÁM PHÁ XUNG QUANH (Slot vừa 8-15) ---
      { t: "Rau Xanh Ăn Lá", d: "Rau muống, xà lách... những loại rau tốt cho sức khỏe.", s: 10 },
      { t: "Hoa Trang Trí", d: "Hoa hồng, hoa cúc, hoa ly rực rỡ.", s: 10 },
      { t: "Phương Tiện Giao Thông", d: "Xe đạp, xe máy, ô tô trên đường phố.", s: 10 },
      { t: "Cây Xanh Ngoài Trời", d: "Cây bàng, cây phượng, cây đa cổ thụ.", s: 12 },
      { t: "Côn Trùng Thường Gặp", d: "Kiến, muỗi, bướm, chuồn chuồn bay lượn.", s: 10 },
      { t: "Biển Báo Giao Thông", d: "Biển dừng lại, đèn đỏ, đường một chiều.", s: 15 },
      { t: "Món Ăn Đường Phố", d: "Xúc xích, cá viên chiên, bánh tráng trộn.", s: 12 },
      { t: "Các Loại Chim Chóc", d: "Chim sẻ, bồ câu, chào mào hót líu lo.", s: 8 },
      { t: "Vật Liệu Xây Dựng", d: "Gạch, cát, xi măng tại các công trình.", s: 8 },
      { t: "Động Vật Nông Trại", d: "Gà, vịt, bò, lợn trên các vùng quê.", s: 8 },
      { t: "Trang Phục Mùa Đông", d: "Áo len, khăn quàng, găng tay ấm áp.", s: 10 },
      { t: "Dụng Cụ Sửa Chữa", d: "Búa, kìm, tua vít của ba.", s: 10 },
      { t: "Dụng Cụ Thể Thao", d: "Quả bóng, dây nhảy, vợt cầu lông.", s: 8 },
      { t: "Dụng Cụ Y Tế Cơ Bản", d: "Bông, băng gạc, cồn sát trùng.", s: 6 },
      { t: "Các Loại Hạt & Đậu", d: "Đậu đen, đậu xanh, hạt hướng dương.", s: 12 },
      { t: "Thời Tiết Trong Ngày", d: "Nắng vàng, mưa rào, nhiều mây.", s: 5 },
      { t: "Sinh Vật Dưới Nước", d: "Tôm, cua, cá chép, ốc bươu.", s: 12 },
      { t: "Các Loại Nhạc Cụ", d: "Đàn guitar, piano, sáo trúc du dương.", s: 10 },
      { t: "Trái Cây Vùng Miền", d: "Vải thiều, nhãn lồng, sầu riêng.", s: 15 },

      // --- TẦNG CUỐI: KHOA HỌC & GIÁO DỤC CHO TRẺ (Slot tùy biến 6-20) ---
      { t: "Hành Tinh Hệ Mặt Trời", d: "Trái Đất, Sao Hỏa, Sao Mộc và các hành tinh khác.", s: 8 },
      { t: "Cơ Quan Cơ Thể Người", d: "Tim, phổi, dạ dày... tìm hiểu bộ máy kỳ diệu của chúng ta.", s: 12 },
      { t: "Khủng Long Tiền Sử", d: "Khủng long bạo chúa, khủng long ba sừng.", s: 15 },
      { t: "Động Vật Hoang Dã", d: "Sư tử, voi, hươu cao cổ trên thảo nguyên.", s: 15 },
      { t: "Phát Minh Vĩ Đại", d: "Bóng đèn, điện thoại, máy bay thay đổi thế giới.", s: 10 },
      { t: "Kỳ Quan Thế Giới", d: "Kim tự tháp, Vạn lý trường thành.", s: 10 },
      { t: "Các Loại Mây & Hiện Tượng", d: "Mây tích, sấm chớp, cầu vồng rực rỡ.", s: 12 },
      { t: "Năng Lượng Tự Nhiên", d: "Năng lượng gió, mặt trời, thủy điện.", s: 6 },
      { t: "Sinh Vật Biển Sâu", d: "Cá mập, bạch tuộc, sứa biển.", s: 15 },
      { t: "Vitamin & Dinh Dưỡng", d: "Vitamin A, B, C giúp cơ thể lớn nhanh.", s: 8 },
      { t: "Các Châu Lục Lớn", d: "Châu Á, Châu Âu, Châu Phi... bản đồ thế giới.", s: 6 },
      { t: "Vòng Đời Của Ếch", d: "Từ trứng, nòng nọc đến khi thành ếch.", s: 4 },
      { t: "Các Mùa Trong Năm", d: "Xuân, Hạ, Thu, Đông.", s: 4 }
    ];

    const topicsToInsert = [];

    rawTopics.forEach((item, index) => {
      const palette = palettes[index % palettes.length];
      
      let baseCoins = item.s >= 10 ? 15 : 10;
      let baseXp = item.s >= 10 ? 20 : 10;

      let milestones = [];
      let numMilestones = item.s <= 6 ? 2 : 3; 

      for (let i = 1; i <= numMilestones; i++) {
        let target = Math.floor((item.s / numMilestones) * i);
        if (i === numMilestones) target = item.s; 

        if (!milestones.find(m => m.target === target)) {
          milestones.push({
            target: target,
            coins: target * 10,
            xp: target * 5,
            gachaTickets: (i === numMilestones) ? 1 : 0
          });
        }
      }

      topicsToInsert.push({
        title: item.t,
        description: item.d,
        colorBg: palette.bg,
        colorAccent: palette.acc,
        totalSlots: item.s,
        rewardPerEntry: {
          coins: baseCoins,
          xp: baseXp,
          gachaTickets: 0
        },
        milestoneRewards: milestones,
        isActive: true,
        order: index
      });
    });

    console.log(`Đang push ${topicsToInsert.length} Chủ đề vào Database...`);
    await Topic.insertMany(topicsToInsert);
    console.log('Hoàn thành! Các chủ đề đời sống đã được ưu tiên lên đầu.');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
}

seedTopics();