
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  getPublicPromotions,
  searchAirports,
  searchFlights,
  type AirportSuggestion,
  type Promotion,
} from '../services/api';
import { BookingSettingsNotice } from '../components/booking-settings-notice';
import { usePublicSettings } from '../hooks/use-public-settings';
import { AppText as Text, AppTextInput as TextInput, useAppLanguage } from '../i18n';
import type {
  CabinClass,
  Flight,
  FlightSearchParams,
  FlightSort,
} from '../types/flight';

type SearchSegment = { from: string; to: string; date: string };

function getDefaultDate() {
  const date = new Date();
  date.setDate(date.getDate() + 3);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isValidCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

function getTodayDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function getDateForCalendar(value: string) {
  if (isValidCalendarDate(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date();
}

function DateField({
  value,
  onChange,
  minimumDate = getTodayDate(),
}: {
  value: string;
  onChange: (value: string) => void;
  minimumDate?: string;
}) {
  const language = useAppLanguage();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => getDateForCalendar(value));
  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const firstWeekday = (monthStart.getDay() + 6) % 7;
  const calendarDays = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const previousMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);

  function showCalendar() {
    setVisibleMonth(getDateForCalendar(value));
    setCalendarOpen((open) => !open);
  }

  function formatDateForInput(day: number) {
    const year = visibleMonth.getFullYear();
    const month = String(visibleMonth.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-${String(day).padStart(2, '0')}`;
  }

  return (
    <View>
      <View style={styles.dateInputRow}>
        <TextInput
          style={[styles.input, styles.dateTextInput]}
          value={value}
          onChangeText={onChange}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          accessibilityLabel={language === 'vi' ? 'Ngày bay (YYYY-MM-DD)' : 'Flight date (YYYY-MM-DD)'}
        />
        <Pressable
          style={styles.calendarButton}
          onPress={showCalendar}
          accessibilityRole="button"
          accessibilityLabel={calendarOpen
            ? (language === 'vi' ? 'Đóng lịch' : 'Close calendar')
            : (language === 'vi' ? 'Mở lịch chọn ngày' : 'Open date picker')}
        >
          <Text style={styles.calendarButtonText}>▦</Text>
        </Pressable>
      </View>
      {calendarOpen && (
        <View style={styles.calendar}>
          <View style={styles.calendarHeader}>
            <Pressable
              style={styles.calendarNavButton}
              disabled={previousMonth < currentMonth}
              onPress={() => setVisibleMonth(previousMonth)}
              accessibilityLabel={language === 'vi' ? 'Tháng trước' : 'Previous month'}
            >
              <Text style={[styles.calendarNavText, previousMonth < currentMonth && styles.calendarNavDisabled]}>‹</Text>
            </Pressable>
            <Text style={styles.calendarMonth}>
              {visibleMonth.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <Pressable
              style={styles.calendarNavButton}
              onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
              accessibilityLabel={language === 'vi' ? 'Tháng sau' : 'Next month'}
            >
              <Text style={styles.calendarNavText}>›</Text>
            </Pressable>
          </View>
          <View style={styles.calendarGrid}>
            {(language === 'vi'
              ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
              : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']).map((weekday) => (
              <Text key={weekday} style={styles.calendarWeekday}>{weekday}</Text>
            ))}
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} style={styles.calendarDayCell} />;
              }

              const dateValue = formatDateForInput(day);
              const isSelected = dateValue === value;
              const isDisabled = dateValue < minimumDate;

              return (
                <Pressable
                  key={dateValue}
                  style={[
                    styles.calendarDayCell,
                    styles.calendarDayButton,
                    isSelected && styles.calendarDaySelected,
                    isDisabled && styles.calendarDayDisabled,
                  ]}
                  disabled={isDisabled}
                  onPress={() => {
                    onChange(dateValue);
                    setCalendarOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={dateValue}
                >
                  <Text style={[
                    styles.calendarDayText,
                    isSelected && styles.calendarDaySelectedText,
                    isDisabled && styles.calendarDayDisabledText,
                  ]}>{day}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

function hasValidAirlineCodes(value: string) {
  const normalized = value.trim().replace(/\s+/g, '').toUpperCase();
  return !normalized || /^[A-Z0-9]{2,3}(,[A-Z0-9]{2,3})*$/.test(normalized);
}

function isCabinClass(value: string | undefined): value is CabinClass {
  return value === 'economy' ||
    value === 'premium_economy' ||
    value === 'business' ||
    value === 'first';
}

function formatPrice(price: number, currency: string, language: 'vi' | 'en' = 'vi') {
  try {
    return new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} ${currency}`;
  }
}

function getFlightEventPromotion(
  flight: Flight,
  promotions: Promotion[] | undefined,
): Promotion | undefined {
  return promotions?.find(
    (promotion) =>
      promotion.campaignType === 'event' &&
      promotion.airlineCode?.toUpperCase() === flight.airline.code.toUpperCase(),
  );
}

function getEventPromotionForBooking(
  flights: Flight[],
  promotions: Promotion[] | undefined,
): Promotion | undefined {
  return flights
    .map((flight) => getFlightEventPromotion(flight, promotions))
    .find((promotion): promotion is Promotion => promotion !== undefined);
}

function getPromotionalFare(
  promotion: Promotion | undefined,
  basePrice: number,
): number | undefined {
  if (!promotion || basePrice < promotion.minimumBaseFare) return undefined;

  const discount = promotion.discountType === 'percentage'
    ? Math.round((basePrice * promotion.discountValue) / 100)
    : promotion.discountValue;
  const cappedDiscount = promotion.maxDiscount
    ? Math.min(discount, promotion.maxDiscount)
    : discount;

  return basePrice - Math.min(basePrice, cappedDiscount);
}

function getAirlineLogo(code: string) {
  switch (code.trim().toUpperCase()) {
    case 'VN':
      return require('../../assets/images/airlines/vietnam-airlines.png');
    case 'VJ':
      return require('../../assets/images/airlines/vietjet.png');
    case 'QH':
      return require('../../assets/images/airlines/bamboo-airways.png');
    default:
      return null;
  }
}

function formatTime(value: string, timeZone: string, language: 'vi' | 'en' = 'vi') {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  return date.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(departureAt: string, arrivalAt: string, language: 'vi' | 'en' = 'vi') {
  const durationMinutes = Math.round(
    (new Date(arrivalAt).getTime() - new Date(departureAt).getTime()) / 60_000,
  );

  if (!Number.isFinite(durationMinutes) || durationMinutes < 0) {
    return language === 'vi' ? 'Chưa rõ thời lượng' : 'Duration unavailable';
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (language === 'en') {
    if (hours === 0) return `${minutes} min`;
    return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
  }

  if (hours === 0) return `${minutes} phút`;
  return minutes === 0 ? `${hours} giờ` : `${hours} giờ ${minutes} phút`;
}

function formatDateHeading(value: string, timeZone: string, language: 'vi' | 'en') {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return language === 'vi' ? 'Chưa có ngày bay' : 'Date unavailable';
  }

  return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone,
  });
}

function FlightCard({
  flight,
  onPress,
  currency,
  timeZone,
  selected = false,
  disabled = false,
  eventPromotion,
}: {
  flight: Flight;
  onPress: () => void;
  currency: string;
  timeZone: string;
  selected?: boolean;
  disabled?: boolean;
  eventPromotion?: Promotion;
}) {
  const isWide = useWindowDimensions().width >= 960;
  const language = useAppLanguage();
  const promotionalFare = getPromotionalFare(eventPromotion, flight.basePrice);
  const eventTitle = language === 'en'
    ? (eventPromotion?.eventTitleEn || eventPromotion?.eventTitle || eventPromotion?.titleEn || eventPromotion?.title)
    : (eventPromotion?.eventTitle || eventPromotion?.title);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.flightCard,
        isWide && !eventPromotion && styles.flightCardWide,
        eventPromotion && styles.flightCardCampaign,
        selected && styles.flightCardSelected,
        disabled && styles.flightCardDisabled,
        pressed && styles.pressed,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      {eventPromotion ? (
        <ImageBackground
          source={{ uri: eventPromotion.bannerImageUrl }}
          resizeMode="cover"
          style={styles.eventCampaignBanner}
          imageStyle={styles.eventCampaignImage}
          accessibilityLabel={eventTitle}
        >
          <View style={styles.eventCampaignOverlay}>
            <Text style={styles.eventCampaignTitle} numberOfLines={1}>
              {eventTitle}
            </Text>
            <Text style={styles.eventCampaignDeal}>
              {language === 'vi' ? 'DEAL ĐẶC BIỆT' : 'SPECIAL DEAL'}
            </Text>
          </View>
        </ImageBackground>
      ) : null}

      <View
        style={[
          styles.flightMain,
          eventPromotion && styles.flightMainCampaign,
          isWide && styles.flightMainWide,
          isWide && eventPromotion && styles.flightMainWideCampaign,
        ]}
      >
        <View style={[styles.carrierBlock, isWide && styles.carrierBlockWide]}>
          <View style={styles.carrierIdentity}>
            <View style={styles.airlineBadge}>
              {getAirlineLogo(flight.airline.code) ? (
                <Image
                  source={getAirlineLogo(flight.airline.code)!}
                  style={styles.airlineLogo}
                  resizeMode="contain"
                  accessibilityLabel={flight.airline.name}
                />
              ) : (
                <Text style={styles.airlineCode}>{flight.airline.code}</Text>
              )}
            </View>

            <View style={styles.airlineInfo}>
              <Text style={styles.airlineName}>{flight.airline.name}</Text>
              <Text style={styles.flightNumber}>{flight.flightNumber}</Text>
            </View>
          </View>
          <Text style={styles.baggage}>
            {language === 'vi' ? 'Hành lý:' : 'Baggage:'} {flight.baggageAllowanceKg} kg
          </Text>
          {eventPromotion ? (
            <Text style={styles.eventPromotionLabel} numberOfLines={1}>
              ◉ {eventTitle}
            </Text>
          ) : null}
        </View>

        <View style={[styles.routeRow, isWide && styles.routeRowWide]}>
          <View style={styles.routePoint}>
            <Text style={styles.time}>
              {formatTime(flight.departureAt, timeZone, language)}
            </Text>
            <Text style={styles.airportCode}>{flight.origin.code}</Text>
            <Text style={styles.city} numberOfLines={1}>
              {flight.origin.city}
            </Text>
          </View>

          <View style={styles.routeMiddle}>
            <Text style={styles.durationLabel}>
              {formatDuration(flight.departureAt, flight.arrivalAt, language)}
            </Text>
            <View style={styles.routeLine}>
              <View style={styles.routeDot} />
              <View style={styles.routeDash} />
              <Text style={styles.plane}>✈</Text>
              <View style={styles.routeDash} />
              <View style={styles.routeDot} />
            </View>
            <Text style={styles.durationLabel}>
              {flight.stops === 0
                ? (language === 'vi' ? 'Bay thẳng' : 'Nonstop')
                : (language === 'vi' ? `${flight.stops} điểm dừng` : `${flight.stops} stop(s)`)}
            </Text>
          </View>

          <View style={[styles.routePoint, styles.routeEnd]}>
            <Text style={styles.time}>
              {formatTime(flight.arrivalAt, timeZone, language)}
            </Text>
            <Text style={styles.airportCode}>{flight.destination.code}</Text>
            <Text style={styles.city} numberOfLines={1}>
              {flight.destination.city}
            </Text>
          </View>
        </View>

        <View style={[styles.flightAction, isWide && styles.flightActionWide]}>
          <View style={styles.flightPriceBlock}>
            <Text style={[styles.price, promotionalFare !== undefined && styles.specialPrice]}>
              {formatPrice(
                promotionalFare ?? flight.basePrice,
                flight.currency || currency,
                language,
              )}
            </Text>
            {promotionalFare !== undefined ? (
              <>
                <Text style={styles.originalPrice}>
                  {formatPrice(flight.basePrice, flight.currency || currency, language)}
                </Text>
                <Text style={styles.specialFareLabel}>
                  ◉ {language === 'vi' ? 'Mức giá đặc biệt' : 'Special fare'}
                </Text>
              </>
            ) : null}
          </View>
          <View style={[styles.selectButton, selected && styles.selectButtonSelected]}>
            <Text style={[styles.selectButtonText, selected && styles.selectButtonTextSelected]}>
              {selected ? 'Đã chọn ✓' : 'Chọn'}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function FlightItineraryLeg({
  flight,
  direction,
  timeZone,
}: {
  flight: Flight;
  direction: string;
  timeZone: string;
}) {
  const language = useAppLanguage();
  return (
    <View style={styles.itineraryLeg}>
      <View style={styles.itineraryLegHeader}>
        <View style={styles.itineraryLegHeaderCopy}>
          <Text style={styles.itineraryDirection}>{direction}</Text>
          <Text style={styles.itineraryDate}>
            {formatDateHeading(flight.departureAt, timeZone, language)} · {formatDuration(flight.departureAt, flight.arrivalAt, language)}
          </Text>
        </View>
        <Text style={styles.itineraryStops}>
          {flight.stops === 0
            ? (language === 'vi' ? 'Bay thẳng' : 'Nonstop')
            : (language === 'vi' ? `${flight.stops} điểm dừng` : `${flight.stops} stop(s)`)}
        </Text>
      </View>

      <View style={styles.itineraryEvent}>
        <Text style={styles.itineraryTime}>{formatTime(flight.departureAt, timeZone, language)}</Text>
        <View style={styles.itineraryMarkerColumn}>
          <View style={styles.itineraryMarker} />
        </View>
        <Text style={styles.itineraryAirport} numberOfLines={2}>
          {flight.origin.airport || flight.origin.city} ({flight.origin.code})
        </Text>
      </View>

      <View style={styles.itineraryFlightInfo}>
        <Text style={styles.itineraryDuration}>
          {formatDuration(flight.departureAt, flight.arrivalAt, language)}
        </Text>
        <View style={styles.itineraryMarkerColumn}>
          <View style={styles.itineraryConnector} />
        </View>
        <View style={styles.itineraryFlightCopy}>
          <Text style={styles.itineraryAirline}>
            {flight.airline.name} · {flight.flightNumber}
          </Text>
          <Text style={styles.itineraryBaggage}>
            {language === 'vi' ? 'Hành lý:' : 'Baggage:'} {flight.baggageAllowanceKg} kg
          </Text>
          {flight.stops > 0 && (
            <Text style={styles.itineraryConnectionNotice}>
              Có {flight.stops} điểm dừng. Chưa có dữ liệu chi tiết sân bay trung chuyển.
            </Text>
          )}
        </View>
      </View>

      <View style={styles.itineraryEvent}>
        <Text style={styles.itineraryTime}>{formatTime(flight.arrivalAt, timeZone, language)}</Text>
        <View style={styles.itineraryMarkerColumn}>
          <View style={[styles.itineraryMarker, styles.itineraryMarkerArrival]} />
        </View>
        <Text style={styles.itineraryAirport} numberOfLines={2}>
          {flight.destination.airport || flight.destination.city} ({flight.destination.code})
        </Text>
      </View>

    </View>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{
    from?: string;
    to?: string;
    date?: string;
    adultCount?: string;
    cabinClass?: string;
    tripType?: string;
    airlines?: string | string[];
  }>();
  const settingsQuery = usePublicSettings();
  const promotionsQuery = useQuery({
    queryKey: ['promotions'],
    queryFn: getPublicPromotions,
    staleTime: 60_000,
  });
  const settings = settingsQuery.data;
  const currency = settings?.currency ?? 'VND';
  const timeZone = settings?.timezone ?? 'Asia/Ho_Chi_Minh';

  const [from, setFrom] = useState(() => {
    const requestedFrom = searchParams.from ?? '';
    return /^[A-Za-z]{3}$/.test(requestedFrom) ? requestedFrom.toUpperCase() : 'SGN';
  });
  const [to, setTo] = useState(() => {
    const requestedTo = searchParams.to ?? '';
    return /^[A-Za-z]{3}$/.test(requestedTo) ? requestedTo.toUpperCase() : 'HKG';
  });
  const [date, setDate] = useState(() => {
    const requestedDate = searchParams.date ?? '';
    return isValidCalendarDate(requestedDate) && requestedDate >= getTodayDate()
      ? requestedDate
      : getDefaultDate();
  });
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip' | 'multicity'>(() =>
    searchParams.tripType === 'roundtrip' || searchParams.tripType === 'multicity'
      ? searchParams.tripType
      : 'oneway',
  );
  const [returnDate, setReturnDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 10); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; });
  const [adultCount, setAdultCount] = useState(() => {
    const requestedCount = Number(searchParams.adultCount);
    return Number.isInteger(requestedCount) && requestedCount >= 1 && requestedCount <= 9
      ? requestedCount
      : 1;
  });
  const [childCount, setChildCount] = useState(0);
  const [infantCount, setInfantCount] = useState(0);
  const [cabinClass, setCabinClass] = useState<CabinClass>(() =>
    isCabinClass(searchParams.cabinClass)
      ? searchParams.cabinClass
      : 'economy',
  );
  const [airlineCodesInput, setAirlineCodesInput] = useState(() => {
    const requestedAirlines = Array.isArray(searchParams.airlines)
      ? searchParams.airlines.join(',')
      : searchParams.airlines ?? '';
    const normalizedAirlines = requestedAirlines.replace(/\s+/g, '').toUpperCase();
    return hasValidAirlineCodes(normalizedAirlines) ? normalizedAirlines : '';
  });
  const [multiCitySegments, setMultiCitySegments] = useState<SearchSegment[]>([
    { from: 'SGN', to: 'HKG', date: getDefaultDate() },
    { from: 'HKG', to: 'SIN', date: getDefaultDate() },
  ]);
  const [submittedMultiSegments, setSubmittedMultiSegments] = useState<SearchSegment[] | null>(null);
  const [selectedMultiFlights, setSelectedMultiFlights] = useState<(Flight | null)[]>([]);
  const [activeMultiIndex, setActiveMultiIndex] = useState(0);
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState<Flight | null>(null);
  const [selectedReturnFlight, setSelectedReturnFlight] = useState<Flight | null>(null);
  const [itineraryOpen, setItineraryOpen] = useState(false);
  const [promotionOpen, setPromotionOpen] = useState(false);
  const language = useAppLanguage();
  const [activeAirportField, setActiveAirportField] = useState<'from' | 'to' | null>(null);
  const [airportSuggestions, setAirportSuggestions] = useState<AirportSuggestion[]>([]);
  const [sort, setSort] = useState<FlightSort>('best');
  const [directOnly, setDirectOnly] = useState(false);
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [submitted, setSubmitted] = useState<FlightSearchParams | null>(null);
  const [validationError, setValidationError] = useState('');

  const passengerCount = adultCount + childCount;
  const passengerTypes = [
    ...Array.from({ length: adultCount }, () => 'adult'),
    ...Array.from({ length: childCount }, () => 'child'),
    ...Array.from({ length: infantCount }, () => 'infant'),
  ];
  const totalPassengerCount = passengerTypes.length;
  const airlineCodes = airlineCodesInput
    .split(',')
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);

  function updateMultiCitySegments(update: (current: SearchSegment[]) => SearchSegment[]) {
    setMultiCitySegments(update);
    setSubmittedMultiSegments(null);
  }

  const returnFlightsQuery = useQuery({
    queryKey: ['return-flights-search', submitted],
    queryFn: () => searchFlights({
      from: submitted!.to,
      to: submitted!.from,
      date: submitted!.returnDate!,
      sort: submitted!.sort,
      stops: submitted!.stops,
      maxPrice: submitted!.maxPrice,
      cabinClass: submitted!.cabinClass,
      airlines: submitted!.airlines,
    }),
    enabled: submitted !== null && Boolean(submitted.returnDate),
    staleTime: 0, retry: 1,
  });

  const flightsQuery = useQuery({
    queryKey: ['flights-search', submitted],
    queryFn: () => searchFlights(submitted!),
    enabled: submitted !== null && !submittedMultiSegments,
    staleTime: 0,
    retry: 1,
  });

  const multiCityFlightsQuery = useQuery({
    queryKey: ['multi-city-flights', submittedMultiSegments, sort, directOnly, cabinClass, airlineCodes, maxPriceInput],
    queryFn: async () => {
      const maxPrice = maxPriceInput.trim() ? Number(maxPriceInput) : undefined;
      return Promise.all(submittedMultiSegments!.map((segment) => searchFlights({
        from: segment.from,
        to: segment.to,
        date: segment.date,
        sort,
        stops: directOnly ? 'direct' : 'any',
        maxPrice,
        cabinClass,
        airlines: airlineCodes,
      })));
    },
    enabled: submittedMultiSegments !== null,
    staleTime: 0,
    retry: 1,
  });
  async function loadAirportSuggestions(field: 'from' | 'to', value: string) {
    setActiveAirportField(field);
    const query = value.trim();
    if (query.length < 2) { setAirportSuggestions([]); return; }
    try { setAirportSuggestions(await searchAirports(query)); } catch { setAirportSuggestions([]); }
  }

  function chooseAirport(field: 'from' | 'to', airport: AirportSuggestion) {
    (field === 'from' ? setFrom : setTo)(airport.code);
    setAirportSuggestions([]); setActiveAirportField(null);
  }

  function handleSearch() {
    if (tripType === 'multicity') {
      if (multiCitySegments.length < 2 || multiCitySegments.length > 4) {
        setValidationError('Hành trình nhiều chặng cần từ 2 đến 4 chặng.');
        return;
      }

      for (let index = 0; index < multiCitySegments.length; index += 1) {
        const segment = multiCitySegments[index];
        const normalizedFrom = segment.from.trim().toUpperCase();
        const normalizedTo = segment.to.trim().toUpperCase();

        if (!/^[A-Z]{3}$/.test(normalizedFrom) || !/^[A-Z]{3}$/.test(normalizedTo) || normalizedFrom === normalizedTo) {
          setValidationError(`Chặng ${index + 1} cần có mã sân bay đi/đến hợp lệ và khác nhau.`);
          return;
        }
        if (!isValidCalendarDate(segment.date)) {
          setValidationError(`Ngày bay chặng ${index + 1} không hợp lệ.`);
          return;
        }
        if (segment.date < getTodayDate()) {
          setValidationError(`Ngày bay chặng ${index + 1} không được nằm trong quá khứ.`);
          return;
        }
        if (index > 0) {
          const previous = multiCitySegments[index - 1];
          if (previous.to.trim().toUpperCase() !== normalizedFrom) {
            setValidationError(`Điểm đi chặng ${index + 1} phải trùng điểm đến chặng trước.`);
            return;
          }
          if (segment.date < previous.date) {
            setValidationError('Ngày các chặng phải theo thứ tự tăng dần.');
            return;
          }
        }
      }

      if (adultCount < 1 || infantCount > adultCount || totalPassengerCount > 9) {
        setValidationError('Cần ít nhất 1 người lớn, tối đa 9 hành khách và không quá 1 trẻ sơ sinh trên mỗi người lớn.');
        return;
      }
      if (!hasValidAirlineCodes(airlineCodesInput)) {
        setValidationError('Mã hãng bay phải gồm 2–3 ký tự, phân cách bằng dấu phẩy.');
        return;
      }
      if (maxPriceInput.trim() && (!Number.isFinite(Number(maxPriceInput)) || Number(maxPriceInput) <= 0)) {
        setValidationError('Giá tối đa phải là số lớn hơn 0.');
        return;
      }

      setValidationError('');
      setSelectedMultiFlights(Array(multiCitySegments.length).fill(null));
      setActiveMultiIndex(0);
      setSubmitted(null);
      setSubmittedMultiSegments(multiCitySegments.map((segment) => ({
        ...segment,
        from: segment.from.trim().toUpperCase(),
        to: segment.to.trim().toUpperCase(),
      })));
      return;
    }

    const normalizedFrom = from.trim().toUpperCase();
    const normalizedTo = to.trim().toUpperCase();
    const normalizedDate = date.trim();

    if (!/^[A-Z]{3}$/.test(normalizedFrom)) {
      setValidationError('Mã sân bay đi phải gồm 3 chữ cái, ví dụ SGN.');
      return;
    }

    if (!/^[A-Z]{3}$/.test(normalizedTo)) {
      setValidationError('Mã sân bay đến phải gồm 3 chữ cái, ví dụ HKG.');
      return;
    }

    if (normalizedFrom === normalizedTo) {
      setValidationError('Điểm đi và điểm đến không được trùng nhau.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
      setValidationError('Ngày bay phải theo định dạng YYYY-MM-DD.');
      return;
    }

    const [year, month, day] = normalizedDate.split('-').map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) {
      setValidationError('Ngày bay không hợp lệ.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedLocalDate = new Date(year, month - 1, day);

    if (selectedLocalDate < today) {
      setValidationError('Ngày bay không được nằm trong quá khứ.');
      return;
    }

    if (tripType === 'roundtrip') {
      const [ry, rm, rd] = returnDate.split('-').map(Number);
      const parsedReturn = new Date(Date.UTC(ry, rm - 1, rd));
      if (!/^\d{4}-\d{2}-\d{2}$/.test(returnDate) || parsedReturn.getUTCFullYear() !== ry || parsedReturn.getUTCMonth() !== rm - 1 || parsedReturn.getUTCDate() !== rd || returnDate < normalizedDate) {
        setValidationError('Ngày về phải là ngày hợp lệ và không trước ngày đi.'); return;
      }
    }

    if (adultCount < 1 || infantCount > adultCount || totalPassengerCount > 9) {
      setValidationError('Cần ít nhất 1 người lớn, tối đa 9 hành khách và không quá 1 trẻ sơ sinh trên mỗi người lớn.');
      return;
    }

    if (!hasValidAirlineCodes(airlineCodesInput)) {
      setValidationError('Mã hãng bay phải gồm 2–3 ký tự, phân cách bằng dấu phẩy.');
      return;
    }

    let maxPrice: number | undefined;

    if (maxPriceInput.trim()) {
      maxPrice = Number(maxPriceInput);

      if (!Number.isFinite(maxPrice) || maxPrice <= 0) {
        setValidationError('Giá tối đa phải là số lớn hơn 0.');
        return;
      }
    }

    setValidationError('');
    setSelectedOutboundFlight(null);
    setSelectedReturnFlight(null);
    setSubmittedMultiSegments(null);
    setSubmitted({
      from: normalizedFrom,
      to: normalizedTo,
      date: normalizedDate,
      sort,
      stops: directOnly ? 'direct' : 'any',
      maxPrice,
      cabinClass,
      airlines: airlineCodes,
      returnDate: tripType === 'roundtrip' ? returnDate : undefined,
    });
  }

  function startOneWayBooking() {
    if (!selectedOutboundFlight) {
      setValidationError('Vui lòng chọn chuyến bay.');
      return;
    }

    setValidationError('');
    setItineraryOpen(false);
    const eventPromotion = getEventPromotionForBooking(
      [selectedOutboundFlight],
      promotionsQuery.data?.data,
    );
    router.push({
      pathname: '/booking/seats',
      params: {
        flightId: selectedOutboundFlight._id,
        passengerCount: String(passengerCount),
        passengerTypes: JSON.stringify(passengerTypes),
        cabinClass,
        ...(eventPromotion ? { promotionCode: eventPromotion.code } : {}),
      },
    });
  }

  function startRoundTripBooking() {
    if (!selectedOutboundFlight || !selectedReturnFlight) {
      setValidationError('Vui lòng chọn đủ chuyến bay chiều đi và chiều về.');
      return;
    }

    if (
      selectedOutboundFlight.origin.code !== selectedReturnFlight.destination.code ||
      selectedOutboundFlight.destination.code !== selectedReturnFlight.origin.code ||
      new Date(selectedReturnFlight.departureAt) <= new Date(selectedOutboundFlight.arrivalAt)
    ) {
      setValidationError('Chuyến bay chiều về phải đúng chiều và khởi hành sau khi chuyến đi đến nơi.');
      return;
    }

    setValidationError('');
    setItineraryOpen(false);
    const eventPromotion = getEventPromotionForBooking(
      [selectedOutboundFlight, selectedReturnFlight],
      promotionsQuery.data?.data,
    );
    router.push({
      pathname: '/booking/seats',
      params: {
        flightId: selectedOutboundFlight._id,
        returnFlightId: selectedReturnFlight._id,
        passengerCount: String(passengerCount),
        passengerTypes: JSON.stringify(passengerTypes),
        cabinClass,
        leg: 'outbound',
        ...(eventPromotion ? { promotionCode: eventPromotion.code } : {}),
      },
    });
  }

  function canSelectMultiCityFlight(index: number, flight: Flight) {
    const previous = selectedMultiFlights[index - 1];
    const next = selectedMultiFlights[index + 1];
    return (!previous || (
      previous.destination.code === flight.origin.code &&
      new Date(flight.departureAt) > new Date(previous.arrivalAt)
    )) && (!next || (
      flight.destination.code === next.origin.code &&
      new Date(next.departureAt) > new Date(flight.arrivalAt)
    ));
  }

  function selectMultiCityFlight(index: number, flight: Flight) {
    setSelectedMultiFlights((current) => current.map((item, itemIndex) => itemIndex === index ? flight : item));
    setValidationError('');
    if (index < multiCitySegments.length - 1) {
      setActiveMultiIndex(index + 1);
    }
  }

  function startMultiCityBooking() {
    const legs = selectedMultiFlights.filter((flight): flight is Flight => flight !== null);
    if (legs.length !== submittedMultiSegments?.length) {
      setValidationError('Vui lòng chọn một chuyến bay cho mỗi chặng.');
      return;
    }

    const eventPromotion = getEventPromotionForBooking(
      legs,
      promotionsQuery.data?.data,
    );
    router.push({
      pathname: '/booking/seats',
      params: {
        multiFlightIds: JSON.stringify(legs.map((flight) => flight._id)),
        passengerCount: String(passengerCount),
        passengerTypes: JSON.stringify(passengerTypes),
        cabinClass,
        legIndex: '0',
        multiSeats: JSON.stringify([]),
        ...(eventPromotion ? { promotionCode: eventPromotion.code } : {}),
      },
    });
  }

  const itineraryFlights = [
    selectedOutboundFlight,
    selectedReturnFlight,
  ].filter((flight): flight is Flight => flight !== null);
  const itineraryCurrency = selectedOutboundFlight?.currency || currency;
  const itineraryHasSingleCurrency = itineraryFlights.every(
    (flight) => (flight.currency || currency) === itineraryCurrency,
  );
  const itineraryTotal = itineraryFlights.reduce(
    (total, flight) => total + flight.basePrice,
    0,
  );
  const canContinueItinerary =
    Boolean(selectedOutboundFlight) &&
    itineraryFlights.every((flight) => flight.status === 'scheduled') &&
    settings?.bookingEnabled !== false &&
    !settings?.maintenanceMode &&
    (!submitted?.returnDate || Boolean(selectedReturnFlight));
  const isWideItinerary = useWindowDimensions().width >= 960;

  return (
    <>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.heading}>
        <Text style={styles.title}>Tìm chuyến bay</Text>
        <Text style={styles.subtitle}>
          Tìm chuyến bay từ dữ liệu MongoDB của hệ thống
        </Text>
      </View>

      <BookingSettingsNotice
        settings={settings}
        error={settingsQuery.isError ? 'Không tải được cài đặt.' : undefined}
      />

      <View style={styles.searchCard}>
        {tripType !== 'multicity' && (
          <>
        <Text style={styles.label}>Điểm đi (mã sân bay)</Text>
        <TextInput
          style={styles.input}
          value={from}
          onFocus={() => setActiveAirportField('from')}
          onChangeText={(value) => { setFrom(value.toUpperCase()); void loadAirportSuggestions('from', value); }}
          placeholder="Mã hoặc tên sân bay / thành phố"
          autoCapitalize="characters"
        />
        {activeAirportField === 'from' && airportSuggestions.map((airport) => (
          <Pressable key={`from-${airport.code}`} style={styles.suggestion} onPress={() => chooseAirport('from', airport)}>
            <Text style={styles.suggestionCode}>{airport.code}</Text><View style={{flex:1}}><Text style={styles.suggestionCity}>{airport.city}</Text><Text style={styles.suggestionAirport}>{airport.airport}</Text></View>
          </Pressable>
        ))}

        <Text style={styles.label}>Điểm đến (mã sân bay)</Text>
        <TextInput
          style={styles.input}
          value={to}
          onFocus={() => setActiveAirportField('to')}
          onChangeText={(value) => { setTo(value.toUpperCase()); void loadAirportSuggestions('to', value); }}
          placeholder="Mã hoặc tên sân bay / thành phố"
          autoCapitalize="characters"
        />
        {activeAirportField === 'to' && airportSuggestions.map((airport) => (
          <Pressable key={`to-${airport.code}`} style={styles.suggestion} onPress={() => chooseAirport('to', airport)}>
            <Text style={styles.suggestionCode}>{airport.code}</Text><View style={{flex:1}}><Text style={styles.suggestionCity}>{airport.city}</Text><Text style={styles.suggestionAirport}>{airport.airport}</Text></View>
          </Pressable>
        ))}
          </>
        )}

        {tripType === 'multicity' && (
          <>
            {multiCitySegments.map((segment, index) => (
              <View key={`multi-city-${index}`} style={styles.segmentCard}>
                <View style={styles.segmentHeading}>
                  <Text style={styles.segmentTitle}>Chặng {index + 1}</Text>
                  {multiCitySegments.length > 2 && (
                    <Pressable onPress={() => updateMultiCitySegments((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                      <Text style={styles.removeSegment}>Xóa</Text>
                    </Pressable>
                  )}
                </View>
                <Text style={styles.label}>Điểm đi</Text>
                <TextInput
                  style={styles.input}
                  value={segment.from}
                  onChangeText={(value) => updateMultiCitySegments((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, from: value.toUpperCase() } : item))}
                  placeholder="Mã sân bay"
                  autoCapitalize="characters"
                  maxLength={3}
                />
                <Text style={styles.label}>Điểm đến</Text>
                <TextInput
                  style={styles.input}
                  value={segment.to}
                  onChangeText={(value) => updateMultiCitySegments((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, to: value.toUpperCase() } : item))}
                  placeholder="Mã sân bay"
                  autoCapitalize="characters"
                  maxLength={3}
                />
                <Text style={styles.label}>Ngày bay (YYYY-MM-DD)</Text>
                <DateField
                  value={segment.date}
                  onChange={(value) => updateMultiCitySegments((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, date: value } : item))}
                />
              </View>
            ))}
            <Pressable
              style={styles.addSegmentButton}
              disabled={multiCitySegments.length >= 4}
              onPress={() => updateMultiCitySegments((current) => [
                ...current,
                {
                  from: current[current.length - 1].to,
                  to: '',
                  date: current[current.length - 1].date,
                },
              ])}
            >
              <Text style={styles.addSegmentText}>
                {multiCitySegments.length >= 4 ? 'Tối đa 4 chặng' : '+ Thêm chặng'}
              </Text>
            </Pressable>
          </>
        )}

        <Text style={styles.label}>Loại hành trình</Text>
        <View style={styles.sortRow}>
          {([['oneway','Một chiều'],['roundtrip','Khứ hồi'],['multicity','Nhiều chặng']] as const).map(([value,label]) => <Pressable key={value} onPress={() => { setTripType(value); setSubmitted(null); setSubmittedMultiSegments(null); }} style={[styles.sortButton, tripType===value && styles.sortButtonActive]}><Text style={[styles.sortText,tripType===value&&styles.sortTextActive]}>{label}</Text></Pressable>)}
        </View>
        <Text style={styles.label}>Hành khách (tối đa 9)</Text>
        {[
          { key: 'adult', label: 'Người lớn · từ 12 tuổi', count: adultCount, setCount: setAdultCount, min: 1 },
          { key: 'child', label: 'Trẻ em · 2–11 tuổi', count: childCount, setCount: setChildCount, min: 0 },
          { key: 'infant', label: 'Trẻ sơ sinh · dưới 2 tuổi', count: infantCount, setCount: setInfantCount, min: 0 },
        ].map((traveller) => (
          <View key={traveller.label} style={styles.travellerRow}>
            <Text style={styles.travellerLabel}>{traveller.label}</Text>
            <View style={styles.counter}>
              <Pressable
                style={styles.countButton}
                disabled={traveller.count <= traveller.min || (traveller.key === 'adult' && adultCount <= infantCount)}
                onPress={() => traveller.setCount((count) => Math.max(traveller.min, count - 1))}
                accessibilityLabel={`Giảm ${traveller.label}`}
              >
                <Text style={styles.countButtonText}>−</Text>
              </Pressable>
              <Text style={styles.passengerCount}>{traveller.count}</Text>
              <Pressable
                style={styles.countButton}
                disabled={totalPassengerCount >= 9 || (traveller.key === 'infant' && infantCount >= adultCount)}
                onPress={() => traveller.setCount((count) => count + 1)}
                accessibilityLabel={`Tăng ${traveller.label}`}
              >
                <Text style={styles.countButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
        ))}
        <Text style={styles.passengerHint}>
          Trẻ sơ sinh không chiếm ghế riêng; giá demo bằng 10% giá vé người lớn và cần đi cùng người lớn.
        </Text>
        <Text style={styles.label}>Hạng ghế</Text>
        <View style={styles.sortRow}>
          {([
            ['economy', 'Phổ thông'],
            ['premium_economy', 'Phổ thông cao cấp'],
            ['business', 'Thương gia'],
            ['first', 'Hạng nhất'],
          ] as const).map(([value, label]) => (
            <Pressable key={value} onPress={() => setCabinClass(value)} style={[styles.sortButton, styles.cabinButton, cabinClass === value && styles.sortButtonActive]}>
              <Text style={[styles.sortText, cabinClass === value && styles.sortTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        {tripType !== 'multicity' && <><Text style={styles.label}>Ngày đi (YYYY-MM-DD)</Text>
        <DateField value={date} onChange={setDate} />

        {tripType === 'roundtrip' && <><Text style={styles.label}>Ngày về (YYYY-MM-DD)</Text><DateField value={returnDate} onChange={setReturnDate} minimumDate={date} /></>}</>}

        <Text style={styles.label}>Giá tối đa (không bắt buộc)</Text>
        <TextInput
          style={styles.input}
          value={maxPriceInput}
          onChangeText={setMaxPriceInput}
          placeholder="Ví dụ: 3000000"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Sắp xếp</Text>
        <View style={styles.sortRow}>
          {([
            ['best', 'Phù hợp'],
            ['cheapest', 'Giá thấp'],
            ['fastest', 'Bay nhanh'],
          ] as const).map(([value, label]) => (
            <Pressable
              key={value}
              onPress={() => setSort(value)}
              style={[
                styles.sortButton,
                sort === value && styles.sortButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.sortText,
                  sort === value && styles.sortTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Hãng bay (mã, cách nhau bằng dấu phẩy)</Text>
        <TextInput
          style={styles.input}
          value={airlineCodesInput}
          onChangeText={setAirlineCodesInput}
          placeholder="Ví dụ: VN,VJ"
          autoCapitalize="characters"
        />

        <Pressable
          style={styles.checkboxRow}
          onPress={() => setDirectOnly((value) => !value)}
        >
          <View
            style={[
              styles.checkbox,
              directOnly && styles.checkboxChecked,
            ]}
          >
            {directOnly && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Chỉ chuyến bay thẳng</Text>
        </Pressable>

        {validationError ? (
          <Text style={styles.validationError}>{validationError}</Text>
        ) : null}

        <Pressable style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Tìm chuyến bay</Text>
        </Pressable>
      </View>

      {flightsQuery.isFetching && !submittedMultiSegments && (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#2878B9" />
          <Text style={styles.loadingText}>Đang tìm chuyến bay...</Text>
        </View>
      )}

      {submittedMultiSegments && multiCityFlightsQuery.isFetching && (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#2878B9" />
          <Text style={styles.loadingText}>Đang tìm chuyến bay cho từng chặng...</Text>
        </View>
      )}

      {submittedMultiSegments && multiCityFlightsQuery.isError && !multiCityFlightsQuery.isFetching && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Không thể tìm chuyến bay</Text>
          <Text style={styles.errorText}>
            {multiCityFlightsQuery.error instanceof Error
              ? multiCityFlightsQuery.error.message
              : 'Đã xảy ra lỗi khi tìm một trong các chặng.'}
          </Text>
          <Pressable onPress={() => void multiCityFlightsQuery.refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      )}

      {submittedMultiSegments && multiCityFlightsQuery.data && !multiCityFlightsQuery.isFetching && (
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeading}>
            <Text style={styles.resultsTitle}>Chọn chuyến bay từng chặng</Text>
            <Pressable
              style={styles.promotionButton}
              onPress={() => setPromotionOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={language === 'vi' ? 'Xem khuyến mãi' : 'View promotions'}
            >
              <Text style={styles.promotionButtonText}>✦ {language === 'vi' ? 'Khuyến mãi' : 'Promotions'}</Text>
            </Pressable>
          </View>
          <Text style={styles.resultsSubtitle}>Chọn đủ {submittedMultiSegments.length} chuyến theo đúng thứ tự hành trình.</Text>
          <View style={styles.segmentTabs}>
            {submittedMultiSegments.map((segment, index) => (
              <Pressable
                key={`${segment.from}-${segment.to}-${index}`}
                style={[styles.segmentTab, activeMultiIndex === index && styles.segmentTabActive]}
                onPress={() => setActiveMultiIndex(index)}
              >
                <Text style={[styles.segmentTabText, activeMultiIndex === index && styles.segmentTabTextActive]}>
                  {index + 1}. {segment.from} → {segment.to}
                </Text>
                <Text style={styles.segmentTabDate}>{segment.date}</Text>
              </Pressable>
            ))}
          </View>
          {selectedMultiFlights.map((flight, index) => flight && (
            <Pressable key={`selected-leg-${flight._id}`} onPress={() => setActiveMultiIndex(index)}>
              <Text style={styles.selectedFlightSummary}>
                Chặng {index + 1}: {flight.flightNumber} · {flight.origin.code} → {flight.destination.code} · Đổi
              </Text>
            </Pressable>
          ))}
          <Text style={styles.resultsCount}>
            Chặng {activeMultiIndex + 1} · tìm thấy {multiCityFlightsQuery.data[activeMultiIndex]?.count ?? 0} chuyến
          </Text>
          {multiCityFlightsQuery.data[activeMultiIndex]?.data.length ? (
            multiCityFlightsQuery.data[activeMultiIndex].data.map((flight) => (
              <FlightCard
                key={flight._id}
                flight={flight}
                eventPromotion={getFlightEventPromotion(
                  flight,
                  promotionsQuery.data?.data,
                )}
                selected={selectedMultiFlights[activeMultiIndex]?._id === flight._id}
                disabled={!canSelectMultiCityFlight(activeMultiIndex, flight)}
                onPress={() => selectMultiCityFlight(activeMultiIndex, flight)}
                currency={currency}
                timeZone={timeZone}
              />
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Image
                source={require('../../assets/images/illustrations/no-flight.png')}
                style={styles.emptyIllustration}
                resizeMode="contain"
                accessibilityLabel="Minh họa chưa có chuyến bay"
              />
              <Text style={styles.emptyTitle}>Không tìm thấy chuyến bay</Text>
              <Text style={styles.emptyText}>Không có chuyến phù hợp với chặng này. Hãy thử ngày khác hoặc bỏ bớt bộ lọc.</Text>
            </View>
          )}
          <Pressable
            style={[styles.searchButton, selectedMultiFlights.some((flight) => !flight) && styles.buttonDisabled]}
            disabled={selectedMultiFlights.some((flight) => !flight)}
            onPress={startMultiCityBooking}
          >
            <Text style={styles.searchButtonText}>Tiếp tục chọn ghế</Text>
          </Pressable>
        </View>
      )}

      {flightsQuery.isError && !submittedMultiSegments && !flightsQuery.isFetching && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Không thể tìm chuyến bay</Text>
          <Text style={styles.errorText}>
            {flightsQuery.error instanceof Error
              ? flightsQuery.error.message
              : 'Đã xảy ra lỗi kết nối đến máy chủ.'}
          </Text>
          <Pressable
            onPress={() => void flightsQuery.refetch()}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      )}

      {flightsQuery.data && !submittedMultiSegments && !flightsQuery.isFetching && (
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeading}>
            <Text style={styles.resultsTitle}>Kết quả tìm kiếm</Text>
            <Pressable
              style={styles.promotionButton}
              onPress={() => setPromotionOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={language === 'vi' ? 'Xem khuyến mãi' : 'View promotions'}
            >
              <Text style={styles.promotionButtonText}>✦ {language === 'vi' ? 'Khuyến mãi' : 'Promotions'}</Text>
            </Pressable>
          </View>
          <Text style={styles.resultsSubtitle}>
            {submitted?.from} → {submitted?.to} · {submitted?.date}
          </Text>
          <Text style={styles.resultsCount}>
            Tìm thấy {flightsQuery.data.count} chuyến bay
          </Text>
          {submitted?.returnDate && (
            <Text style={styles.mutedRoundTrip}>
              Chọn chuyến đi, chuyến về, sau đó chọn ghế riêng cho từng chặng.
            </Text>
          )}

          {flightsQuery.data.data.length === 0 ? (
            <View style={styles.emptyCard}>
              <Image
                source={require('../../assets/images/illustrations/no-flight.png')}
                style={styles.emptyIllustration}
                resizeMode="contain"
                accessibilityLabel="Minh họa chưa có chuyến bay"
              />
              <Text style={styles.emptyTitle}>Không tìm thấy chuyến bay</Text>
              <Text style={styles.emptyText}>
                Không có chuyến bay phù hợp với ngày và điều kiện bạn chọn.
                Hãy thử ngày khác hoặc bỏ lọc chuyến bay thẳng.
              </Text>
            </View>
          ) : (
            flightsQuery.data.data.map((flight) => (
              <FlightCard
                key={flight._id}
                flight={flight}
                eventPromotion={getFlightEventPromotion(
                  flight,
                  promotionsQuery.data?.data,
                )}
                selected={selectedOutboundFlight?._id === flight._id}
                onPress={() => {
                  if (submitted?.returnDate) {
                    setSelectedOutboundFlight(flight);
                    setSelectedReturnFlight(null);
                    setItineraryOpen(false);
                    setValidationError('');
                  } else {
                    setSelectedOutboundFlight(flight);
                    setSelectedReturnFlight(null);
                    setItineraryOpen(true);
                    setValidationError('');
                  }
                }}
                currency={currency}
                timeZone={timeZone}
              />
            ))
          )}

          {submitted?.returnDate && <View style={{ marginTop: 18 }}>
            <Text style={styles.resultsTitle}>Chuyến bay chiều về</Text>
            <Text style={styles.resultsSubtitle}>{submitted.to} → {submitted.from} · {submitted.returnDate}</Text>
            {returnFlightsQuery.isError ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>
                  {returnFlightsQuery.error instanceof Error
                    ? returnFlightsQuery.error.message
                    : 'Không thể tìm chuyến bay chiều về.'}
                </Text>
                <Pressable
                  onPress={() => void returnFlightsQuery.refetch()}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryText}>Tìm lại chuyến về</Text>
                </Pressable>
              </View>
            ) : returnFlightsQuery.isFetching ? (
              <ActivityIndicator color="#2878B9" />
            ) : returnFlightsQuery.data?.data.length ? (
              returnFlightsQuery.data.data.map((flight) => {
                const departsAfterOutbound = Boolean(selectedOutboundFlight) &&
                  new Date(flight.departureAt) > new Date(selectedOutboundFlight!.arrivalAt);
                const returnsToOrigin = Boolean(selectedOutboundFlight) &&
                  flight.origin.code === selectedOutboundFlight!.destination.code &&
                  flight.destination.code === selectedOutboundFlight!.origin.code;
                const validReturn = departsAfterOutbound && returnsToOrigin;

                return (
                  <FlightCard
                    key={`return-${flight._id}`}
                    flight={flight}
                    eventPromotion={getFlightEventPromotion(
                      flight,
                      promotionsQuery.data?.data,
                    )}
                    selected={selectedReturnFlight?._id === flight._id}
                    disabled={!validReturn}
                    onPress={() => {
                      setSelectedReturnFlight(flight);
                      setItineraryOpen(true);
                      setValidationError('');
                    }}
                    currency={currency}
                    timeZone={timeZone}
                  />
                );
              })
            ) : (
              <Text style={styles.emptyText}>Không tìm thấy chuyến bay chiều về cho ngày đã chọn.</Text>
            )}
            {selectedOutboundFlight && (
              <Text style={styles.selectedFlightSummary}>
                Chiều đi: {selectedOutboundFlight.flightNumber} · {selectedOutboundFlight.origin.code} → {selectedOutboundFlight.destination.code}
              </Text>
            )}
            {selectedReturnFlight && (
              <Text style={styles.selectedFlightSummary}>
                Chiều về: {selectedReturnFlight.flightNumber} · {selectedReturnFlight.origin.code} → {selectedReturnFlight.destination.code}
              </Text>
            )}
            <Pressable
              style={[
                styles.searchButton,
                (!selectedOutboundFlight || !selectedReturnFlight) && styles.buttonDisabled,
              ]}
              disabled={!selectedOutboundFlight || !selectedReturnFlight}
              onPress={startRoundTripBooking}
            >
              <Text style={styles.searchButtonText}>Tiếp tục chọn ghế chiều đi và chiều về</Text>
            </Pressable>
          </View>}

          <Text style={styles.sourceText}>
            Nguồn dữ liệu: {flightsQuery.data.source === 'cache'
              ? 'bộ nhớ đệm'
              : 'MongoDB'}
          </Text>
        </View>
      )}
    </ScrollView>

    <Modal
      visible={promotionOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setPromotionOpen(false)}
    >
      <View style={styles.modalBackdrop}>
        <Pressable
        style={StyleSheet.absoluteFill}
          onPress={() => setPromotionOpen(false)}
          accessibilityRole="button"
          accessibilityLabel={language === 'vi' ? 'Đóng khuyến mãi' : 'Close promotions'}
        />
        <View style={[styles.itineraryModal, styles.promotionModal]}>
          <View style={styles.itineraryModalHeader}>
            <Text style={styles.itineraryModalTitle}>
              {language === 'vi' ? 'Khuyến mãi chuyến bay' : 'Flight promotions'}
            </Text>
            <Pressable
              style={styles.itineraryCloseButton}
              onPress={() => setPromotionOpen(false)}
              accessibilityRole="button"
              accessibilityLabel={language === 'vi' ? 'Đóng' : 'Close'}
            >
              <Text style={styles.itineraryCloseText}>×</Text>
            </Pressable>
          </View>
          {promotionsQuery.isLoading ? (
            <View style={styles.promotionEmpty}>
              <ActivityIndicator color="#2878B9" />
              <Text style={styles.promotionEmptyText}>
                {language === 'vi' ? 'Đang tải khuyến mãi...' : 'Loading promotions...'}
              </Text>
            </View>
          ) : promotionsQuery.isError ? (
            <View style={styles.promotionEmpty}>
              <Text style={styles.promotionEmptyText}>
                {promotionsQuery.error instanceof Error
                  ? promotionsQuery.error.message
                  : (language === 'vi' ? 'Không tải được khuyến mãi.' : 'Could not load promotions.')}
              </Text>
              <Pressable onPress={() => void promotionsQuery.refetch()} style={styles.retryButton}>
                <Text style={styles.retryText}>{language === 'vi' ? 'Thử lại' : 'Try again'}</Text>
              </Pressable>
            </View>
          ) : promotionsQuery.data?.data.length ? (
            <ScrollView style={styles.promotionList}>
              {promotionsQuery.data.data.map((promotion) => (
                <View key={promotion._id} style={styles.promotionOfferCard}>
                  <View style={styles.promotionOfferTop}>
                    <View style={styles.promotionCodeBadge}>
                      <Text style={styles.promotionCodeText}>{promotion.code}</Text>
                    </View>
                    <Text style={styles.promotionDiscount}>
                      {promotion.discountType === 'percentage'
                        ? `${promotion.discountValue}%`
                        : formatPrice(promotion.discountValue, 'VND', language)}
                    </Text>
                  </View>
                  <Text style={styles.promotionOfferTitle}>
                    {language === 'en'
                      ? (promotion.eventTitleEn || promotion.eventTitle || promotion.titleEn || promotion.title)
                      : (promotion.eventTitle || promotion.title)}
                  </Text>
                  <Text style={styles.promotionOfferText}>
                    {language === 'en'
                      ? (promotion.descriptionEn || promotion.description)
                      : promotion.description}
                  </Text>
                  {promotion.airlineCode ? (
                    <Text style={styles.promotionOfferText}>
                      {language === 'vi' ? 'Hãng bay: ' : 'Airline: '}
                      {promotion.airlineCode}
                    </Text>
                  ) : null}
                  <Text style={styles.promotionOfferText}>
                    {language === 'vi' ? 'Tổng vé tối thiểu: ' : 'Minimum total base fare: '}
                    {formatPrice(promotion.minimumBaseFare, 'VND', language)}
                    {promotion.maxDiscount
                      ? ` · ${language === 'vi' ? 'Tối đa: ' : 'Max discount: '}${formatPrice(promotion.maxDiscount, 'VND', language)}`
                      : ''}
                  </Text>
                  <Text style={styles.promotionOfferText}>
                    {language === 'vi' ? 'Hạn dùng: ' : 'Valid until: '}
                    {new Date(promotion.endsAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                  </Text>
                  <Text style={styles.promotionOfferText}>
                    {language === 'vi' ? 'Áp dụng: ' : 'Applies to: '}
                    {promotion.applicability === 'all'
                      ? (language === 'vi' ? 'Mọi hành trình' : 'All trips')
                      : promotion.applicability === 'domestic'
                        ? (language === 'vi' ? 'Nội địa' : 'Domestic')
                        : (language === 'vi' ? 'Quốc tế' : 'International')}
                  </Text>
                  <Text style={styles.promotionOfferFootnote}>
                    {language === 'vi'
                      ? 'Nhập mã này ở bước thông tin hành khách.'
                      : 'Enter this code on the passenger details step.'}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.promotionEmpty}>
              <Text style={styles.promotionIcon}>✦</Text>
              <Text style={styles.promotionEmptyTitle}>
                {language === 'vi' ? 'Chưa có ưu đãi được cấu hình' : 'No offers configured yet'}
              </Text>
              <Text style={styles.promotionEmptyText}>
                {language === 'vi'
                  ? 'Giá vé đang hiển thị là giá cơ bản từ hệ thống. Chúng tôi sẽ cập nhật tại đây khi có chương trình khuyến mãi chính thức.'
                  : 'Displayed fares are the system base prices. Official promotions will appear here once configured.'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
    <Modal
      visible={itineraryOpen && Boolean(selectedOutboundFlight)}
      transparent
      animationType="fade"
      onRequestClose={() => setItineraryOpen(false)}
    >
      <View style={styles.modalBackdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setItineraryOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Đóng chi tiết hành trình"
        />
        <View style={[styles.itineraryModal, isWideItinerary && styles.itineraryModalWide]}>
          <View style={styles.itineraryModalHeader}>
            <View style={styles.itineraryModalHeaderCopy}>
              <Text style={styles.itineraryModalTitle}>
                {selectedOutboundFlight?.origin.code}
                {selectedReturnFlight ? ' ↔ ' : ' → '}
                {selectedOutboundFlight?.destination.code}
              </Text>
              <Text style={styles.itineraryModalSubtitle}>
                {selectedOutboundFlight?.origin.city} · {selectedOutboundFlight?.destination.city}
              </Text>
            </View>
            <Pressable
              style={styles.itineraryCloseButton}
              onPress={() => setItineraryOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Đóng"
            >
              <Text style={styles.itineraryCloseText}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.itineraryScroll}
            contentContainerStyle={styles.itineraryScrollContent}
          >
            <View style={[
              styles.itineraryColumns,
              isWideItinerary && styles.itineraryColumnsWide,
            ]}>
              {selectedOutboundFlight && (
                <FlightItineraryLeg
                  flight={selectedOutboundFlight}
                  direction="Chiều đi"
                  timeZone={timeZone}
                />
              )}
              {selectedReturnFlight && (
                <View style={[
                  styles.itineraryReturnColumn,
                  isWideItinerary && styles.itineraryReturnColumnWide,
                ]}>
                  <FlightItineraryLeg
                    flight={selectedReturnFlight}
                    direction="Chiều về"
                    timeZone={timeZone}
                  />
                </View>
              )}
            </View>
          </ScrollView>

          <View style={[
            styles.itineraryFooter,
            isWideItinerary && styles.itineraryFooterWide,
          ]}>
            <Text style={styles.itineraryTripType}>
              {selectedReturnFlight ? 'Khứ hồi' : 'Một chiều'}
            </Text>
            <View style={styles.itineraryFooterAction}>
              <View style={styles.itineraryTotalBlock}>
                <Text style={styles.itineraryTotalLabel}>Giá cơ bản / khách</Text>
                <Text style={styles.itineraryTotal}>
                  {itineraryHasSingleCurrency
                    ? formatPrice(itineraryTotal, itineraryCurrency, language)
                    : 'Giá theo từng chặng'}
                </Text>
                <Text style={styles.itineraryFooterHint}>
                  Giá có thể đổi theo ghế và dịch vụ bổ sung.
                </Text>
              </View>
              <Pressable
                style={[
                  styles.itineraryContinueButton,
                  !canContinueItinerary && styles.buttonDisabled,
                ]}
                disabled={!canContinueItinerary}
                onPress={selectedReturnFlight
                  ? startRoundTripBooking
                  : startOneWayBooking}
              >
                <Text style={styles.itineraryContinueText}>Tiếp tục</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { width: '100%', maxWidth: 1050, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 22, paddingBottom: 48 },
  heading: { marginBottom: 20 },
  title: { fontSize: 29, lineHeight: 36, fontWeight: '900', color: '#123B5D', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, lineHeight: 20, color: '#687F91', marginTop: 7 },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E1EAF1',
    shadowColor: '#123B5D',
    shadowOpacity: 0.07,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 9 },
    elevation: 3,
  },
  flightCardSelected: { borderColor: '#E8C27A', borderWidth: 2, backgroundColor: '#FFFCF5' },
  flightCardDisabled: { opacity: 0.45 },
  selectedFlightSummary: {   color: '#2878B9', fontWeight: '700', marginTop: 10 },
  buttonDisabled: { opacity: 0.5 },
  label: {
    color: '#526C80',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1EAF1',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#123B5D',
    backgroundColor: '#FBFDFF',
  },
  dateInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateTextInput: { flex: 1 },
  calendarButton: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: '#E1EAF1',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  calendarButtonText: {   color: '#2878B9', fontSize: 22 },
  calendar: {
    marginTop: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E1EAF1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  calendarNavButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  calendarNavText: {   color: '#2878B9', fontSize: 28, lineHeight: 32 },
  calendarNavDisabled: { color: '#D0D5DD' },
  calendarMonth: { color: '#123B5D', fontSize: 15, fontWeight: '800', textTransform: 'capitalize' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarWeekday: { width: '14.2857%', height: 34, color: '#687F91', fontSize: 12, fontWeight: '700', textAlign: 'center', textAlignVertical: 'center' },
  calendarDayCell: { width: '14.2857%', height: 40, alignItems: 'center', justifyContent: 'center' },
  calendarDayButton: { borderRadius: 20 },
  calendarDaySelected: { backgroundColor: '#2878B9' },
  calendarDayDisabled: { opacity: 0.4 },
  calendarDayText: { color: '#526C80', fontSize: 14 },
  calendarDaySelectedText: { color: '#FFFFFF', fontWeight: '800' },
  calendarDayDisabledText: { color: '#98A2B3' },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  passengerCountRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  travellerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  travellerLabel: { color: '#526C80', fontSize: 13, flex: 1, paddingRight: 8 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countButton: { width: 40, height: 40, borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  countButtonText: {   color: '#2878B9', fontSize: 22, fontWeight: '700' },
  passengerCount: { minWidth: 20, color: '#123B5D', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  passengerHint: { color: '#687F91', fontSize: 12, lineHeight: 18, marginTop: 2 },
  segmentCard: { backgroundColor: '#F7F9FC', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E1EAF1' },
  segmentHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  segmentTitle: { color: '#123B5D', fontSize: 15, fontWeight: '800' },
  removeSegment: { color: '#B42318', fontWeight: '700' },
  addSegmentButton: { alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#2878B9', borderStyle: 'dashed', borderRadius: 10, marginBottom: 8 },
  addSegmentText: { color: '#2878B9', fontWeight: '800' },
  sortButton: {
    flex: 1,
    minHeight: 43,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cabinButton: { flexBasis: '46%' },
  sortButtonActive: {
    backgroundColor: '#EAF4FC',
    borderColor: '#2878B9',
  },
  sortText: { color: '#475467', fontSize: 12 },
  sortTextActive: { color: '#2878B9', fontWeight: '800' },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    gap: 10,
  },
  checkbox: {
    width: 21,
    height: 21,
    borderWidth: 1.5,
    borderColor: '#98A2B3',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#2878B9', borderColor: '#2878B9' },
  checkmark: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  checkboxLabel: { color: '#526C80', fontSize: 14 },
  validationError: { color: '#B42318', marginTop: 12, lineHeight: 20 },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 1, borderColor: '#E1EAF1', backgroundColor: '#F7F9FC' },
  suggestionCode: { color: '#2878B9', fontWeight: '800', width: 45 },
  suggestionCity: { color: '#123B5D', fontWeight: '700' },
  suggestionAirport: { color: '#687F91', fontSize: 12, marginTop: 2 },
  mutedRoundTrip: { color: '#687F91', fontSize: 12, marginTop: 8, lineHeight: 18 },
  searchButton: {
    backgroundColor: '#123B5D',
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  searchButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 28,
    marginTop: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4EBF2',
  },
  loadingText: { color: '#687F91', marginTop: 10 },
  errorCard: {
    backgroundColor: '#FEF3F2',
    padding: 18,
    borderRadius: 15,
    marginTop: 18,
  },
  errorTitle: { color: '#B42318', fontWeight: '800', fontSize: 16 },
  errorText: { color: '#B42318', marginTop: 7, lineHeight: 20 },
  retryButton: { alignSelf: 'flex-start', marginTop: 12 },
  retryText: { color: '#2878B9', fontWeight: '800' },
  resultsSection: { marginTop: 30 },
  resultsHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultsTitle: { color: '#123B5D', fontSize: 23, fontWeight: '900', letterSpacing: -0.3 },
  promotionButton: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F2D59B',
    backgroundColor: '#FFF8E8',
  },
  promotionButtonText: { color: '#8B5C10', fontWeight: '800', fontSize: 13 },
  resultsSubtitle: { color: '#687F91', marginTop: 5 },
  resultsCount: {
    color: '#526C80',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
  },
  segmentTabs: { gap: 8, marginBottom: 12 },
  segmentTab: { borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 10, padding: 11, backgroundColor: '#FFFFFF' },
  segmentTabActive: { borderColor: '#2878B9', backgroundColor: '#EAF4FC' },
  segmentTabText: { color: '#526C80', fontWeight: '700' },
  segmentTabTextActive: { color: '#2878B9' },
  segmentTabDate: { color: '#687F91', fontSize: 12, marginTop: 3 },
  flightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E1EAF1',
    padding: 17,
    marginBottom: 14,
    shadowColor: '#123B5D',
    shadowOpacity: 0.045,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  flightCardCampaign: {
    padding: 0,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#052943',
    backgroundColor: '#052943',
  },
  flightCardWide: { padding: 18 },
  eventCampaignBanner: {
    width: '100%',
    height: 70,
    justifyContent: 'center',
    backgroundColor: '#052943',
  },
  eventCampaignImage: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  eventCampaignOverlay: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(2, 20, 36, 0.42)',
  },
  eventCampaignTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  eventCampaignDeal: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'right',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
  flightMain: { gap: 14 },
  flightMainCampaign: { padding: 15, backgroundColor: '#FFFFFF' },
  flightMainWide: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  flightMainWideCampaign: { padding: 15 },
  carrierBlock: { gap: 7 },
  carrierBlockWide: { width: '25%' },
  carrierIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  airlineBadge: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#EAF4FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  airlineLogo: { width: 46, height: 42 },
  airlineCode: { color: '#2878B9', fontSize: 12, fontWeight: '800' },
  airlineInfo: { flex: 1, minWidth: 0 },
  airlineName: { color: '#123B5D', fontSize: 14, fontWeight: '800' },
  flightNumber: { color: '#687F91', fontSize: 12, marginTop: 4 },
  eventPromotionLabel: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    overflow: 'hidden',
    color: '#8B5C10',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8EDF2',
    backgroundColor: '#FFFCF5',
  },
  flightPriceBlock: { flex: 1, minWidth: 0, alignItems: 'flex-end' },
  price: { color: '#F05A28', fontWeight: '800', fontSize: 20, textAlign: 'right' },
  specialPrice: { fontSize: 21 },
  originalPrice: {
    color: '#7D858B',
    fontSize: 11,
    textDecorationLine: 'line-through',
    textAlign: 'right',
    marginTop: 1,
  },
  specialFareLabel: {
    color: '#13845B',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: 2,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  routeRowWide: { flex: 1, minWidth: 0 },
  routePoint: { flex: 1, minWidth: 0 },
  routeEnd: { alignItems: 'flex-end' },
  time: { color: '#123B5D', fontSize: 20, fontWeight: '800' },
  airportCode: { color: '#526C80', fontSize: 14, fontWeight: '700', marginTop: 4 },
  city: { color: '#687F91', fontSize: 11, marginTop: 4 },
  routeMiddle: { flex: 1.2, minWidth: 0, alignItems: 'center', paddingHorizontal: 7 },
  durationLabel: { color: '#687F91', fontSize: 11, textAlign: 'center' },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 7,
  },
  routeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E8C27A' },
  routeDash: { flex: 1, height: 1, backgroundColor: '#98A2B3' },
  plane: { color: '#2878B9', fontSize: 15, marginHorizontal: 2 },
  flightAction: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E1EAF1',
    paddingTop: 12,
  },
  flightActionWide: {
    width: '34%',
    borderTopWidth: 0,
    paddingTop: 0,
  },
  selectButton: {
    minWidth: 112,
    height: 50,
    borderRadius: 999,
    backgroundColor: '#0D9BEF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  selectButtonSelected: {
    backgroundColor: '#EAF4FC',
    borderWidth: 1,
    borderColor: '#2878B9',
  },
  selectButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  selectButtonTextSelected: { color: '#2878B9' },
  baggage: {
    color: '#687F91',
    fontSize: 12,
    marginTop: 3,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  emptyIllustration: { width: 150, height: 100, marginBottom: 8 },
  emptyTitle: { color: '#123B5D', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: '#687F91', marginTop: 8, lineHeight: 21 },
  sourceText: { color: '#98A2B3', fontSize: 11, marginTop: 6 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(16, 24, 40, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  itineraryModal: {
    width: '100%',
    maxWidth: 960,
    maxHeight: '92%',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1EAF1',
  },
  promotionModal: { maxWidth: 540 },
  promotionEmpty: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 30 },
  promotionIcon: { color: '#C58D2B', fontSize: 32, marginBottom: 8 },
  promotionEmptyTitle: { color: '#123B5D', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  promotionEmptyText: { color: '#687F91', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  promotionList: { maxHeight: 420, paddingHorizontal: 18, paddingBottom: 18 },
  promotionOfferCard: { borderWidth: 1, borderColor: '#E8EDF2', borderRadius: 16, padding: 14, marginBottom: 10, backgroundColor: '#FFFCF5' },
  promotionOfferTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  promotionCodeBadge: { backgroundColor: '#F6E8C9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  promotionCodeText: { color: '#80540E', fontWeight: '900', letterSpacing: 0.6 },
  promotionDiscount: { color: '#13845B', fontSize: 17, fontWeight: '900' },
  promotionOfferTitle: { color: '#123B5D', fontSize: 15, fontWeight: '800', marginTop: 10 },
  promotionOfferText: { color: '#687F91', fontSize: 13, lineHeight: 19, marginTop: 5 },
  promotionOfferFootnote: { color: '#1F6FA8', fontSize: 12, fontWeight: '700', marginTop: 8 },
  itineraryModalWide: { width: '92%' },
  itineraryModalHeader: {
    minHeight: 62,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E1EAF1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itineraryModalHeaderCopy: { flex: 1, minWidth: 0 },
  itineraryModalTitle: { color: '#344054', fontSize: 18, fontWeight: '700' },
  itineraryModalSubtitle: { color: '#687F91', fontSize: 12, marginTop: 3 },
  itineraryCloseButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itineraryCloseText: { color: '#475467', fontSize: 28, lineHeight: 32 },
  itineraryScroll: { flexShrink: 1 },
  itineraryScrollContent: { padding: 18 },
  itineraryColumns: { gap: 18 },
  itineraryColumnsWide: { flexDirection: 'row' },
  itineraryLeg: { flex: 1, minWidth: 0 },
  itineraryLegHeader: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 18,
  },
  itineraryLegHeaderCopy: { flex: 1, minWidth: 0 },
  itineraryDirection: { color: '#344054', fontSize: 14, fontWeight: '800' },
  itineraryDate: { color: '#687F91', fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
  itineraryStops: { color: '#687F91', fontSize: 12, textAlign: 'right' },
  itineraryEvent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minHeight: 42,
  },
  itineraryTime: { width: 48, color: '#344054', fontSize: 14, fontWeight: '700' },
  itineraryMarkerColumn: { width: 12, alignItems: 'center' },
  itineraryMarker: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#344054',
    marginTop: 4,
  },
  itineraryMarkerArrival: { backgroundColor: '#111827' },
  itineraryAirport: { flex: 1, color: '#344054', fontSize: 13, lineHeight: 19 },
  itineraryFlightInfo: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    minHeight: 54,
  },
  itineraryDuration: { width: 48, color: '#98A2B3', fontSize: 10, paddingTop: 8 },
  itineraryConnector: { width: 1, flex: 1, minHeight: 48, backgroundColor: '#98A2B3' },
  itineraryFlightCopy: { flex: 1, paddingBottom: 14, gap: 5 },
  itineraryAirline: { color: '#526C80', fontSize: 12, fontWeight: '600', lineHeight: 18 },
  itineraryBaggage: { color: '#687F91', fontSize: 11 },
  itineraryConnectionNotice: {
    color: '#93370D',
    backgroundColor: '#FFFAEB',
    borderRadius: 8,
    padding: 8,
    fontSize: 11,
    lineHeight: 16,
  },
  itineraryReturnColumn: {
    borderTopWidth: 1,
    borderTopColor: '#E1EAF1',
    paddingTop: 18,
  },
  itineraryReturnColumnWide: {
    borderTopWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: '#E1EAF1',
    paddingTop: 0,
    paddingLeft: 18,
  },
  itineraryFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E1EAF1',
    padding: 14,
    gap: 10,
  },
  itineraryFooterWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  itineraryTripType: { color: '#344054', fontSize: 13, fontWeight: '700' },
  itineraryFooterAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  itineraryTotalBlock: { flex: 1, alignItems: 'flex-end' },
  itineraryTotalLabel: { color: '#687F91', fontSize: 11 },
  itineraryTotal: { color: '#F05A28', fontSize: 18, fontWeight: '800', marginTop: 2 },
  itineraryFooterHint: { color: '#98A2B3', fontSize: 10, textAlign: 'right', marginTop: 2 },
  itineraryContinueButton: {
    minWidth: 180,
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: '#0D9BEF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  itineraryContinueText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
