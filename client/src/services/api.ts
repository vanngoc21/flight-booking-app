
import type { Flight } from '../types/flight';
import { Platform } from 'react-native';
import { getSavedToken } from './authStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

/* =========================================================
   1. TYPES - AUTHENTICATION
========================================================= */

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
}

export interface PublicSettings {
  siteName: string;
  supportEmail: string;
  supportPhone: string;
  currency: 'VND' | 'USD';
  timezone: string;
  bookingEnabled: boolean;
  maintenanceMode: boolean;
  cancellationPolicy: string;
}

export interface Promotion {
  _id: string;
  code: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  campaignType?: 'coupon' | 'event';
  eventTitle?: string;
  eventTitleEn?: string;
  bannerImageUrl?: string;
  airlineCode?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount: number | null;
  minimumBaseFare: number;
  applicability: 'all' | 'domestic' | 'international';
  startsAt: string;
  endsAt: string;
  active: boolean;
  seeded?: boolean;
}

export type PromotionInput = Omit<Promotion, '_id' | 'seeded'>;

export interface AdminLoginResponse {
  token: string;
  user: { id: string; fullName: string; email: string; role: 'admin' };
}

/* =========================================================
   2. TYPES - FLIGHT SEARCH
========================================================= */

export interface FlightSearchParams {
  from: string;
  to: string;
  date: string;
  sort?: 'best' | 'cheapest' | 'fastest';
  stops?: 'any' | 'direct';
  maxPrice?: number;
  returnDate?: string;
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
  airlines?: string[];
}

export interface FlightSearchResponse {
  source: 'database' | 'cache';
  count: number;
  data: Flight[];
}

/* =========================================================
   3. TYPES - BOOKING & SEATS
========================================================= */

export interface FlightSeat {
  seatNumber: string;
  cabinClass:
    | 'economy'
    | 'premium_economy'
    | 'business'
    | 'first';
  extraPrice: number;
  status: 'available' | 'booked';
}

export interface FlightSeatInfo extends FlightSeat {
  held: boolean;
}

export interface FlightSeatsResponse {
  flightId: string;
  count: number;
  data: FlightSeatInfo[];
}

export interface HoldSeatsResponse {
  message: string;
  expiresInSeconds: number;
  seatNumbers: string[];
}

export interface BookingPricing {
  baseFare: number;
  discount?: number;
  seatFee: number;
  baggageFee: number;
  protectionFee: number;
  total: number;
  currency: string;
  outbound?: BookingLegPricing | null;
  return?: BookingLegPricing | null;
  legs?: BookingLegPricing[];
}

export interface BookingPromotion {
  code: string;
  title: string;
  titleEn?: string;
  discountAmount: number;
}

export interface BookingLegPricing {
  baseFare: number;
  seatFee: number;
  baggageFee: number;
  protectionFee: number;
  total: number;
}

export interface AirportSuggestion { code: string; city: string; airport: string; country?: string; }

export interface BookingContact {
  fullName: string;
  email: string;
  phone: string;
}

export interface PassengerInput {
  passengerType?: 'adult' | 'child' | 'infant';
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  documentType?: 'national_id' | 'passport' | 'other';
  documentNumber?: string;
  issuingCountry?: string;
  documentIssueDate?: string;
  documentExpiryDate?: string;
  travelDocumentType?:
    | 'none'
    | 'visa'
    | 'visa_exemption'
    | 'residence_permit'
    | 'transit_document'
    | 'other';
  travelDocumentNumber?: string;
  travelDocumentExpiryDate?: string;
}

export interface BookingPassengerInput extends PassengerInput {
  dateOfBirth: string;
  nationality: string;
  documentType: 'national_id' | 'passport' | 'other';
  documentNumber: string;
  travelDocumentType: NonNullable<PassengerInput['travelDocumentType']>;
}

export interface BookingLegInput {
  flightId: string;
  seats: string[];
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
  checkedBagCount: number;
}

