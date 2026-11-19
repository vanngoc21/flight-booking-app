const Booking = require('../src/models/Booking');

describe('Booking expiry', () => {
  it('accepts infant passengers without a separate seat', () => {
    const passengerType = Booking.schema
      .path('passengers')
      .schema.path('passengerType');

    expect(passengerType.enumValues).toContain('infant');
  });

  it('does not automatically delete bookings after their payment deadline', () => {
    const ttlIndexes = Booking.schema
      .indexes()
      .filter(([, options]) => options.expireAfterSeconds !== undefined);

    expect(ttlIndexes).toHaveLength(0);
  });
});
