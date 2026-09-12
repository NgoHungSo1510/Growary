# 📦 Shop System Overhaul — Breakdown Plans v2.2 → v2.4

> **Nguon**: Phan tich tu `v2.2-shop-system-overhaul.md` (original)
> **Tong uoc luong**: ~14-17h dev (chia lam 3 plan con)
> **Muc tieu**: Moi plan con co the trien khai doc lap, khong lam ngop coder

---

## DEPENDENCY MAP

```
v2.2 VIP Foundation
  ↓ (phu thuoc)
v2.3 Inventory & Fragments
  ↓ (phu thuoc)
v2.4 Shop Events & Special Warehouse
```

> Phai lam dung thu tu. v2.3 can schema UserInventory da co (tu v2.2).
> v2.4 can Mystery Box va event infra tu v2.3.

---

---

# 🏆 V2.2 — VIP System & Shop Foundation
### ~5-6h dev | BLOCK 1 + BLOCK 5 + Cashback Job

**Muc tieu**: Thiet lap nen tang VIP tier. Sau plan nay, user co cap bac, mua hang ap discount, tich luy cashback cuoi thang.

**KHONG lam trong v2.2**: Inventory, Mystery Box, Fragments, Shop Events.

---

## Schema Thay Doi

### [MODIFY] backend/src/models/User.ts

```typescript
// Them vao IUser interface:
vipTier: number;                 // 0-11, tinh tu totalCoinsSpent
claimedVipTiers: number[];       // cac tier da nhan qua rank-up (one-time)
monthlySpending: number;         // reset cuoi thang
pendingCashback: number;         // tich luy, tra cuoi thang
lastCashbackProcessed: string;   // 'YYYY-MM', idempotency guard

// Them vao UserSchema:
vipTier: { type: Number, default: 0, min: 0, max: 11 }
claimedVipTiers: [{ type: Number }]
monthlySpending: { type: Number, default: 0, min: 0 }
pendingCashback: { type: Number, default: 0, min: 0 }
lastCashbackProcessed: { type: String, default: '' }
```

## Migration (chay 1 lan truoc deploy)

### [NEW] backend/src/scripts/migrateVipTiers.ts

```typescript
const VIP_TIERS = [
  { tier: 0, minSpending: 0 },       { tier: 1, minSpending: 30000 },
  { tier: 2, minSpending: 80000 },   { tier: 3, minSpending: 150000 },
  { tier: 4, minSpending: 250000 },  { tier: 5, minSpending: 370000 },
  { tier: 6, minSpending: 500000 },  { tier: 7, minSpending: 640000 },
  { tier: 8, minSpending: 780000 },  { tier: 9, minSpending: 870000 },
  { tier: 10, minSpending: 940000 }, { tier: 11, minSpending: 1000000 },
];
// Voi moi user:
// 1. totalCoinsSpent -> calcVipTier -> set vipTier
// 2. claimedVipTiers = [1..vipTier] (khong nhan lai qua cu)
// 3. monthlySpending=0, pendingCashback=0, lastCashbackProcessed=''
// Spending Milestones cu: GIU DB, BO KHOI purchase flow
```

Ket qua: User 300k -> Tier 3 | User 420k -> Tier 4 (KHONG nhay 7-8)

## Backend Logic

### [NEW] backend/src/utils/vipUtils.ts

```typescript
calcVipTier(totalCoinsSpent)      // tra ve 0-11
getVipConfig(tier)                // cashbackPercent, discountPercent, name, color
applyVipDiscount(price, tier)     // Math.ceil(price * (1 - discount/100))
calcCashback(actualPrice, tier)   // Math.floor(actualPrice * cashback/100)
```

### [MODIFY] backend/src/utils/milestones.ts

Bo spending type khoi purchase flow:
```typescript
if (milestone.type === 'spending') continue; // BO TU V2.2
```

### [MODIFY] backend/src/routes/rewards.ts — Purchase Route