export interface CreateBookingInput {
  flightId?: string;
  seats?: string[];
  returnFlightId?: string;
  returnSeats?: string[];
  legs?: BookingLegInput[];
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
  passengers: BookingPassengerInput[];
  bookingContact: BookingContact;
  checkedBagCount: number;
  returnCheckedBagCount?: number;
  protectionEnabled: boolean;
  promotionCode?: string;
}

export interface CreateBookingResponse {
  message: string;
  data: {
    id: string;
    bookingCode: string;
    bookingStatus:
      | 'pending'
      | 'confirmed'
      | 'cancelled'
      | 'expired';
    paymentStatus:
      | 'pending'
      | 'paid'
      | 'failed'
      | 'refunded';
    expiresAt: string;
    pricing: BookingPricing;
    promotion?: BookingPromotion;
    seats: string[];
    returnSeats?: string[];
    legs?: {
      flight: Flight | string;
      seats: string[];
      baggage?: { checkedBagCount: number; checkedBagPrice: number };
      pricing: BookingLegPricing;
    }[];
  };
}

/* =========================================================
   4. TYPES - PAYMENT
========================================================= */

export interface BookingPaymentInfo {
  id: string;
  bookingCode: string;
  bookingContact?: BookingContact;

  bookingStatus:
    | 'pending'
    | 'confirmed'
    | 'cancelled'
    | 'expired';

  paymentStatus:
    | 'pending'
    | 'paid'
    | 'failed'
    | 'refunded';

  expiresAt: string;
  paidAt?: string | null;
  paymentMethod?: 'bank_transfer' | 'card' | 'wallet' | 'vnpay';
  bankCode?: string;

  seats: string[];
  returnSeats?: string[];

  passengers: PassengerInput[];

  pricing: BookingPricing;
  promotion?: BookingPromotion;

  flight: Flight;
  returnFlight?: Flight | null;
  legs?: {
    flight: Flight | string;
    seats: string[];
    baggage?: { checkedBagCount: number; checkedBagPrice: number };
    pricing: BookingLegPricing;
  }[];
}

export interface PaymentResult {
  message: string;

  data: {
    bookingCode: string;

    bookingStatus:
      | 'pending'
      | 'confirmed'
      | 'cancelled'
      | 'expired';

    paymentStatus:
      | 'pending'
      | 'paid'
      | 'failed'
      | 'refunded';

    paidAt?: string;

    pricing?: BookingPricing;
  };
}

export interface VnpayPaymentResponse {
  message: string;
  data: {
    paymentUrl: string;
  };
}

/* =========================================================
   5. TYPES - BOOKING HISTORY
========================================================= */

export interface BookingHistoryItem {
  _id: string;
  bookingCode: string;
  bookingContact?: BookingContact;

  flight: {
    _id: string;
    flightNumber: string;

    airline: {
      name: string;
      code: string;
      logoUrl?: string;
    };

    origin: {
      code: string;
      city: string;
      airport?: string;
    };

    destination: {
      code: string;
      city: string;
      airport?: string;
    };

    departureAt: string;
    arrivalAt: string;
  } | null;

  returnFlight?: {
    _id: string;
    flightNumber: string;
    airline: {
      name: string;
      code: string;
      logoUrl?: string;
    };
    origin: {
      code: string;
      city: string;
      airport?: string;
    };
    destination: {
      code: string;
      city: string;
      airport?: string;
    };
    departureAt: string;
    arrivalAt: string;
  } | null;
  legs?: {
    flight: BookingHistoryItem['flight'] | string;
    seats: string[];
    baggage?: { checkedBagCount: number; checkedBagPrice: number };
    pricing?: BookingLegPricing;
  }[];

  passengers: PassengerInput[];

  seats: string[];
  returnSeats?: string[];

  pricing: BookingPricing;

  bookingStatus:
    | 'pending'
    | 'confirmed'
    | 'cancelled'
    | 'expired';

  paymentStatus:
    | 'pending'
    | 'paid'
    | 'failed'
    | 'refunded';

  expiresAt: string;
  createdAt: string;
}

