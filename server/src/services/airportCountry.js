const Airport = require('../models/Airport');

async function getAirportCountryMap(codes) {
  const uniqueCodes = [...new Set(codes.filter(Boolean))];
  const airports = await Airport.find({ code: { $in: uniqueCodes } })
    .select('code country')
    .lean();

  return new Map(
    airports.map(({ code, country }) => [
      code,
      typeof country === 'string' ? country.trim() : '',
    ]),
  );
}

module.exports = { getAirportCountryMap };