```typescript
// Tinh gia sau VIP discount
const actualPrice = applyVipDiscount(reward.pointCost, user.vipTier);
user.coins -= actualPrice;
user.monthlySpending += actualPrice;
user.pendingCashback += calcCashback(actualPrice, user.vipTier);
user.totalCoinsSpent += actualPrice;

// Kiem tra len tier
const newTier = calcVipTier(user.totalCoinsSpent);
if (newTier > user.vipTier && !user.claimedVipTiers.includes(newTier)) {
  user.vipTier = newTier;
  user.coins += RANK_UP_GIFTS[newTier].coins;
  // grant gacha tickets, push to claimedVipTiers, tao notification
}
// Response: { voucher, remainingCoins, newVipTier?, rankUpReward? }
```

### [NEW] backend/src/jobs/cashbackJob.ts

```
Schedule: 0 17 1 * * (00:00 ngay 1 VN)
1. Query users: pendingCashback>0 AND lastCashbackProcessed != thang-truoc
2. Per user (atomic): CONG coins TRUOC -> tao notification -> RESET -> set lastCashbackProcessed
3. Idempotent: chay 2 lan cung thang -> an toan
```

### [MODIFY] backend/src/server.ts

Import + start cashbackJob.

## Admin UI

### [MODIFY] admin/src/pages/RewardManagement.tsx

Tab "Spending Milestones": Them warning banner:
```
⚠️ Spending Milestones (loai 'spending') khong con hoat dong tu V2.2.
   Giu DB de tham khao. Dung tab "Su Kien Shop" (V2.4) de tao uu dai moi.
```

Tab moi "VIP Config" (trong RewardManagement hoac trang rieng):
- Bang 12 tier (read-only)
- Nut "Reset VIP": nhap resetToTier -> confirm -> POST /admin/vip-config/reset

### API moi trong admin.ts

```
GET  /admin/vip-config              -> tra bang tier + config
POST /admin/vip-config/reset        -> { resetToTier: 3 }
     Set vipTier=resetToTier cho user co tier > resetToTier
     Clear claimedVipTiers giu lai [1..resetToTier]
     totalCoinsSpent KHONG reset
```

## Mobile UI

### [NEW] mobile/src/components/VipMiniCard.tsx

Dat sau ClayHeader, truoc featured slider trong ShopScreen:
```
+----------------------------------------------------+
| [Icon] [Ten Tier]                                  |
| [========================--------] Xk / Yk         |
| Cashback X% . Chiet khau Y% . +Z coins cho cong   |
|                                       [Chi tiet ->] |
+----------------------------------------------------+
```
- Gradient mau theo hex tier (xem bang tier o tren)
- Tier 0: "0 / 30,000 coins", khong hien cashback/discount
- "Chi tiet" -> navigate ProfileScreen, scroll den VIP section

### [MODIFY] mobile/src/screens/ProfileScreen.tsx

Them VIP Detail Section (sau thong tin ca nhan):
- Tier badge lon + progress bar
- Con X coins de len tier tiep theo
- Quyen loi hien tai: cashback%, discount%, tong chi thang
- Bang 12 cap (collapsed, "Xem tat ca" expand)
- Lich su len hang (tier + ngay)

### [MODIFY] mobile/src/screens/ShopScreen.tsx

Item card khi co VIP discount (Tier 1+):
```
~~50,000~~ coins
48,500 coins (-3%)    <- sau VIP discount
```

### [MODIFY] mobile/src/services/api.ts + types/index.ts

```typescript
// API
getVipStatus(): Promise<VipStatus>

// Types
interface VipTierInfo { tier, name, color, cashbackPercent, discountPercent, minSpending }
interface VipStatus { currentTier, nextTier?, totalCoinsSpent, monthlySpending, pendingCashback }
```

## Thu Tu Trien Khai v2.2

```
Buoc 0 (30p): Backup DB -> chay migrateVipTiers.ts -> verify output
Buoc 1 (30p): Them 5 fields vao User.ts
Buoc 2 (2h):  vipUtils.ts | sua milestones.ts | sua purchase route | cashbackJob.ts | server.ts
Buoc 3 (1h):  Admin: warning banner + VIP Config tab + API
Buoc 4 (2h):  Mobile: VipMiniCard | ProfileScreen VIP section | ShopScreen gia giam
```

## Verification v2.2