export interface BookingHistoryResponse {
  count: number;
  data: BookingHistoryItem[];
}

/* =========================================================
   6. API CONFIGURATION
========================================================= */

function getApiBaseUrl(): string {
  const configuredUrl = API_URL?.trim();

  if (!configuredUrl) {
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      isLocalDevelopmentHost(window.location.hostname)
    ) {
      return `http://${window.location.hostname}:5000/api`;
    }

    throw new Error(
      'Chưa cấu hình EXPO_PUBLIC_API_URL trong file .env',
    );
  }

  // Hỗ trợ:
  // http://localhost:5000
  // http://localhost:5000/api

  const baseUrl = configuredUrl
    .replace(/\/+$/, '')
    .replace(/\/api$/i, '');

  const apiUrl = new URL(baseUrl);

  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    isLocalDevelopmentHost(window.location.hostname) &&
    isLocalDevelopmentHost(apiUrl.hostname)
  ) {
    apiUrl.hostname = window.location.hostname;
  }

  return `${apiUrl.origin}/api`;
}

function isLocalDevelopmentHost(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase();

  if (
    normalizedHostname === 'localhost' ||
    normalizedHostname === '127.0.0.1' ||
    normalizedHostname === '::1' ||
    normalizedHostname === '[::1]'
  ) {
    return true;
  }

  const octets = normalizedHostname.split('.').map(Number);

  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return false;
  }

  return (
    octets[0] === 10 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  );
}

function getFlightsApiUrl(): string {
  return `${getApiBaseUrl()}/flights`;
}

/* =========================================================
   7. COMMON REQUEST
========================================================= */

async function requestJson<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, options);
  } catch (error) {
    if (error instanceof TypeError) {
      const apiOrigin = new URL(url).origin;
      throw new Error(
        `Không thể kết nối máy chủ tại ${apiOrigin}. Hãy kiểm tra server đang chạy, điện thoại và máy tính cùng Wi-Fi, và EXPO_PUBLIC_API_URL trỏ tới IP LAN của máy tính.`,
      );
    }

    throw error;
  }

  let result: any;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      `Server trả về dữ liệu không hợp lệ (HTTP ${response.status})`,
    );
  }

  if (!response.ok) {
    throw new ApiRequestError(
      result?.message ??
        `Yêu cầu thất bại (HTTP ${response.status})`,
      response.status,
    );
  }

  return result as T;
}

export class ApiRequestError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

/**
 * Request dành cho API cần đăng nhập.
 * Tự động lấy JWT từ authStorage.
 */
async function authenticatedRequestJson<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getSavedToken();

  if (!token) {
    throw new Error(
      'Bạn cần đăng nhập để tiếp tục.',
    );
  }

  const headers = new Headers(options.headers);

  headers.set('Authorization', `Bearer ${token}`);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return requestJson<T>(url, {
    ...options,
    headers,
  });
}

/**
 * Kiểm tra token truyền vào.
 */
function authHeaders(token: string): Headers {
  if (!token?.trim()) {
    throw new Error(
      'Bạn cần đăng nhập để tiếp tục.',
    );
  }

  const headers = new Headers();

  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  return headers;
}

export function getPublicPromotions(): Promise<{ success: boolean; data: Promotion[] }> {
  return requestJson(`${getApiBaseUrl()}/promotions`);
}

