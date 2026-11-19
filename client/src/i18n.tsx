import React, { cloneElement, isValidElement, type ReactNode } from 'react';
import {
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextProps,
  type TextInputProps,
} from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import type { AppLanguage } from './store/preferencesSlice';

const english: Record<string, string> = {
  'Flight Booking': 'Flight Booking',
  'Chào mừng trở lại!': 'Welcome back!',
  'Đăng nhập để tiếp tục hành trình của bạn.': 'Sign in to continue your journey.',
  'Email *': 'Email *',
  'Mật khẩu *': 'Password *',
  'Nhập mật khẩu': 'Enter your password',
  'Thiếu thông tin': 'Missing information',
  'Vui lòng nhập email và mật khẩu.': 'Please enter your email and password.',
  'Email không hợp lệ': 'Invalid email',
  'Vui lòng nhập đúng định dạng email.': 'Please enter a valid email address.',
  'Đăng nhập thất bại': 'Sign-in failed',
  'Đăng nhập': 'Sign in',
  'Chưa có tài khoản?': "Don't have an account?",
  'Đăng ký ngay': 'Create an account',
  '← Về trang chủ': '← Back to home',
  'Tạo tài khoản': 'Create an account',
  'Đăng ký để bắt đầu hành trình của bạn.': 'Register to start your journey.',
  'Họ và tên *': 'Full name *',
  'Số điện thoại': 'Phone number',
  'Nhập số điện thoại': 'Enter your phone number',
  'Tạo mật khẩu (ít nhất 8 ký tự)': 'Create a password (at least 8 characters)',
  'Mật khẩu không hợp lệ': 'Invalid password',
  'Mật khẩu cần ít nhất 8 ký tự.': 'Password must be at least 8 characters.',
  'Đăng ký thành công': 'Registration successful',
  'Tài khoản đã được tạo. Vui lòng đăng nhập.': 'Your account is ready. Please sign in.',
  'Đăng ký thất bại': 'Registration failed',
  'Không thể kết nối máy chủ. Vui lòng thử lại.': 'Could not connect to the server. Please try again.',
  'Về trang chủ': 'Back to home',
  'Tìm chuyến bay': 'Search flights',
  'Tìm chuyến bay từ dữ liệu MongoDB của hệ thống': 'Search flights from the system database',
  'Điểm đi (mã sân bay)': 'From (airport code)',
  'Điểm đến (mã sân bay)': 'To (airport code)',
  'Điểm đi': 'From',
  'Điểm đến': 'To',
  'Loại hành trình': 'Trip type',
  'Một chiều': 'One way',
  'Khứ hồi': 'Round trip',
  'Nhiều chặng': 'Multi-city',
  'Hành khách (tối đa 9)': 'Passengers (up to 9)',
  'Người lớn · từ 12 tuổi': 'Adults · 12+ years',
  'Trẻ em · 2–11 tuổi': 'Children · 2–11 years',
  'Trẻ sơ sinh · dưới 2 tuổi': 'Infants · under 2 years',
  'Trẻ sơ sinh không chiếm ghế riêng; giá demo bằng 10% giá vé người lớn và cần đi cùng người lớn.': 'Infants do not occupy a separate seat; the demo fare is 10% of the adult fare and they must travel with an adult.',
  'Hạng ghế': 'Cabin class',
  'Phổ thông': 'Economy',
  'Phổ thông cao cấp': 'Premium economy',
  'Thương gia': 'Business',
  'Hạng nhất': 'First class',
  'Ngày đi (YYYY-MM-DD)': 'Departure date (YYYY-MM-DD)',
  'Ngày về (YYYY-MM-DD)': 'Return date (YYYY-MM-DD)',
  'Ngày bay (YYYY-MM-DD)': 'Flight date (YYYY-MM-DD)',
  'Giá tối đa (không bắt buộc)': 'Maximum price (optional)',
  'Sắp xếp': 'Sort by',
  'Phù hợp': 'Recommended',
  'Giá thấp': 'Lowest price',
  'Bay nhanh': 'Shortest duration',
  'Hãng bay (mã, cách nhau bằng dấu phẩy)': 'Airlines (codes separated by commas)',
  'Chỉ chuyến bay thẳng': 'Direct flights only',
  'Đang tìm chuyến bay...': 'Searching for flights...',
  'Đang tìm chuyến bay cho từng chặng...': 'Searching flights for each leg...',
  'Không thể tìm chuyến bay': 'Could not find flights',
  'Thử lại': 'Try again',
  'Chọn chuyến bay từng chặng': 'Choose flights for each leg',
  'Không tìm thấy chuyến bay': 'No flights found',
  'Không có chuyến phù hợp với chặng này. Hãy thử ngày khác hoặc bỏ bớt bộ lọc.': 'No flights match this leg. Try another date or remove some filters.',
  'Tiếp tục chọn ghế': 'Continue to seat selection',
  'Kết quả tìm kiếm': 'Search results',
  'Chuyến bay chiều về': 'Return flights',
  'Tìm lại chuyến về': 'Search for return flights again',
  'Không tìm thấy chuyến bay chiều về cho ngày đã chọn.': 'No return flights were found for the selected date.',
  'Tiếp tục chọn ghế chiều đi và chiều về': 'Continue to seat selection for both flights',
  'Mã hoặc tên sân bay / thành phố': 'Airport or city code/name',
  'Mã sân bay': 'Airport code',
  'Ví dụ: 3000000': 'e.g. 3000000',
  'Ví dụ: VN,VJ': 'e.g. VN,VJ',
  'Xóa': 'Remove',
  'Tối đa 4 chặng': 'Up to 4 legs',
  '+ Thêm chặng': '+ Add a leg',
  'Giá cơ bản / khách': 'Base fare / person',
  'Giá có thể đổi theo ghế và dịch vụ bổ sung.': 'Prices may change with seat and add-on selections.',
  'Tiếp tục': 'Continue',
  'Bay thẳng': 'Nonstop',
  'Hành lý:': 'Baggage:',
  ' điểm dừng': ' stop(s)',
  'Đang tải thông tin chuyến bay...': 'Loading flight details...',
  'Thiếu mã chuyến bay': 'Missing flight ID',
  'Vui lòng quay lại danh sách và chọn một chuyến bay.': 'Return to the list and choose a flight.',
  'Không tải được chi tiết chuyến bay': 'Could not load flight details',
  'Có lỗi xảy ra khi kết nối máy chủ.': 'A server connection error occurred.',
  'Chi tiết chuyến bay': 'Flight details',
  'Sẵn sàng cất cánh?': 'Ready for takeoff?',
  'Hành trình của bạn bắt đầu từ đây.': 'Your journey starts here.',
  'CHI TIẾT CHUYẾN BAY': 'FLIGHT DETAILS',
  'Giá vé cơ bản': 'Base fare',
  'Lịch trình bay': 'Flight itinerary',
  'Khởi hành': 'Departure',
  'Đến nơi': 'Arrival',
  'Thông tin vé': 'Ticket information',
  'Mã chuyến bay': 'Flight number',
  'Hãng hàng không': 'Airline',
  'Hành lý': 'Baggage',
  'Số điểm dừng': 'Stops',
  'Trạng thái': 'Status',
  'Đang mở bán': 'Available',
  'Đã hủy': 'Cancelled',
  'Đã hoàn thành': 'Completed',
  'Tiện ích': 'Amenities',
  'Chưa có thông tin tiện ích.': 'No amenities information available.',
  'Giá hiển thị là giá cơ bản trong hệ thống. Tổng giá đặt vé có thể thay đổi theo lựa chọn ghế và dịch vụ bổ sung.': 'The displayed price is the base fare. The total may change based on seat and add-on selections.',
  'Tiếp tục đặt vé': 'Continue booking',
  'Ưu đãi': 'Deals',
  'Hãng bay': 'Airlines',
  'Đặt vé, nhẹ đầu': 'Book with ease',
  'CHUYẾN ĐI TIẾP THEO': 'YOUR NEXT JOURNEY',
  'Bay đúng chuyến.': 'The right flight.',
  'Về đúng nhà.': 'A smooth way home.',
  'Chọn vé rõ giá, rõ giờ, rõ hãng — trên điện thoại khi đang di chuyển, hoặc trên web khi ngồi đặt cho cả nhà.': 'Compare clear fares, times, and airlines—on the go or at home.',
  'Xem điểm đến': 'Explore destinations',
  'Chuyến bay': 'Flights',
  'Khách sạn': 'Hotels',
  'Ẩm thực': 'Dining',
  'Tour': 'Tours',
  'ĐIỂM ĐI': 'FROM',
  'ĐIỂM ĐẾN': 'TO',
  'NGÀY BAY': 'TRAVEL DATE',
  'Đổi được ở bước sau': 'Changeable in the next step',
  'HÀNH KHÁCH': 'PASSENGERS',
  '1 người lớn': '1 adult',
  'Tìm chuyến': 'Search',
  'CHẶNG HAY ĐƯỢC CHỌN': 'POPULAR ROUTES',
  'Đi chơi, không cần lên kế hoạch dài': 'Get away without a lengthy plan',
  'Một tấm ảnh, một lý do để đi': 'A city to inspire your next trip',
  'Chạm vào thành phố bạn đang nghĩ tới. Chúng tôi mở sẵn tìm kiếm từ sân bay gần bạn.': 'Choose a city and start a search from the nearest airport.',
  'Tìm vé khác →': 'Find another flight →',
  'MÙA NÀY': 'THIS SEASON',
  'Xem vé Sài Gòn – Đà Nẵng  →': 'Explore Ho Chi Minh City – Da Nang flights →',
  'ĐI XA HƠN': 'GO FURTHER',
  'Tìm vé đi Nhật  →': 'Find flights to Japan →',
  'CÁCH ĐẶT': 'HOW TO BOOK',
  'Ba bước, rồi để vé lo phần còn lại': 'Three steps, then let your ticket take care of the rest',
  'KHÁCH ĐÃ BAY': 'TRAVELERS',
  'Người ta quay lại vì cảm giác nhẹ': 'Travelers come back for a simpler experience',
  'ĐỐI TÁC': 'PARTNERS',
  'Hãng bạn đã biết tên': 'Airlines you know',
  'Cùng lịch bay, cùng một cách đặt.': 'One schedule, one simple way to book.',
  'Vé đã đặt': 'My bookings',
  'Mở lại hành trình, ghế và trạng thái thanh toán bất cứ lúc nào.': 'Review your itinerary, seats, and payment status anytime.',
  'Cần người thật trả lời?': 'Need help from a person?',
  'SẴN SÀNG KHI BẠN SẴN SÀNG': 'WHENEVER YOU ARE READY',
  'Chuyến tiếp theo có thể bắt đầu từ tối nay.': 'Your next trip can start tonight.',
  'Bắt đầu tìm vé': 'Start searching',
  'Lịch sử đặt vé': 'Booking history',
  'Đang tải lịch sử đặt vé...': 'Loading booking history...',
  'Chưa có dữ liệu đặt vé': 'No bookings yet',
  'Chi tiết': 'Details',
  'Vé điện tử / QR': 'E-ticket / QR',
  'Theo dõi bay': 'Flight tracking',
  'Thông báo': 'Notifications',
  '← Quay lại hồ sơ': '← Back to profile',
  'Đang tải booking…': 'Loading booking…',
  'MÃ ĐẶT CHỖ CHUNG': 'BOOKING REFERENCE',
  'Tổng cộng': 'Total',
  'Tổng đã thanh toán': 'Total paid',
  'Thông tin': 'Information',
  'Đang tải thông tin thanh toán...': 'Loading payment information...',
  'Về lịch sử đặt vé': 'Back to booking history',
  'THANH TOÁN AN TOÀN': 'SECURE PAYMENT',
  'Hoàn tất hành trình': 'Complete your journey',
  'MÃ ĐẶT VÉ': 'BOOKING CODE',
  'Vé chiều đi': 'Outbound flight',
  'Vé chiều về': 'Return flight',
  'Ghế chiều đi': 'Outbound seat',
  'Ghế chiều về': 'Return seat',
  'Chi tiết thanh toán': 'Payment details',
  'Phụ phí ghế': 'Seat fee',
  'Hành lý ký gửi': 'Checked baggage',
  'Bảo hiểm': 'Insurance',
  'Tổng thanh toán': 'Total payment',
  'Trạng thái booking': 'Booking status',
  'Thời gian còn lại': 'Time remaining',
  'Booking đã bị hủy.': 'Booking was cancelled.',
  'Thanh toán VNPay Sandbox': 'VNPay Sandbox payment',
  'Đang tải thông tin...': 'Loading information...',
  'Quay lại': 'Go back',
  'Hành trình quốc tế': 'International itinerary',
  'Chính sách hủy vé': 'Cancellation policy',
  'Ghế đã chọn': 'Selected seats',
  'Thông tin người đặt vé / liên hệ': 'Booking contact information',
  'Họ và tên người đặt vé *': 'Booker full name *',
  'Email nhận vé điện tử *': 'E-ticket email *',
  'Số điện thoại liên hệ *': 'Contact phone number *',
  'Loại hành khách *': 'Passenger type *',
  'Trẻ sơ sinh · giá demo bằng 10% giá vé người lớn, không chiếm ghế.': 'Infants · demo fare is 10% of the adult fare and no separate seat is used.',
  'Vé trẻ em được tính 75% giá vé cơ bản (chưa gồm phụ phí).': 'Child fares are 75% of the base fare (excluding fees).',
  'Họ và tên đệm *': 'Surname and middle name *',
  'Tên *': 'Given name *',
  'Giới tính *': 'Gender *',
  'Ngày sinh * · YYYY-MM-DD': 'Date of birth * · YYYY-MM-DD',
  'Quốc tịch *': 'Nationality *',
  'Loại giấy tờ *': 'Document type *',
  'Quốc gia cấp hộ chiếu *': 'Passport issuing country *',
  'Ngày cấp · YYYY-MM-DD': 'Issue date · YYYY-MM-DD',
  'Ngày hết hạn hộ chiếu * · YYYY-MM-DD': 'Passport expiry date * · YYYY-MM-DD',
  'Số giấy tờ nhập cảnh *': 'Entry document number *',
  'Ngày hết hạn *': 'Expiry date *',
  'Dịch vụ bổ sung': 'Add-on services',
  'Bảo hiểm chuyến đi': 'Travel insurance',
  'Hồ sơ khách hàng': 'Customer profile',
  'Vui lòng đăng nhập để xem hồ sơ.': 'Please sign in to view your profile.',
  'Họ và tên': 'Full name',
  'Email tài khoản': 'Account email',
  'Hỗ trợ khách hàng': 'Customer support',
  'Đăng xuất': 'Sign out',
  'Chưa có chuyến bay để theo dõi': 'No flights to track',
  'Mở lịch sử đặt vé': 'Open booking history',
  'Đang tải sơ đồ ghế...': 'Loading seat map...',
  '✈ ĐẦU MÁY BAY': '✈ FRONT OF AIRCRAFT',
  'Số ghế đã chọn': 'Selected seats',
  'Chưa chọn ghế': 'No seats selected',
  'Đang xác minh thanh toán từ máy chủ…': 'Verifying payment with the server…',
  'Vé đã được lưu để xem offline.': 'Ticket saved for offline viewing.',
  'Không mở được vé': 'Could not open ticket',
  'Thông tin vé offline': 'Offline ticket information',
  'Quay lại lịch sử đặt vé': 'Back to booking history',
  'Theo dõi chuyến bay': 'Flight tracking',
  'Chưa có thông báo nào.': 'No notifications yet.',
  'Minh họa chưa có chuyến bay': 'No flights illustration',
  'Minh họa chưa có vé máy bay': 'No tickets illustration',
  'Tháng trước': 'Previous month',
  'Tháng sau': 'Next month',
  'Đóng chi tiết hành trình': 'Close itinerary details',
  'Đóng': 'Close',
  'Chiều đi': 'Outbound',
  'Chiều về': 'Return',
  'Có ': 'There are ',
  ' điểm dừng. Chưa có dữ liệu chi tiết sân bay trung chuyển.': ' stop(s). Stopover airport details are unavailable.',
  'Giá theo từng chặng': 'Price shown per leg',
  'Khuyến mãi': 'Promotions',
  'Chọn chuyến đi, chuyến về, sau đó chọn ghế riêng cho từng chặng.': 'Choose your outbound and return flights, then select seats for each leg.',
  'Đổi': 'Change',
  'Chọn': 'Select',
  'Đã chọn ✓': 'Selected ✓',
  'Đang tải hồ sơ...': 'Loading profile...',
  'Bạn chưa có thông báo nào.': 'You have no notifications yet.',
  'Đã xảy ra lỗi kết nối đến máy chủ.': 'A server connection error occurred.',
  'Không có chuyến bay phù hợp với ngày và điều kiện bạn chọn. Hãy thử ngày khác hoặc bỏ lọc chuyến bay thẳng.': 'No flights match your selected date and filters. Try another date or remove the nonstop filter.',
  '‹ Quay lại tìm kiếm': '‹ Back to search',
  '‹ Quay lại chọn ghế': '‹ Back to seat selection',
  '‹ Quay lại chọn ghế chiều đi': '‹ Back to outbound seat selection',
  'Vui lòng thử lại sau.': 'Please try again later.',
  'Hãy thử ngày khác hoặc bỏ lọc chuyến bay thẳng.': 'Try another date or remove the nonstop filter.',
  'Nguyễn Văn A': 'e.g. Alex Morgan',
  'Nguyễn Văn An': 'e.g. Alex Morgan',
  'Nguyễn Văn': 'e.g. Alex',
  'Việt Nam': 'Vietnam',
  'Nhập số visa hoặc giấy tờ': 'Enter visa or document number',
  'Đóng khuyến mãi': 'Close promotions',
  'Xem khuyến mãi': 'View promotions',
  'Khuyến mãi chuyến bay': 'Flight promotions',
  'Chưa có ưu đãi được cấu hình': 'No offers configured yet',
  'Giá vé đang hiển thị là giá cơ bản từ hệ thống. Chúng tôi sẽ cập nhật tại đây khi có chương trình khuyến mãi chính thức.': 'Displayed fares are the system base prices. Official promotions will appear here once configured.',
  'Quản lý khuyến mãi': 'Promotion management',
  'Mã khuyến mãi': 'Promo code',
  'Nhập mã ưu đãi. Mã sẽ được kiểm tra trên máy chủ và giảm vào giá vé cơ bản.': 'Enter a promo code. It will be validated by the server and applied to the base fare.',
  'Khuyến mãi ·': 'Promotion ·',
  'Mở trang quản lý khuyến mãi': 'Open promotion management',
  'Trợ lý đặt vé máy bay thông minh': 'Smart flight booking assistant',
  'Thu nhỏ cửa sổ chat': 'Minimize chat window',
  'Đóng cửa sổ chat': 'Close chat window',
  'Đăng nhập lại': 'Sign in again',
  'SKYHAVEN AI đang trả lời...': 'SKYHAVEN AI is replying...',
  'Bạn có thể hỏi tôi:': 'You can ask me:',
  'Tìm chuyến bay từ SGN đến HAN': 'Find flights from SGN to HAN',
  'Tìm chuyến bay giá tốt vào ngày mai': 'Find low-fare flights for tomorrow',
  'Tôi cần chuẩn bị gì trước khi đặt vé?': 'What should I prepare before booking?',
  'Nhập câu hỏi của bạn...': 'Enter your question...',
  'Gửi tin nhắn': 'Send message',
  'AI có thể mắc lỗi. Vui lòng kiểm tra thông tin chuyến bay trước khi đặt vé.': 'AI can make mistakes. Please verify flight details before booking.',
  'Xin chào! Tôi là SKYHAVEN AI ✈️\n\nTôi có thể giúp tìm chuyến bay, so sánh lựa chọn và hướng dẫn các bước đặt vé. Hãy cho tôi biết điểm đi, điểm đến và ngày bay để bắt đầu nhé.\n\nĐể bảo vệ thông tin cá nhân, vui lòng không gửi số CCCD, hộ chiếu, visa, mật khẩu hoặc thông tin thanh toán trong khung chat.': 'Hello! I am SKYHAVEN AI ✈️\n\nI can help you find flights, compare options, and guide you through booking. Tell me your origin, destination, and travel date to get started.\n\nTo protect your personal information, do not share ID, passport, visa, password, or payment details in chat.',
  'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại để tiếp tục trò chuyện.': 'Your session has expired or is invalid. Please sign in again to continue chatting.',
  'Xin lỗi, hiện tại SKYHAVEN AI chưa thể xử lý yêu cầu. Vui lòng kiểm tra kết nối và thử lại sau.': 'Sorry, SKYHAVEN AI cannot process this request right now. Check your connection and try again later.',
};

