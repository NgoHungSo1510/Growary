# 📋 Shop System Overhaul — Index

> Nguon: phan tich tu `v2.2-shop-system-overhaul.md` (original, giu nguyen de tham khao)
> Tong: ~14-17h dev | Chia thanh 3 plan con theo dependency

---

## Thu Tu Trien Khai (PHAI THEO DUNG THU TU)

```
V2.2  -->  V2.3  -->  V2.4
```

| Plan | File | Noi Dung Chinh | Uoc Luong | Phu Thuoc |
|------|------|---------------|-----------|-----------|
| **V2.2** | [v2.2-vip-shop-foundation.md](./v2.2-vip-shop-foundation.md) | VIP Tier + Purchase Flow + Cashback Cron + VIP Card UI | ~5-6h | Khong |
| **V2.3** | [v2.3-inventory-fragments.md](./v2.3-inventory-fragments.md) | Inventory (kho) + Mystery Box + Manh + Voucher dac biet | ~5-6h | V2.2 xong |
| **V2.4** | [v2.4-shop-events.md](./v2.4-shop-events.md) | Flash Sale (admin + cron) + SpecialWarehouse day du + Coming Soon framework | ~4-5h | V2.3 xong |

---

## Moi Plan Con Bao Gom

Moi file da co du cac phan:
1. Muc tieu (lam gi, KHONG lam gi)
2. Schema thay doi (MODIFY / NEW model)
3. Backend logic / API routes
4. Admin UI
5. Mobile UI
6. Thu tu trien khai (co uoc tinh gio tung buoc)
7. Verification checklist

---

## Files Thay Doi Tong Hop Theo Plan

### V2.2
- [MODIFY] `backend/src/models/User.ts` — 5 fields VIP
- [NEW] `backend/src/utils/vipUtils.ts`
- [NEW] `backend/src/scripts/migrateVipTiers.ts`
- [NEW] `backend/src/jobs/cashbackJob.ts`
- [MODIFY] `backend/src/utils/milestones.ts`
- [MODIFY] `backend/src/routes/rewards.ts` — purchase route
- [MODIFY] `backend/src/routes/admin.ts` — VIP config + reset
- [MODIFY] `backend/src/server.ts`
- [MODIFY] `admin/src/pages/RewardManagement.tsx` — warning banner + VIP Config tab
- [MODIFY] `admin/src/services/api.ts`
- [NEW] `mobile/src/components/VipMiniCard.tsx`
- [MODIFY] `mobile/src/screens/ShopScreen.tsx`
- [MODIFY] `mobile/src/screens/ProfileScreen.tsx`
- [MODIFY] `mobile/src/services/api.ts`
- [MODIFY] `mobile/src/types/index.ts`

### V2.3
- [MODIFY] `backend/src/models/Voucher.ts` — 3 fields manh/ship
- [NEW] `backend/src/models/UserInventory.ts`
- [NEW] `backend/src/models/MysteryBox.ts`
- [MODIFY] `backend/src/models/index.ts`
- [MODIFY] `backend/src/routes/rewards.ts` — /inventory, /open-box, /exchange-fragment
- [MODIFY] `backend/src/routes/admin.ts` — mystery-boxes, inventory, grant
- [NEW] `admin/src/pages/SpecialWarehouse.tsx` — 3 tabs (Tab 2 de V2.4)
- [MODIFY] `admin/src/App.tsx`
- [MODIFY] `admin/src/services/api.ts`
- [NEW] `mobile/src/screens/InventoryScreen.tsx`
- [MODIFY] `mobile/src/screens/ShopScreen.tsx` — bag icon + voucher selection
- [MODIFY] `mobile/src/services/api.ts`
- [MODIFY] `mobile/src/types/index.ts`

### V2.4
- [NEW] `backend/src/models/ShopEvent.ts`
- [NEW] `backend/src/models/SpecialItemConfig.ts`
- [MODIFY] `backend/src/models/index.ts`
- [NEW] `backend/src/jobs/shopEventJob.ts`
- [MODIFY] `backend/src/routes/rewards.ts` — Flash Sale trong GET + purchase
- [MODIFY] `backend/src/routes/admin.ts` — shop-events, special-items-config
- [MODIFY] `backend/src/server.ts`
- [MODIFY] `admin/src/pages/RewardManagement.tsx` — Tab "Su Kien Shop"
- [MODIFY] `admin/src/pages/SpecialWarehouse.tsx` — them Tab 2 Product->Fragment
- [MODIFY] `admin/src/services/api.ts`
- [NEW] `mobile/src/components/SaleEventModal.tsx`
- [MODIFY] `mobile/src/screens/ShopScreen.tsx` — Flash Sale Banner + SaleEventModal + gia gach
- [MODIFY] `mobile/src/services/api.ts`
- [MODIFY] `mobile/src/types/index.ts`
