jest.mock('../src/models/Promotion', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

const Promotion = require('../src/models/Promotion');
const {
  createPromotion,
  deletePromotion,
  getPublicPromotions,
} = require('../src/controllers/promotionController');

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('promotion controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes codes and creates a validated promotion', async () => {
    const promotion = { code: 'WELCOME10', title: 'Welcome' };
    Promotion.create.mockResolvedValue(promotion);
    const response = createResponse();
    const next = jest.fn();

    await createPromotion({
      body: {
        code: ' welcome10 ',
        title: ' Welcome ',
        titleEn: 'Welcome',
        discountType: 'percentage',
        discountValue: 10,
        maxDiscount: 200_000,
        minimumBaseFare: 500_000,
        applicability: 'all',
        startsAt: '2026-01-01T00:00:00.000Z',
        endsAt: '2026-12-31T23:59:59.999Z',
        active: true,
      },
    }, response, next);

    expect(Promotion.create).toHaveBeenCalledWith(expect.objectContaining({
      code: 'WELCOME10',
      title: 'Welcome',
      discountValue: 10,
      minimumBaseFare: 500_000,
    }));
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith({ success: true, data: promotion });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid date ranges before writing', async () => {
    const response = createResponse();
    const next = jest.fn();

    await createPromotion({
      body: {
        code: 'BADDATE',
        title: 'Bad date',
        discountType: 'fixed',
        discountValue: 10_000,
        startsAt: '2026-12-31T00:00:00.000Z',
        endsAt: '2026-01-01T00:00:00.000Z',
      },
    }, response, next);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(Promotion.create).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('validates and stores event banner and airline targeting', async () => {
    const promotion = { code: 'BLACKFRIDAY', campaignType: 'event' };
    Promotion.create.mockResolvedValue(promotion);
    const response = createResponse();
    const next = jest.fn();

    await createPromotion({
      body: {
        code: ' blackfriday ',
        title: 'Black Friday',
        campaignType: 'event',
        eventTitle: 'Black Friday Sale',
        eventTitleEn: 'Black Friday Sale',
        bannerImageUrl: 'https://example.com/black-friday.jpg',
        airlineCode: 'vj',
        discountType: 'percentage',
        discountValue: 10,
        startsAt: '2026-11-01T00:00:00.000Z',
        endsAt: '2026-11-30T23:59:59.999Z',
        active: true,
      },
    }, response, next);

    expect(Promotion.create).toHaveBeenCalledWith(expect.objectContaining({
      code: 'BLACKFRIDAY',
      campaignType: 'event',
      eventTitle: 'Black Friday Sale',
      bannerImageUrl: 'https://example.com/black-friday.jpg',
      airlineCode: 'VJ',
    }));
    expect(response.status).toHaveBeenCalledWith(201);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects event promotions without a usable banner URL', async () => {
    const response = createResponse();
    const next = jest.fn();

    await createPromotion({
      body: {
        code: 'NOIMAGE',
        title: 'No image',
        campaignType: 'event',
        eventTitle: 'Holiday sale',
        airlineCode: 'VJ',
        discountType: 'percentage',
        discountValue: 10,
        startsAt: '2026-11-01T00:00:00.000Z',
        endsAt: '2026-11-30T23:59:59.999Z',
      },
    }, response, next);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(Promotion.create).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('returns only currently active public offers', async () => {
    const offers = [{ code: 'WELCOME10' }];
    const sort = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(offers) });
    const select = jest.fn().mockReturnValue({ sort });
    Promotion.find.mockReturnValue({ select });
    const response = createResponse();
    const next = jest.fn();

    await getPublicPromotions({}, response, next);

    expect(Promotion.find).toHaveBeenCalledWith(expect.objectContaining({
      active: true,
      startsAt: expect.objectContaining({ $lte: expect.any(Date) }),
      endsAt: expect.objectContaining({ $gte: expect.any(Date) }),
    }));
    expect(response.json).toHaveBeenCalledWith({ success: true, data: offers });
    expect(next).not.toHaveBeenCalled();
  });

  it('keeps seeded demo offers manageable without allowing deletion', async () => {
    Promotion.findById.mockResolvedValue({ _id: 'demo-id', seeded: true });
    const response = createResponse();
    const next = jest.fn();

    await deletePromotion({ params: { id: 'demo-id' } }, response, next);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(Promotion.findByIdAndDelete).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
