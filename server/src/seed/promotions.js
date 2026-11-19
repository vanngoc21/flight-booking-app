const Promotion = require('../models/Promotion');

function getDemoPromotions(now = new Date()) {
  const startsAt = new Date(now);
  startsAt.setDate(startsAt.getDate() - 1);
  const endsAt = new Date(now);
  endsAt.setFullYear(endsAt.getFullYear() + 1);

  return [
    {
      code: 'WELCOME10',
      title: 'Ưu đãi chào mừng',
      titleEn: 'Welcome offer',
      description: 'Giảm 10% tổng giá vé cơ bản, tối đa 200.000 VND. Mã demo.',
      descriptionEn: '10% off total base fare, up to VND 200,000. Demo offer.',
      discountType: 'percentage',
      discountValue: 10,
      maxDiscount: 200_000,
      minimumBaseFare: 500_000,
      applicability: 'all',
      startsAt,
      endsAt,
      active: true,
      seeded: true,
    },
    {
      code: 'FLY50000',
      title: 'Bay vui tiết kiệm',
      titleEn: 'Save on your flight',
      description: 'Giảm 50.000 VND khi tổng giá vé cơ bản từ 1.000.000 VND. Mã demo.',
      descriptionEn: 'VND 50,000 off when total base fare is at least VND 1,000,000. Demo offer.',
      discountType: 'fixed',
      discountValue: 50_000,
      minimumBaseFare: 1_000_000,
      applicability: 'all',
      startsAt,
      endsAt,
      active: true,
      seeded: true,
    },
    {
      code: 'INTL15',
      title: 'Ưu đãi hành trình quốc tế',
      titleEn: 'International flight offer',
      description: 'Giảm 15% tổng giá vé cơ bản, tối đa 500.000 VND. Mã demo.',
      descriptionEn: '15% off total base fare, up to VND 500,000. Demo offer.',
      discountType: 'percentage',
      discountValue: 15,
      maxDiscount: 500_000,
      minimumBaseFare: 1_500_000,
      applicability: 'international',
      startsAt,
      endsAt,
      active: true,
      seeded: true,
    },
  ];
}

async function seedPromotions() {
  const promotions = getDemoPromotions();
  await Promotion.bulkWrite(promotions.map((promotion) => ({
    updateOne: {
      filter: { code: promotion.code },
      update: { $setOnInsert: promotion },
      upsert: true,
    },
  })));
}

module.exports = { seedPromotions, getDemoPromotions };