| # | Test | Expected |
|---|------|---------|
| 1 | User 300k sau migration | vipTier=3, discount 2%, cashback 3% |
| 2 | User 420k sau migration | vipTier=4, KHONG nhay tier 7-8 |
| 3 | Mua 50k, Tier 4 (3%) | Tru 48,500; pendingCashback+=2,425 |
| 4 | Mua 50k, Tier 0 | Tru 50,000, khong giam |
| 5 | Len tier lan dau | Grant coins+gacha+notification |
| 6 | Len tier lan 2 | Khong nhan qua lai |
| 7 | Cashback cron 2 lan cung thang | An toan, skip lan 2 |
| 8 | Admin reset tier 3 | vipTier->3, claimedVipTiers=[1,2,3] |
| 9 | Spending milestone cu | Khong trigger |

---

---

# 📦 V2.3 — Inventory & Fragments
### ~5-6h dev | BLOCK 3 + BLOCK 4 + Voucher Update

**Phu thuoc**: V2.2 phai xong truoc (can UserInventory tich hop voi purchase flow)

**Muc tieu**: User co kho item, nhan/mo Mystery Box, tich manh doi voucher giam gia + free ship.

**KHONG lam trong v2.3**: Shop Events, Fragment Exchange Event (Coming Soon), SpecialWarehouse admin (lam trong v2.4).

---

## Schema Thay Doi

### [MODIFY] backend/src/models/Voucher.ts

```typescript
// Them vao IVoucher:
discountAmount?: number;    // 1000, 3000, 5000, 10000 VND (tien that, khong phai coins)
hasFreeShip?: boolean;      // true = kem ve free ship
fragmentType?: string;      // 'frag_3k' - nguon goc tu doi manh

// Schema:
discountAmount: { type: Number, min: 0 }
hasFreeShip: { type: Boolean, default: false }
fragmentType: { type: String }
```

### [NEW] backend/src/models/UserInventory.ts

```typescript
interface IInventoryItem {
  itemType: string;    // 'frag_3k', 'mystery_box_boss', 'frag_freeship'
  quantity: number;
  lastUpdated: Date;
}

interface IUserInventory extends Document {
  user: ObjectId;      // 1-1 voi User (unique index)
  items: IInventoryItem[];
  updatedAt: Date;
}
// Index: { user: 1, unique: true }
```

### [NEW] backend/src/models/MysteryBox.ts

```typescript
interface IMysteryBoxReward {
  type: 'coins' | 'gacha_ticket' | 'fragment' | 'special_item';
  itemType?: string;    // 'frag_3k', 'frag_freeship'
  amount: number;
  probability: number;  // 0-100, tong cac rewards = 100
}

interface IMysteryBox extends Document {
  name: string;         // 'Hop Boss S1'
  description: string;
  imageUrl?: string;
  itemType: string;     // 'mystery_box_boss', 'mystery_box_seasonal'
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  rewards: IMysteryBoxReward[];
  isActive: boolean;
  createdBy: ObjectId;
}
```

### [MODIFY] backend/src/models/index.ts

Export UserInventory, MysteryBox (va ShopEvent, SpecialItemConfig se export trong v2.4).

## Loai Manh (Fragment Types)

| Loai | itemType | Doi duoc | Mau vien | Tan suat goi y |
|------|---------|---------|----------|----------------|
| Manh Free Ship | frag_freeship | 1 Ve Free Ship | #2196F3 | ~35% |
| Manh 1k | frag_1k | Voucher giam 1,000d | #78909C | ~25% |
| Manh 3k | frag_3k | Voucher giam 3,000d | #8D6E63 | ~20% |
| Manh 5k | frag_5k | Voucher giam 5,000d | #FFD54F | ~15% |
| Manh 10k | frag_10k | Voucher giam 10,000d | #AB47BC | ~5% |

Tat ca: **10 manh = 1 voucher** (khong exception).

Khi doi:
- Tru 10 manh khoi UserInventory
- Tao Voucher: `code = FRAG-XXXXXXXX`, `status='active'`
  - frag_freeship: `hasFreeShip=true`
  - frag_Xk: `discountAmount=X000`

## API Routes (them vao rewards.ts)

