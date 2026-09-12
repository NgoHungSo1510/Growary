const payload = [
  {
    "itemType": "special_item",
    "specialItem": {
        "type": "discount_5k"
    },
    "rewardForm": "full",
    "quantity": 1,
  }
];

const shippingFee = 15000;
const freeships = [];
const discounts = [];
let maxFreeshipVal = -1;
let bestFreeship = null;
let maxDiscountVal = -1;
let bestDiscount = null;

payload.forEach(item => {
    if (item.quantity > 0 && item.itemType === 'special_item' && item.rewardForm === 'full' && item.specialItem) {
        const spType = item.specialItem.type;
        if (spType === 'coupon_freeship' || spType === 'freeship') {
            const c = { type: spType, discount: shippingFee, label: 'Free Ship' };
            freeships.push(c);
            if (shippingFee > maxFreeshipVal) {
                maxFreeshipVal = shippingFee;
                bestFreeship = c;
            }
        } else if (spType.includes('ship_')) {
            const match = spType.match(/(?:coupon_)?ship_(\d+)k$/);
            if (match) {
                const discount = parseInt(match[1], 10) * 1000;
                const c = { type: spType, discount, label: `Giảm ship ${match[1]}k` };
                freeships.push(c);
                if (discount > maxFreeshipVal) {
                    maxFreeshipVal = discount;
                    bestFreeship = c;
                }
            }
        } else if (spType.includes('discount_')) {
            const match = spType.match(/(?:coupon_)?discount_(\d+)k$/);
            if (match) {
                const discount = parseInt(match[1], 10) * 1000;
                const c = { type: spType, discount, label: `Giảm ${match[1]}k` };
                discounts.push(c);
                if (discount > maxDiscountVal) {
                    maxDiscountVal = discount;
                    bestDiscount = c;
                }
            }
        }
    }
});

console.log("discounts", discounts);
console.log("freeships", freeships);
