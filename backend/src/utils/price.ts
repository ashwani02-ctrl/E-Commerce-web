export const finalPrice = (price: number, discountPercent: number | null) =>
    discountPercent ? Math.round(price * (1 - discountPercent / 100)) : price;