```
GET  /rewards/inventory
     -> Tra UserInventory + metadata tung itemType

POST /rewards/inventory/open-box
     Body: { itemType: 'mystery_box_boss' }
     - Kiem tra user co box trong inventory
     - Tru 1 box
     - Random reward theo MysteryBox.rewards probability
     - Cong reward (coins/gacha/manh) vao dung cho
     Response: { reward: { type, itemType, amount, displayName } }

POST /rewards/inventory/exchange-fragment
     Body: { fragmentType: 'frag_3k' }
     - Kiem tra quantity >= 10 (loi neu chua du)
     - Tru 10 manh khoi inventory
     - Tao Voucher tuong ung
     Response: { voucher }
```

## Admin API (them vao admin.ts)

```
GET  /admin/mystery-boxes          -> list tat ca Mystery Box types
POST /admin/mystery-boxes          -> tao Mystery Box moi
PUT  /admin/mystery-boxes/:id      -> sua (ten, rewards probability, isActive)
DELETE /admin/mystery-boxes/:id    -> xoa (neu chua deploy)

GET  /admin/user-inventory/:userId -> xem kho user cu the
POST /admin/inventory/grant        -> { userId, itemType, quantity, reason }
                                      -> gui item vao kho (co ghi log)
```

## Admin UI (TRONG v2.3)

### [NEW] admin/src/pages/SpecialWarehouse.tsx — Tab 1 + Tab 3 + Tab 4

> Tab 2 (Product->Fragment mapping) de lai v2.4 cung voi SpecialItemConfig.

**Tab 1: Mystery Box Management**

List cac Mystery Box da tao:
- Ten, rarity, so rewards, isActive toggle
- Nut "Sua" -> modal: ten, mo ta, rewards probability config:
  ```
  Mystery Box: Hop Boss S1
  Rewards (tong = 100%):
    [500 coins    ] [35%] [Xoa]
    [1,000 coins  ] [30%] [Xoa]
    [Gacha Ticket ] [20%] [Xoa]
    [Manh Free Ship] [10%] [Xoa]
    [Manh 3k      ] [ 4%] [Xoa]
    [Manh 5k      ] [ 1%] [Xoa]
    + Them reward
  ```
  Validate: tong % = 100 truoc khi luu.

**Tab 2 (trong v2.3 goi la "Grant Item")**

Admin gui item vao kho user:
```
User:     [Tim kiem user...]
Item:     [Dropdown: mystery_box_boss / frag_3k / frag_freeship / ...]
So luong: [10]
Ly do:    [Den bu su co / Qua tang / ...]
[Gui]
```
Co log ghi lai ai gui, cho ai, khi nao, ly do gi.

**Tab 3: Xem Kho User**
- Tim kiem user -> hien thi UserInventory (itemType, quantity, lastUpdated)

## Mobile UI

### [NEW] mobile/src/screens/InventoryScreen.tsx

Truy cap tu icon kho o top-right ShopScreen.

Layout 4 cot o vuong:
```
+------------------------------------------+
| Kho Cua Ban                          [X] |
+------------------------------------------+
| +------+ +------+ +------+ +------+      |
| | Box  | | Free | |  3k  | |  1k  |      |
| |  x2  | |  x5  | | 5/10 | | 8/10 |      |
| +------+ +------+ +------+ +------+      |
|                                          |
| +------+ +------+                        |
| |  5k  | |  SP  |                        |
| | 2/10 | |  x1  |                        |
| |[Doi!]| |      | <- badge khi >= 10     |
| +------+ +------+                        |
+------------------------------------------+
```

**O item + bottom sheet:**

| Loai | Vien | Noi dung | Action |
|------|------|---------|--------|
| Mystery Box | #FFFFFF trang | Box x 2 | "Mo" -> bottom sheet -> animation -> reveal |
| Ve Free Ship | #FFFFFF trang | Free x 5 | "Dung" khi checkout |
| Manh (chua du 10) | Mau loai | 3k - 8/10 | Tap -> bottom sheet info |
| Manh (du 10) | Mau loai | 3k - 10/10 | Badge "Doi!" o goc -> bottom sheet confirm |

**Bottom sheet manh (chua du):**
```
Manh 3k
Progress: [========--]  8/10
Can them 2 manh nua de doi
-> 1 Voucher Giam Gia 3,000d
[Dong]
```