export function translateText(value: string, language: AppLanguage) {
  if (language === 'vi') return value;

  const normalized = value.replace(/\s+/g, ' ').trim();
  const prefix = value.match(/^\s*/)?.[0] ?? '';
  const suffix = value.match(/\s*$/)?.[0] ?? '';
  let translated = english[normalized];

  if (!translated) {
    const stopMatch = normalized.match(/^(\d+) điểm dừng$/);
    const baggageMatch = normalized.match(/^Hành lý:\s*(.+)$/);
    const legMatch = normalized.match(/^Chặng (\d+)$/);
    const airportCountMatch = normalized.match(/^Tìm thấy (\d+) chuyến bay$/);
    const multiCityCountMatch = normalized.match(/^Chặng (\d+) · tìm thấy (\d+) chuyến$/);
    const selectedLegMatch = normalized.match(/^Chặng (\d+): (.+) · Đổi$/);
    const multiCityInstructionMatch = normalized.match(/^Chọn đủ (\d+) chuyến theo đúng thứ tự hành trình\.$/);
    const promotionPriceMatch = normalized.match(/^Khuyến mãi · (.+)$/);

    if (stopMatch) translated = `${stopMatch[1]} stop(s)`;
    else if (baggageMatch) translated = `Baggage: ${baggageMatch[1]}`;
    else if (legMatch) translated = `Leg ${legMatch[1]}`;
    else if (airportCountMatch) translated = `${airportCountMatch[1]} flights found`;
    else if (multiCityCountMatch) translated = `Leg ${multiCityCountMatch[1]} · ${multiCityCountMatch[2]} flights found`;
    else if (selectedLegMatch) translated = `Leg ${selectedLegMatch[1]}: ${selectedLegMatch[2]} · Change`;
    else if (multiCityInstructionMatch) translated = `Choose all ${multiCityInstructionMatch[1]} flights in itinerary order.`;
    else if (promotionPriceMatch) translated = `Promotion · ${promotionPriceMatch[1]}`;
  }

  return translated ? `${prefix}${translated}${suffix}` : value;
}

function localizeNode(node: ReactNode, language: AppLanguage): ReactNode {
  if (typeof node === 'string') return translateText(node, language);
  if (Array.isArray(node)) return node.map((item) => localizeNode(item, language));
  if (!isValidElement<{ children?: ReactNode }>(node)) return node;

  return cloneElement(node, undefined, localizeNode(node.props.children, language));
}

export function useAppLanguage() {
  return useSelector((state: RootState) => state.preferences.language);
}

export function AppText(props: TextProps) {
  const language = useAppLanguage();
  return <NativeText {...props}>{localizeNode(props.children, language)}</NativeText>;
}

export function AppTextInput(props: TextInputProps) {
  const language = useAppLanguage();
  return (
    <NativeTextInput
      {...props}
      placeholder={props.placeholder
        ? translateText(props.placeholder, language)
        : props.placeholder}
      accessibilityLabel={props.accessibilityLabel
        ? translateText(props.accessibilityLabel, language)
        : props.accessibilityLabel}
    />
  );
}
