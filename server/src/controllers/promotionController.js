const Promotion = require('../models/Promotion');

function getPromotionInput(body) {
  const {
    code,
    title,
    titleEn = '',
    description = '',
    descriptionEn = '',
    campaignType = 'coupon',
    eventTitle = '',
    eventTitleEn = '',
    bannerImageUrl = '',
    airlineCode = '',
    discountType,
    discountValue,
    maxDiscount = null,
    minimumBaseFare = 0,
    applicability = 'all',
    startsAt,
    endsAt,
    active = true,
  } = body || {};
  const normalizedCode = typeof code === 'string' ? code.trim().toUpperCase() : '';
  const normalizedTitle = typeof title === 'string' ? title.trim() : '';
  const normalizedEventTitle = typeof eventTitle === 'string' ? eventTitle.trim() : '';
  const normalizedAirlineCode = typeof airlineCode === 'string'
    ? airlineCode.trim().toUpperCase()
    : '';
  const normalizedBannerImageUrl = typeof bannerImageUrl === 'string'
    ? bannerImageUrl.trim()
    : '';
  const parsedStart = typeof startsAt === 'string' ? new Date(startsAt) : new Date(Number.NaN);
  const parsedEnd = typeof endsAt === 'string' ? new Date(endsAt) : new Date(Number.NaN);

  if (!/^[A-Z0-9_-]{3,30}$/.test(normalizedCode)) {
    return { error: 'Mã khuyến mãi phải có 3–30 ký tự chữ, số, gạch ngang hoặc gạch dưới.' };
  }
  if (!normalizedTitle || normalizedTitle.length > 100) {
    return { error: 'Tên khuyến mãi là bắt buộc và tối đa 100 ký tự.' };
  }
  if (typeof titleEn !== 'string' || titleEn.length > 100) {
    return { error: 'Tên tiếng Anh tối đa 100 ký tự.' };
  }
  if (typeof description !== 'string' || description.length > 500) {
    return { error: 'Mô tả khuyến mãi tối đa 500 ký tự.' };
  }
  if (typeof descriptionEn !== 'string' || descriptionEn.length > 500) {
    return { error: 'Mô tả tiếng Anh tối đa 500 ký tự.' };
  }
  if (!['coupon', 'event'].includes(campaignType)) {
    return { error: 'Loại chương trình không hợp lệ.' };
  }
  if (typeof eventTitle !== 'string' || eventTitle.length > 100) {
    return { error: 'Tên sự kiện tối đa 100 ký tự.' };
  }
  if (typeof eventTitleEn !== 'string' || eventTitleEn.length > 100) {
    return { error: 'Tên sự kiện tiếng Anh tối đa 100 ký tự.' };
  }
  if (typeof bannerImageUrl !== 'string' || bannerImageUrl.length > 2048) {
    return { error: 'Đường dẫn ảnh banner không hợp lệ.' };
  }
  if (campaignType === 'event') {
    let imageUrl;
    try {
      imageUrl = new URL(normalizedBannerImageUrl);
    } catch {
      return { error: 'Vui lòng nhập URL ảnh banner hợp lệ (http hoặc https).' };
    }
    if (!normalizedEventTitle) {
      return { error: 'Tên sự kiện là bắt buộc cho deal sự kiện.' };
    }
    if (!/^https?:$/.test(imageUrl.protocol)) {
      return { error: 'Ảnh banner chỉ hỗ trợ URL http hoặc https.' };
    }
    if (!/^[A-Z0-9_-]{2,10}$/.test(normalizedAirlineCode)) {
      return { error: 'Vui lòng chọn hãng bay áp dụng cho deal sự kiện.' };
    }
  }
  if (!['percentage', 'fixed'].includes(discountType)) {
    return { error: 'Loại giảm giá không hợp lệ.' };
  }
  if (
    !Number.isFinite(discountValue) ||
    discountValue < 1 ||
    (discountType === 'percentage' && discountValue > 100) ||
    (discountType === 'fixed' && !Number.isInteger(discountValue))
  ) {
    return { error: 'Giá trị giảm giá không hợp lệ.' };
  }
  if (
    maxDiscount !== null &&
    (!Number.isInteger(maxDiscount) || maxDiscount < 1)
  ) {
    return { error: 'Mức giảm tối đa phải lớn hơn 0 hoặc để trống.' };
  }
  if (!Number.isInteger(minimumBaseFare) || minimumBaseFare < 0) {
    return { error: 'Giá vé tối thiểu không hợp lệ.' };
  }
  if (!['all', 'domestic', 'international'].includes(applicability)) {
    return { error: 'Phạm vi áp dụng không hợp lệ.' };
  }
  if (typeof active !== 'boolean') {
    return { error: 'Trạng thái hoạt động không hợp lệ.' };
  }
  if (
    !Number.isFinite(parsedStart.getTime()) ||
    !Number.isFinite(parsedEnd.getTime()) ||
    parsedEnd <= parsedStart
  ) {
    return { error: 'Thời gian kết thúc phải sau thời gian bắt đầu.' };
  }

  return {
    value: {
      code: normalizedCode,
      title: normalizedTitle,
      titleEn: titleEn.trim(),
      description: description.trim(),
      descriptionEn: descriptionEn.trim(),
      campaignType,
      eventTitle: normalizedEventTitle,
      eventTitleEn: eventTitleEn.trim(),
      bannerImageUrl: normalizedBannerImageUrl,
      airlineCode: campaignType === 'event' ? normalizedAirlineCode : '',
      discountType,
      discountValue,
      maxDiscount,
      minimumBaseFare,
      applicability,
      startsAt: parsedStart,
      endsAt: parsedEnd,
      active,
    },
  };
}

async function getPublicPromotions(req, res, next) {
  try {
    const now = new Date();
    const data = await Promotion.find({
      active: true,
      startsAt: { $lte: now },
      endsAt: { $gte: now },
    })
      .select('code title titleEn description descriptionEn campaignType eventTitle eventTitleEn bannerImageUrl airlineCode discountType discountValue maxDiscount minimumBaseFare applicability startsAt endsAt')
      .sort({ endsAt: 1, code: 1 })
      .lean();

    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getAdminPromotions(req, res, next) {
  try {
    const data = await Promotion.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createPromotion(req, res, next) {
  try {
    const parsed = getPromotionInput(req.body);
    if (parsed.error) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const data = await Promotion.create(parsed.value);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function updatePromotion(req, res, next) {
  try {
    const parsed = getPromotionInput(req.body);
    if (parsed.error) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const data = await Promotion.findByIdAndUpdate(
      req.params.id,
      parsed.value,
      { new: true, runValidators: true },
    );
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi.' });
    }

    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function deletePromotion(req, res, next) {
  try {
    const promotion = await Promotion.findById(req.params.id);
    const data = promotion?.seeded
      ? null
      : await Promotion.findByIdAndDelete(req.params.id);
    if (promotion?.seeded) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa ưu đãi demo mặc định. Hãy tắt trạng thái hoạt động thay thế.',
      });
    }
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi.' });
    }

    return res.json({ success: true, message: 'Đã xóa khuyến mãi.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPublicPromotions,
  getAdminPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
};