**Bottom sheet manh (du 10):**
```
Manh 3k
Progress: [==========]  10/10
Du manh de doi!
-> 1 Voucher Giam Gia 3,000d
[Doi Ngay!]  [De Danh]
```

**Bottom sheet mo Mystery Box:**
```
Hop Boss S1
[Animated Box Icon]
"Mo hop nay?"
[Mo Hop]  [De Danh]
-- sau khi tap Mo Hop --
[Animation mo hop]
-> reveal: "1,000 coins!" hoac "Manh 3k!"
```

### [MODIFY] mobile/src/screens/ShopScreen.tsx

Them icon kho (bag icon) o top-right -> navigate InventoryScreen.

### Voucher dac biet khi mua reward

**Voucher Giam Gia (frag_Xk):**
- User mua reward -> chon "Ap voucher giam gia" -> chon voucher phu hop
- Admin thay trong ShopRedemption: "Voucher: Giam 3,000d"
- Giam tien THAT khi giao hang (khong phai coins)
- Moi don chi dung 1 voucher

**Ve Free Ship (frag_freeship):**
- User chon reward -> tick "Dung ve free ship" (hien neu co trong kho)
- Admin thay trong ShopRedemption: "Free Ship: Co"
- Khong can duyet them buoc nao

### [MODIFY] mobile/src/services/api.ts + types/index.ts

```typescript
// API
getInventory(): Promise<InventoryItem[]>
openMysteryBox(itemType: string): Promise<MysteryBoxReward>
exchangeFragment(fragmentType: string): Promise<Voucher>

// Types
interface InventoryItem { itemType, quantity, displayName, color, lastUpdated }
interface MysteryBoxReward { type, itemType?, amount, displayName }
```

## Thu Tu Trien Khai v2.3

```
Buoc 1 (30p): Them Voucher fields (discountAmount, hasFreeShip, fragmentType)
Buoc 2 (30p): Tao UserInventory.ts + MysteryBox.ts models
Buoc 3 (2h):  API routes: /inventory, /open-box, /exchange-fragment
              Admin API: mystery-boxes CRUD, user-inventory, grant
Buoc 4 (1h):  Admin UI: SpecialWarehouse (Mystery Box config + Grant Item + View User Inventory)
Buoc 5 (2h):  Mobile: InventoryScreen (grid + bottom sheets + animation)
              ShopScreen: icon kho, voucher selection khi checkout
```

## Verification v2.3

| # | Test | Expected |
|---|------|---------|
| 1 | Mo Mystery Box | Tru 1 box, random reward theo probability |
| 2 | 10 frag_3k -> exchange | Tru 10 manh, tao Voucher discountAmount=3000 |
| 3 | 8 frag_3k -> exchange | Loi: "Can du 10 manh" |
| 4 | 10 frag_freeship -> exchange | Tao Voucher hasFreeShip=true |
| 5 | Admin grant item | Item xuat hien trong UserInventory, co log |
| 6 | Admin Mystery Box config | Probability tong=100, validate truoc luu |
| 7 | Kho hien badge "Doi!" | Chi hien khi fragment >= 10 |
| 8 | Bottom sheet manh du | Nut "Doi Ngay!" hoat dong |
| 9 | Admin ShopRedemption | Thay "Voucher: Giam 3,000d" / "Free Ship: Co" |

---

---

# 🎉 V2.4 — Shop Events & Special Warehouse
### ~4-5h dev | BLOCK 2 + BLOCK 6 + Coming Soon Framework

**Phu thuoc**: V2.3 phai xong truoc (can Mystery Box infra cho event lucky_purchase)

**Muc tieu**: Flash Sale event (admin + cron random), Special Warehouse admin day du, Coming Soon framework cho cac event type tuong lai.

---

## Schema Moi

### [NEW] backend/src/models/ShopEvent.ts