export function adminLogin(input: { email: string; password: string }): Promise<AdminLoginResponse> {
  return requestJson(`${getApiBaseUrl()}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

function adminRequest<T>(path: string, token: string, options: RequestInit = {}) {
  return requestJson<T>(`${getApiBaseUrl()}/admin${path}`, {
    ...options,
    headers: authHeaders(token),
  });
}

export function getAdminPromotions(token: string) {
  return adminRequest<{ success: boolean; data: Promotion[] }>('/promotions', token);
}

export function createAdminPromotion(token: string, input: PromotionInput) {
  return adminRequest<{ success: boolean; data: Promotion }>('/promotions', token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAdminPromotion(token: string, id: string, input: PromotionInput) {
  return adminRequest<{ success: boolean; data: Promotion }>(
    `/promotions/${encodeURIComponent(id)}`,
    token,
    { method: 'PUT', body: JSON.stringify(input) },
  );
}

export function deleteAdminPromotion(token: string, id: string) {
  return adminRequest<{ success: boolean; message: string }>(
    `/promotions/${encodeURIComponent(id)}`,
    token,
    { method: 'DELETE' },
  );
}

/* =========================================================
   8. AUTH API
========================================================= */

/**
 * Đăng nhập.
 */
export function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return requestJson<AuthResponse>(
    `${getApiBaseUrl()}/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );
}

/**
 * Đăng ký.
 */
export function registerUser(input: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<AuthResponse> {
  return requestJson<AuthResponse>(
    `${getApiBaseUrl()}/auth/register`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );
}

export function getPublicSettings(): Promise<{
  success: boolean;
  data: PublicSettings;
}> {
  return requestJson<{ success: boolean; data: PublicSettings }>(
    `${getApiBaseUrl()}/public/settings`,
  );
}

/* =========================================================
   9. FLIGHT API
========================================================= */

/**
 * Tìm kiếm chuyến bay.
 */
export async function searchFlights(
  params: FlightSearchParams,
): Promise<FlightSearchResponse> {
  const query = new URLSearchParams({
    from: params.from.trim().toUpperCase(),
    to: params.to.trim().toUpperCase(),
    date: params.date,
    sort: params.sort ?? 'best',
    stops: params.stops ?? 'any',
    cabinClass: params.cabinClass ?? 'economy',
  });

  if (params.maxPrice !== undefined) {
    query.set(
      'maxPrice',
      String(params.maxPrice),
    );
  }

  if (params.airlines?.length) {
    query.set('airlines', params.airlines.join(','));
  }

  const url =
    `${getFlightsApiUrl()}/search?${query.toString()}`;

  return requestJson<FlightSearchResponse>(url);
}

/** Gợi ý sân bay theo mã, thành phố hoặc tên sân bay. */
export async function searchAirports(q: string): Promise<AirportSuggestion[]> {
  if (!q.trim()) return [];
  const result = await requestJson<{ data: AirportSuggestion[] }>(
    `${getFlightsApiUrl()}/airports/search?q=${encodeURIComponent(q.trim())}`
  );
  return result.data;
}

/**
 * Lấy chi tiết chuyến bay.
 */
export async function getFlightById(
  id: string,
): Promise<Flight> {
  if (!id) {
    throw new Error('Thiếu mã chuyến bay.');
  }

  const url =
    `${getFlightsApiUrl()}/${encodeURIComponent(id)}`;

  const result = await requestJson<{
    data: Flight;
  }>(url);

  return result.data;
}

/**
 * Lấy danh sách ghế của chuyến bay.
 */
export function getFlightSeats(
  flightId: string,
): Promise<FlightSeatsResponse> {
  if (!flightId) {
    throw new Error('Thiếu mã chuyến bay.');
  }

  return requestJson<FlightSeatsResponse>(
    `${getFlightsApiUrl()}/${encodeURIComponent(flightId)}/seats`,
  );
}

/* =========================================================
   10. SEAT HOLD API
========================================================= */

/**
 * Giữ ghế trong 10 phút.
 */
export function holdSeats(
  flightId: string,
  seatNumbers: string[],
  token: string,
): Promise<HoldSeatsResponse> {
  if (!flightId) {
    throw new Error('Thiếu mã chuyến bay.');
  }

  if (!seatNumbers.length) {
    throw new Error('Bạn chưa chọn ghế.');
  }

  return requestJson<HoldSeatsResponse>(
    `${getFlightsApiUrl()}/${encodeURIComponent(flightId)}/hold-seats`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        seatNumbers,
      }),
    },
  );
}

/**
 * Nhả những ghế đang được người dùng giữ.
 */
