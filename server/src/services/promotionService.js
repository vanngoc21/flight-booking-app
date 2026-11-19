const Promotion = require('../models/Promotion');

function promotionError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function calculateDiscount(promotion, baseFare) {
  if (!Number.isFinite(baseFare) || baseFare < promotion.minimumBaseFare) {
    throw promotionError(
      `Tổng giá vé cơ bản tối thiểu để dùng mã là ${promotion.minimumBaseFare.toLocaleString('vi-VN')} VND.`,
    );
  }

  const rawDiscount = promotion.discountType === 'percentage'
    ? Math.round(baseFare * promotion.discountValue / 100)
    : promotion.discountValue;
  const cappedDiscount = promotion.maxDiscount
    ? Math.min(rawDiscount, promotion.maxDiscount)
    : rawDiscount;
  const discountAmount = Math.min(baseFare, cappedDiscount);

  if (discountAmount <= 0) {
    throw promotionError('Mã khuyến mãi không tạo ra khoản giảm giá hợp lệ.');
  }

  return discountAmount;
}

async function applyPromotion({
  code,
  baseFare,
  isInternational = false,
  flightAirlineCodes = [],
  legBaseFares = [],
}) {
  const normalizedCode = typeof code === 'string' ? code.trim().toUpperCase() : '';

  if (!normalizedCode) return null;

  const promotion = await Promotion.findOne({ code: normalizedCode });
  if (!promotion) throw promotionError('Mã khuyến mãi không tồn tại.');
  if (!promotion.active) throw promotionError('Mã khuyến mãi hiện không khả dụng.');

  const now = new Date();
  if (now < promotion.startsAt || now > promotion.endsAt) {
    throw promotionError('Mã khuyến mãi chưa bắt đầu hoặc đã hết hạn.');
  }

  if (
    (promotion.applicability === 'domestic' && isInternational) ||
    (promotion.applicability === 'international' && !isInternational)
  ) {
    throw promotionError('Mã khuyến mãi không áp dụng cho hành trình này.');
  }

  const normalizedAirlineCode = typeof promotion.airlineCode === 'string'
    ? promotion.airlineCode.trim().toUpperCase()
    : '';
  let eligibleBaseFare = baseFare;
  if (normalizedAirlineCode) {
    const eligibleFareByLeg = Array.isArray(flightAirlineCodes) &&
      Array.isArray(legBaseFares) &&
      flightAirlineCodes.length === legBaseFares.length
      ? legBaseFares.reduce((sum, fare, index) => (
          flightAirlineCodes[index]?.trim().toUpperCase() === normalizedAirlineCode
            ? sum + fare
            : sum
        ), 0)
      : 0;
    if (eligibleFareByLeg <= 0) {
      throw promotionError('Mã khuyến mãi không áp dụng cho hãng bay trong hành trình này.');
    }
    eligibleBaseFare = eligibleFareByLeg;
  }

  const discountAmount = calculateDiscount(promotion, eligibleBaseFare);

  return {
    id: promotion._id,
    code: promotion.code,
    title: promotion.title,
    titleEn: promotion.titleEn || '',
    discountAmount,
  };
}

module.exports = { applyPromotion, calculateDiscount };