```typescript
interface IShopEvent extends Document {
  title: string;
  description: string;          // Thong diep thuong nhan (1 trong 5 mau)
  type: 'flash_sale'            // V2.4 lam day du
       | 'double_cashback'      // Coming Soon
       | 'lucky_purchase'       // Coming Soon
       | 'vip_exclusive'        // Coming Soon
       | 'fragment_exchange'    // Coming Soon
       | 'free_ship_day';       // Coming Soon
  discountPercent: number;      // 0-100, dung cho flash_sale
  minVipTier: number;           // 0-11, dung cho vip_exclusive
  targetRewards: ObjectId[];    // [] = toan shop, co gia tri = chi items do
  fragmentExchangeConfig?: {
    fromType: string;           // 'frag_1k'
    toType: string;             // 'frag_3k'
    ratio: number;              // so manh from = 1 manh to
  };
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isAutoGenerated: boolean;     // true = do cron tao
  createdBy?: ObjectId;         // neu admin tao thu cong
}
```

### [NEW] backend/src/models/SpecialItemConfig.ts

```typescript
// Mapping: Reward thuong -> loai manh (dung trong SpecialWarehouse admin)
interface ISpecialItemConfig extends Document {
  reward: ObjectId;          // Reward thuong thuong
  fragmentType: string;      // 'frag_3k'
  isActive: boolean;
  addedToBoxPool: boolean;   // da suggest them vao Mystery Box pool chua
  createdBy: ObjectId;
}
```

## Flash Sale Logic

### [MODIFY] backend/src/routes/rewards.ts

**GET /rewards** (update them):
```typescript
// Detect active flash sale
const activeEvent = await ShopEvent.findOne({
  type: 'flash_sale', isActive: true, endDate: { $gt: new Date() }
});
// Voi moi reward: tinh displayPrice sau VIP discount
// Neu co Flash Sale: tinh salePrice = displayPrice * (1 - discountPercent/100)
// Response: { rewards[], activeEvent?, userVipTier, userVipDiscount }
```

**POST /:rewardId/purchase** (update them):
```typescript
// Ket hop Flash Sale + VIP discount:
// finalPrice = Math.ceil(pointCost * (1 - flashDiscount/100) * (1 - vipDiscount/100))
// Vi du: 50k, Flash -15%, VIP Tier4 -3%: 50,000 x 0.85 x 0.97 = 41,225

// Flash Sale KHONG ap cho: Gacha spin cost
```

**Them:**
```
GET /rewards/shop-events/active
    -> Tra ShopEvent dang active (neu co)
```

### [NEW] backend/src/jobs/shopEventJob.ts

```
Schedule: 0 17 * * * (00:00 VN moi ngay)
1. Dem ShopEvent trong thang co isAutoGenerated=true
   -> Neu da co -> SKIP (moi thang chi 1 auto event)
2. Math.random() < 0.10 (10% co su at)
   -> Tao Flash Sale:
      discountPercent = random(5-20)
      startDate = now, endDate = +24h
      isAutoGenerated = true
      title/description = random tu MERCHANT_MESSAGES pool (5 mau)
3. Broadcast in-app notification cho tat ca user
```

Pool thong diep (5 mau, random):
```
[1] "Thuong Nhan Thoi Khong Ghe Tham!"
    "La lam... ta chua tung thay ai ban gia re nhu vay. Han noi chi o day 24 tieng thoi."

[2] "Cong Chieu Khong Gian Mo Ra!"
    "Mot ke ban hang ky la xuat hien tu hu khong. Hang hoa chat luong, gia khong tuong."

[3] "Khach La Tu Tuong Lai..."
    "Ten nay noi han den tu tuong lai va can ban nhanh truoc khi cong dong."

[4] "Nha Tien Tri Cua Hang!"
    "Ta da thay trong tinh the: hom nay la ngay may man cua nguoi. Mua ngay!"

[5] "Flash Tu Vu Tru Song Song!"
    "Trong vu tru do, moi thu deu re hon. Hom nay, thuc te nay cung vay."
```

### [MODIFY] backend/src/server.ts

Import + start shopEventJob.

## Admin API (them vao admin.ts)

```
GET /admin/shop-events             -> list tat ca events (co filter active/inactive)
POST /admin/shop-events            -> tao event thu cong
PUT /admin/shop-events/:id         -> toggle isActive, update config
DELETE /admin/shop-events/:id      -> xoa (neu chua bat dau)

GET/POST/PUT/DELETE /admin/special-items-config
    -> CRUD Product->Fragment mappings
```

## Admin UI

### [MODIFY] admin/src/pages/RewardManagement.tsx