export function releaseSeats(
  flightId: string,
  seatNumbers: string[],
  token: string,
): Promise<{ message: string }> {
  if (!flightId) {
    throw new Error('Thiếu mã chuyến bay.');
  }

  return requestJson<{ message: string }>(
    `${getFlightsApiUrl()}/${encodeURIComponent(flightId)}/hold-seats`,
    {
      method: 'DELETE',
      headers: authHeaders(token),
      body: JSON.stringify({
        seatNumbers,
      }),
    },
  );
}

/* =========================================================
   11. CREATE BOOKING API
========================================================= */

/**
 * Tạo booking sau khi chọn ghế và nhập thông tin hành khách.
 */
export function createBooking(
  input: CreateBookingInput,
): Promise<CreateBookingResponse> {
  return authenticatedRequestJson<CreateBookingResponse>(
    `${getApiBaseUrl()}/bookings`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

/* =========================================================
   12. PAYMENT API
========================================================= */

/**
 * Lấy thông tin booking để hiển thị màn hình thanh toán.
 */
export async function getBookingPaymentInfo(
  bookingId: string,
): Promise<BookingPaymentInfo> {
  if (!bookingId) {
    throw new Error('Thiếu mã booking.');
  }

  const result =
    await authenticatedRequestJson<{
      data: BookingPaymentInfo;
    }>(
      `${getApiBaseUrl()}/payments/${encodeURIComponent(bookingId)}`,
    );

  return result.data;
}

/** Tạo URL thanh toán VNPay Sandbox cho booking hiện tại. */
export function createVnpayPayment(
  bookingId: string,
  clientReturnUrl: string,
): Promise<VnpayPaymentResponse> {
  if (!bookingId) {
    throw new Error('Thiếu mã booking.');
  }

  return authenticatedRequestJson<VnpayPaymentResponse>(
    `${getApiBaseUrl()}/payments/vnpay/${encodeURIComponent(bookingId)}`,
    {
      method: 'POST',
      body: JSON.stringify({ clientReturnUrl }),
    },
  );
}

/**
 * Thanh toán mô phỏng Demo.
 *
 * outcome:
 * - success: Thanh toán thành công.
 * - failure: Thanh toán thất bại.
 */
export function payDemo(
  bookingId: string,
  outcome: 'success' | 'failure',
  paymentMethod: 'bank_transfer' | 'card' | 'wallet' = 'bank_transfer',
  bankCode = 'VCB',
): Promise<PaymentResult> {
  if (!bookingId) {
    throw new Error('Thiếu mã booking.');
  }

  return authenticatedRequestJson<PaymentResult>(
    `${getApiBaseUrl()}/payments/demo/${encodeURIComponent(bookingId)}`,
    {
      method: 'POST',
      body: JSON.stringify({ outcome, paymentMethod, bankCode }),
    },
  );
}

/* =========================================================
   13. BOOKING HISTORY API
========================================================= */

/**
 * Lấy lịch sử đặt vé của người dùng hiện tại.
 */
export function getMyBookings(
  token: string,
): Promise<BookingHistoryResponse> {
  if (!token) {
    throw new Error('Bạn chưa đăng nhập.');
  }

  return requestJson<BookingHistoryResponse>(
    `${getApiBaseUrl()}/bookings/my`,
    {
      method: 'GET',
      headers: authHeaders(token),
    },
  );
}

// =========================================================

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIChatResponse {
  success: boolean;
  reply: string;
}

export async function sendAIMessage(
  message: string,
  history: AIChatMessage[] = [],
  language: 'vi' | 'en' = 'vi',
): Promise<AIChatResponse> {
  const result = await authenticatedRequestJson<AIChatResponse>(
    `${getApiBaseUrl()}/ai/chat`,
    {
      method: 'POST',
      body: JSON.stringify({
        message: message.trim(),
        history,
        language,
      }),
    },
  );

  if (!result?.success || typeof result.reply !== 'string') {
    throw new Error('Phản hồi từ SKYHAVEN AI không hợp lệ.');
  }

  return result;
}
