const { createBookingSchema } = require('../src/validators/schemas');

const outboundBooking = {
  flightId: '507f1f77bcf86cd799439011',
  bookingContact: {
    fullName: 'An Nguyen',
    email: 'an@example.com',
    phone: '0901234567',
  },
  passengers: [{
    firstName: 'An',
    lastName: 'Nguyen',
    gender: 'other',
    email: 'an@example.com',
    phone: '0901234567',
    dateOfBirth: '1990-05-21',
    nationality: 'Việt Nam',
    documentType: 'national_id',
    documentNumber: '012345678901',
  }],
  seats: ['1A'],
  checkedBagCount: 0,
  protectionEnabled: false,
};

describe('createBookingSchema round-trip legs', () => {
  it('accepts a round-trip booking when both return flight and seats are supplied', () => {
    const result = createBookingSchema.safeParse({
      ...outboundBooking,
      returnFlightId: '507f1f77bcf86cd799439012',
      returnSeats: ['2A'],
    });

    expect(result.success).toBe(true);
  });

  it('continues to accept a one-way booking', () => {
    expect(createBookingSchema.safeParse(outboundBooking).success).toBe(true);
  });

  it('requires valid birth date and identity document details', () => {
    expect(createBookingSchema.safeParse({
      ...outboundBooking,
      passengers: [{
        ...outboundBooking.passengers[0],
        dateOfBirth: '2030-02-31',
      }],
    }).success).toBe(false);

    expect(createBookingSchema.safeParse({
      ...outboundBooking,
      passengers: [{
        ...outboundBooking.passengers[0],
        documentNumber: 'not-an-id',
      }],
    }).success).toBe(false);
  });

  it('requires valid buyer contact details', () => {
    expect(createBookingSchema.safeParse({
      ...outboundBooking,
      bookingContact: undefined,
    }).success).toBe(false);
    expect(createBookingSchema.safeParse({
      ...outboundBooking,
      bookingContact: {
        fullName: 'An Nguyen',
        email: 'not-an-email',
        phone: '123',
      },
    }).success).toBe(false);
  });

  it('requires a valid expiry date and issuing country for passport holders', () => {
    const passenger = {
      ...outboundBooking.passengers[0],
      documentType: 'passport',
      documentNumber: 'A12345678',
      issuingCountry: 'Việt Nam',
      documentExpiryDate: '2999-12-31',
    };

    expect(createBookingSchema.safeParse({
      ...outboundBooking,
      passengers: [passenger],
    }).success).toBe(true);
    expect(createBookingSchema.safeParse({
      ...outboundBooking,
      passengers: [{ ...passenger, documentExpiryDate: undefined }],
    }).success).toBe(false);
  });

  it('requires complete, unexpired details when an entry document is declared', () => {
    const passenger = {
      ...outboundBooking.passengers[0],
      documentType: 'passport',
      documentNumber: 'A12345678',
      issuingCountry: 'Việt Nam',
      documentExpiryDate: '2999-12-31',
      travelDocumentType: 'visa',
    };

    expect(createBookingSchema.safeParse({
      ...outboundBooking,
      passengers: [{ ...passenger, travelDocumentNumber: 'VISA123', travelDocumentExpiryDate: '2999-12-31' }],
    }).success).toBe(true);
    expect(createBookingSchema.safeParse({
      ...outboundBooking,
      passengers: [passenger],
    }).success).toBe(false);
  });

  it('accepts a multi-city booking with an infant who does not need a seat', () => {
    const result = createBookingSchema.safeParse({
      bookingContact: outboundBooking.bookingContact,
      passengers: [
        outboundBooking.passengers[0],
        {
          ...outboundBooking.passengers[0],
          firstName: 'Be',
          passengerType: 'infant',
        },
      ],
      legs: [
        {
          flightId: '507f1f77bcf86cd799439011',
          seats: ['1A'],
          checkedBagCount: 0,
        },
        {
          flightId: '507f1f77bcf86cd799439012',
          seats: ['2A'],
          checkedBagCount: 1,
        },
      ],
      protectionEnabled: false,
    });

    expect(result.success).toBe(true);
  });

  it('rejects more lap infants than adults', () => {
    const result = createBookingSchema.safeParse({
      ...outboundBooking,
      passengers: [
        ...outboundBooking.passengers,
        {
          ...outboundBooking.passengers[0],
          firstName: 'Be',
          passengerType: 'infant',
        },
        {
          ...outboundBooking.passengers[0],
          firstName: 'Cu',
          passengerType: 'infant',
        },
      ],
      seats: ['1A', '2A', '3A'],
    });

    expect(result.success).toBe(false);
  });

  it('rejects a return flight without return seats', () => {
    const result = createBookingSchema.safeParse({
      ...outboundBooking,
      returnFlightId: '507f1f77bcf86cd799439012',
    });

    expect(result.success).toBe(false);
  });

  it('rejects return seats without a return flight', () => {
    const result = createBookingSchema.safeParse({
      ...outboundBooking,
      returnSeats: ['2A'],
    });

    expect(result.success).toBe(false);
  });

  it('rejects return baggage for a one-way booking', () => {
    const result = createBookingSchema.safeParse({
      ...outboundBooking,
      returnCheckedBagCount: 1,
    });

    expect(result.success).toBe(false);
  });
});