Them Tab "Su Kien Shop" (CRUD ShopEvent):
```
+--------------------------------------------------+
| Su Kien Shop         [+ Tao Su Kien]             |
+--------------------------------------------------+
| [Flash Sale -15%]  [Active] 10/09 - 11/09  [Sua] |
| [Flash Sale -8%]   [Done]   08/09 - 09/09  [Xoa] |
+--------------------------------------------------+
```

Modal tao event thu cong:
```
Loai event:   [flash_sale v]  (cac loai khac hien "Coming Soon")
Giam gia:     [15]%
Ap cho:       [Toan shop] / [Chon items...]
Thoi gian:    [10/09/2026 08:00] -> [11/09/2026 08:00]
Tieu de:      [Thuong Nhan Ky La...]  (hoac random tu pool)
Thong diep:   [...]
[Tao Event]
```

### [NEW] admin/src/pages/SpecialWarehouse.tsx — Full (them Tab 2)

Tab 2: San Pham -> Manh (Product Fragment Mapping):
```
Reward:     [Chon tu danh sach rewards...]
Loai manh:  [frag_3k v]
            Khi du 10 manh frag_3k -> user nhan voucher giam gia 3,000d
[Luu]

Danh sach hien tai:
  Reward "Ao Thun S1" -> frag_3k  [Active] [Xoa]
  Reward "Cap S2"     -> frag_5k  [Active] [Xoa]
```

(Tabs 1, 3, 4 da lam trong v2.3, giay chay day du tu v2.4)

### [MODIFY] admin/src/App.tsx

Them route `/admin/special-warehouse` + sidebar item "Kho Dac Biet".

### [MODIFY] admin/src/services/api.ts

Them tat ca API methods: shop events, special items config.

## Mobile UI

### [MODIFY] mobile/src/screens/ShopScreen.tsx

**Flash Sale Banner** (hien khi co event, sticky duoi header):
```
+------------------------------------------+
| ⚡ FLASH SALE -15%   18:42:07 con lai      |
+------------------------------------------+
```

**SaleEventModal** (popup khi vao ShopScreen co event, chi hien 1 lan/session):
```
+================================+
|  [Tieu de thuong nhan]         |
|  [Animated merchant icon]      |
|  "[Thong diep thuong nhan]"    |
|  +--------------------------+  |
|  | GIAM GIA 15%             |  |
|  | Con: 18:42:07            |  |
|  +--------------------------+  |
|  [Den Cua Hang Ngay!] [Dong]  |
+================================+
```

**Gia tren card item khi co event:**
```
+-------------------+
|   [Item Icon]     |
|  Ten san pham     |
|  ~~50,000~~ coins |
|  41,225 coins     |  <- sau Flash Sale + VIP
|  [Mua Ngay]       |
+-------------------+
```

### [NEW] mobile/src/components/SaleEventModal.tsx

- Countdown timer (endDate - now)
- Session state: chi hien 1 lan, khong popup lai khi navigate
- "Den Cua Hang Ngay!" -> close modal (user o trong shop roi)

### Coming Soon UI Framework

Cac event type chua lam (double_cashback, lucky_purchase, vip_exclusive, fragment_exchange, free_ship_day):
- Admin UI: disabled option trong dropdown, hien "(Sap Ra Mat)"
- Mobile: neu server tra ve event type nay -> khong crash, khong hien modal -> im lang bo qua

### [MODIFY] mobile/src/services/api.ts + types/index.ts

```typescript
// API
getActiveShopEvent(): Promise<ShopEvent | null>

// Types
interface ShopEvent {
  id, title, description, type, discountPercent, startDate, endDate, isActive
}
```

## Thu Tu Trien Khai v2.4

```
Buoc 1 (30p): Tao ShopEvent.ts + SpecialItemConfig.ts models
              Export trong index.ts
Buoc 2 (1.5h): API: GET /rewards cap nhat, POST purchase cap nhat Flash Sale
               GET /rewards/shop-events/active
               Admin CRUD shop-events + special-items-config
Buoc 3 (1h):  shopEventJob.ts (voi MERCHANT_MESSAGES pool) -> register server.ts
Buoc 4 (1h):  Admin UI: Tab Su Kien Shop trong RewardManagement
              SpecialWarehouse Tab 2 (Product->Fragment)
              Sidebar route /admin/special-warehouse
Buoc 5 (1.5h): Mobile: SaleEventModal | Flash Sale Banner | gia gach event tren card
               Coming Soon safeguard
```

## Verification v2.4

| # | Test | Expected |
|---|------|---------|
| 1 | Flash Sale 15% + VIP Tier4 3% + 50k | 50,000 x 0.85 x 0.97 = 41,225 |
| 2 | Mua khi khong co Flash Sale | Chi VIP discount |
| 3 | Flash Sale ap cho Gacha? | KHONG |
| 4 | Cron random 10% | Moi thang toi da 1 auto event |
| 5 | Cron khi da co auto event thang nay | Skip |
| 6 | SaleEventModal | Chi hien 1 lan/session |
| 7 | Event type "Coming Soon" | Admin thay disabled, mobile khong crash |
| 8 | Admin tao event thu cong | Xuat hien danh sach, ap dung ngay |
| 9 | Admin sua Product->Fragment mapping | Loai manh xuat hien trong pool box |
| 10 | Spending Milestone 16 (v2.2 check lai) | Khong trigger sau khi v2.4 deploy |

---

---

# 📋 TONG HOP LICH TRIEN KHAI

| Plan | Noi Dung | Uoc Luong | Phu Thuoc |
|------|---------|-----------|-----------|
| **V2.2** | VIP Tier + Purchase Flow + Cashback | ~5-6h | Khong |
| **V2.3** | Inventory + Mystery Box + Fragments | ~5-6h | V2.2 xong |
| **V2.4** | Shop Events + SpecialWarehouse day du | ~4-5h | V2.3 xong |

**Tong**: ~14-17h (khop voi uoc tinh goc)

## Files Thay Doi Tong Hop

### Backend Models
- [MODIFY] User.ts — 5 fields VIP (v2.2)
- [MODIFY] Voucher.ts — 3 fields manh/ship (v2.3)
- [NEW] UserInventory.ts (v2.3)
- [NEW] MysteryBox.ts (v2.3)
- [NEW] ShopEvent.ts (v2.4)
- [NEW] SpecialItemConfig.ts (v2.4)
- [MODIFY] index.ts — export models moi (v2.3, v2.4)

### Backend Logic
- [NEW] utils/vipUtils.ts (v2.2)
- [MODIFY] utils/milestones.ts — bo spending type (v2.2)
- [MODIFY] routes/rewards.ts — purchase + inventory + events (v2.2, v2.3, v2.4)
- [MODIFY] routes/admin.ts — VIP reset + mystery box + events + inventory (v2.2, v2.3, v2.4)
- [NEW] jobs/cashbackJob.ts (v2.2)
- [NEW] jobs/shopEventJob.ts (v2.4)
- [MODIFY] server.ts — register jobs (v2.2, v2.4)
- [NEW] scripts/migrateVipTiers.ts (v2.2, chay 1 lan)

### Admin Panel
- [MODIFY] RewardManagement.tsx — warning banner + VIP Config tab + Su Kien Shop tab (v2.2, v2.4)
- [NEW] SpecialWarehouse.tsx — 4 tabs (v2.3 phan 3 tabs, v2.4 them tab 2)
- [MODIFY] App.tsx / Router — route special-warehouse (v2.4)
- [MODIFY] services/api.ts — tat ca methods moi (v2.2, v2.3, v2.4)

### Mobile
- [NEW] components/VipMiniCard.tsx (v2.2)
- [NEW] screens/InventoryScreen.tsx (v2.3)
- [NEW] components/SaleEventModal.tsx (v2.4)
- [MODIFY] screens/ShopScreen.tsx — VIP card + kho icon + Flash Sale banner + event modal (v2.2, v2.3, v2.4)
- [MODIFY] screens/ProfileScreen.tsx — VIP Detail section (v2.2)
- [MODIFY] services/api.ts — tat ca methods moi (v2.2, v2.3, v2.4)
- [MODIFY] types/index.ts — ShopEvent, VipTierInfo, InventoryItem, MysteryBoxReward (v2.2, v2.3, v2.4)
