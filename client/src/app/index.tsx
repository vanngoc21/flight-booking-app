import React, { useRef, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type ScrollViewInstance,
} from 'react-native';
import { ImageBackground } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookingSettingsNotice } from '../components/booking-settings-notice';
import { usePublicSettings } from '../hooks/use-public-settings';
import { getPublicPromotions, type Promotion } from '../services/api';
import { AppText as Text, useAppLanguage } from '../i18n';

type IconName =
  | 'plane'
  | 'hotel'
  | 'restaurant'
  | 'tour'
  | 'takeoff'
  | 'landing'
  | 'calendar'
  | 'passengers'
  | 'search'
  | 'chevron'
  | 'shield'
  | 'clock'
  | 'spark'
  | 'heart';

const iconPaths: Record<IconName, string[]> = {
  plane: ['M2 16.5 10.4 14l3.9 5.1 2-.5-2.1-5.8 5-1.3a2 2 0 0 0-.9-3.9l-5.2.7-5-5.1-2 .4 2.4 5.5-7.9 3.1a2.1 2.1 0 0 0 1.4 4.3Z'],
  hotel: ['M3 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16', 'M17 9h3a1 1 0 0 1 1 1v11', 'M7 7h2', 'M12 7h1', 'M7 11h2', 'M12 11h1', 'M7 15h2', 'M12 15h1', 'M2 21h20'],
  restaurant: ['M3 2v7a4 4 0 0 0 8 0V2', 'M7 2v20', 'M19 2v20', 'M19 2a5 5 0 0 0-5 5v4h5'],
  tour: ['M3 6.5 9 3l6 3.5L21 3v14.5L15 21l-6-3.5L3 21z', 'M9 3v14.5', 'M15 6.5V21'],
  takeoff: ['M3 20h18', 'm4 16 16-4.5a1.8 1.8 0 0 0-1-3.5l-5 1-4-5-2 .5 2 5.5-4 1-2-2-1.5.5 1.5 3.5Z'],
  landing: ['M3 20h18', 'm4 7 15 7a1.8 1.8 0 0 1-1.5 3.3l-5-1.4-4.8 3.1-1.8-.8 2.6-4.4-4-1.2-2.1 1.2-1.4-.8 2.3-3.2Z'],
  calendar: ['M7 2v4', 'M17 2v4', 'M3 9h18', 'M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z', 'M7 13h.01', 'M12 13h.01', 'M17 13h.01', 'M7 17h.01', 'M12 17h.01'],
  passengers: ['M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M20 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  search: ['m21 21-4.3-4.3', 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z'],
  chevron: ['m7 10 5 5 5-5'],
  shield: ['M12 3 5 6v6c0 4.2 2.8 7.4 7 9 4.2-1.6 7-4.8 7-9V6l-7-3Z', 'm9 12 2 2 4-4'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7v5l3 2'],
  spark: ['M12 3v4', 'M12 17v4', 'M3 12h4', 'M17 12h4', 'm5.6 5.6 2.5 2.5', 'm15.9 15.9 2.5 2.5', 'm18.4 5.6-2.5 2.5', 'm8.1 15.9-2.5 2.5'],
  heart: ['M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9Z'],
};

function AppIcon({
  name,
  size = 18,
  color = '#1F6FA8',
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {iconPaths[name].map((path, index) => (
        <Path
          key={`${name}-${index}`}
          d={path}
          stroke={color}
          strokeWidth={name === 'plane' ? 1.4 : 1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={name === 'plane' ? color : 'none'}
        />
      ))}
    </Svg>
  );
}

function PhotoShade({ id, width, height }: { id: string; width: number; height: number }) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.42" stopColor="#041018" stopOpacity="0" />
          <Stop offset="1" stopColor="#041018" stopOpacity="0.78" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill={`url(#${id})`} />
    </Svg>
  );
}

function HeroShade({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="heroShade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#061525" stopOpacity="0.55" />
          <Stop offset="0.38" stopColor="#0A2744" stopOpacity="0.18" />
          <Stop offset="1" stopColor="#061525" stopOpacity="0.78" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill="url(#heroShade)" />
    </Svg>
  );
}

const destinations = [
  { city: 'Hồ Chí Minh', code: 'SGN', country: 'Việt Nam', mood: 'Phố đêm', image: require('../../assets/images/destinations/TP.HCM.jpg') },
  { city: 'Hà Nội', code: 'HAN', country: 'Việt Nam', mood: 'Phố cổ', image: require('../../assets/images/destinations/hanoi.jpg') },
  { city: 'Đà Nẵng', code: 'DAD', country: 'Việt Nam', mood: 'Biển', image: require('../../assets/images/destinations/danang.jpg') },
  { city: 'Phú Quốc', code: 'PQC', country: 'Việt Nam', mood: 'Nghỉ dưỡng', image: require('../../assets/images/destinations/phuquoc.jpg') },
  { city: 'Đà Lạt', code: 'DLI', country: 'Việt Nam', mood: 'Se lạnh', image: require('../../assets/images/destinations/dalat.jpg') },
  { city: 'Singapore', code: 'SIN', country: 'Singapore', mood: 'Cuối tuần', image: require('../../assets/images/destinations/singapore.jpg') },
  { city: 'Hong Kong', code: 'HKG', country: 'Trung Quốc', mood: 'Đêm rực', image: require('../../assets/images/destinations/hongkong.jpg') },
  { city: 'Bangkok', code: 'BKK', country: 'Thái Lan', mood: 'Ẩm thực', image: require('../../assets/images/destinations/bangkok.jpg') },
  { city: 'Tokyo', code: 'NRT', country: 'Nhật Bản', mood: 'Mùa hoa', image: require('../../assets/images/destinations/tokyo.jpg') },
];

const popularRoutes = [
  { from: 'SGN', to: 'HAN', title: 'Sài Gòn → Hà Nội', note: 'Bay trong ngày' },
  { from: 'SGN', to: 'DAD', title: 'Sài Gòn → Đà Nẵng', note: 'Biển và phố' },
  { from: 'HAN', to: 'PQC', title: 'Hà Nội → Phú Quốc', note: 'Nghỉ vài ngày' },
  { from: 'SGN', to: 'SIN', title: 'Sài Gòn → Singapore', note: 'Cuối tuần' },
  { from: 'HAN', to: 'BKK', title: 'Hà Nội → Bangkok', note: 'Đi chơi ngắn' },
];

const reasons = [
  { icon: 'spark' as const, title: 'Giá rõ trên màn hình', body: 'Thấy hạng ghế, giờ bay và tổng tiền trước khi quyết định.' },
  { icon: 'clock' as const, title: 'Đặt trong vài phút', body: 'Chọn chuyến, điền hành khách, thanh toán — gọn trên điện thoại lẫn web.' },
  { icon: 'shield' as const, title: 'Đối tác quen thuộc', body: 'Vietnam Airlines, VietJet Air và Bamboo Airways trên cùng một chỗ.' },
  { icon: 'heart' as const, title: 'Có người hỗ trợ', body: 'Khi lịch thay đổi, bạn vẫn biết gọi cho ai.' },
];

const steps = [
  { n: '01', title: 'Chọn hành trình', body: 'Điểm đi, điểm đến, ngày bay và số khách.' },
  { n: '02', title: 'So sánh chuyến', body: 'Giờ cất cánh, hãng bay và hạng ghế nằm cạnh nhau.' },
  { n: '03', title: 'Giữ chỗ và bay', body: 'Thanh toán xong là có vé điện tử trong tài khoản.' },
];

const stories = [
  { name: 'Minh Anh', trip: 'SGN → HAN', quote: 'Mở app lúc tan làm, chọn được chuyến tối cùng ngày. Chữ to, bấm ít, không phải đoán giá.' },
  { name: 'Quốc Huy', trip: 'HAN → PQC', quote: 'Đặt trên web cho cả nhà. Ghế, hành khách và vé nằm một mạch, không lạc giữa các bước.' },
  { name: 'Lan Chi', trip: 'SGN → SIN', quote: 'Thích vì nhìn giống một trang du lịch tử tế: ảnh đẹp, thông tin đủ, không la hét giảm giá.' },
];

const travelStats = [
  { value: '3', label: 'Hãng đối tác' },
  { value: '9+', label: 'Điểm đến gợi ý' },
  { value: '4.9', label: 'Trải nghiệm đặt vé' },
];

function getDefaultDate() {
  const departure = new Date();
  departure.setDate(departure.getDate() + 3);
  const year = departure.getFullYear();
  const month = String(departure.getMonth() + 1).padStart(2, '0');
  const day = String(departure.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDepartureLabel() {
  const [year, month, day] = getDefaultDate().split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getPromotionTitle(promotion: Promotion, language: string) {
  return language === 'en'
    ? (promotion.eventTitleEn || promotion.eventTitle || promotion.titleEn || promotion.title)
    : (promotion.eventTitle || promotion.title);
}

function getPromotionDiscount(promotion: Promotion, language: string) {
  const value = promotion.discountValue.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US');
  return promotion.discountType === 'percentage' ? `-${value}%` : `-${value} ₫`;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isWide = width >= 860;
  const isDesktop = width >= 1180;
  const language = useAppLanguage();
  const settingsQuery = usePublicSettings();
  const promotionsQuery = useQuery({
    queryKey: ['promotions'],
    queryFn: getPublicPromotions,
    staleTime: 60_000,
  });
  const settings = settingsQuery.data;
  const eventPromotions = (promotionsQuery.data?.data ?? []).filter(
    (promotion) => promotion.campaignType === 'event' && Boolean(promotion.bannerImageUrl),
  );
  const featuredPromotion = eventPromotions[0];
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [sectionOffsets, setSectionOffsets] = useState({ destinations: 0, deals: 0, guides: 0 });
  const [heroMeasured, setHeroMeasured] = useState(0);
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip'>('oneway');
  const [cabinClass, setCabinClass] = useState<'economy' | 'business'>('economy');
  const [selectionMenu, setSelectionMenu] = useState<'trip' | 'cabin' | null>(null);

  const pagePad = isDesktop ? 36 : isWide ? 24 : 16;
  const contentWidth = Math.min(width, 1180) - pagePad * 2;
  const destCols = width >= 1100 ? 3 : 2;
  const destGap = 14;
  const destCardWidth = (contentWidth - destGap * (destCols - 1)) / destCols;
  const destImageHeight = Math.round(Math.max(178, Math.min(250, destCardWidth * 0.68)));
  const reasonCols = isDesktop ? 4 : isWide ? 2 : 1;
  const reasonGap = 12;
  const reasonWidth = (contentWidth - reasonGap * (reasonCols - 1)) / reasonCols;
  const heroHeight = Math.max(isWide ? 640 : 700, Math.min(height * (isWide ? 0.78 : 0.9), isWide ? 820 : 860));

  const openSearch = (destination = 'HKG', origin = 'SGN', airlineCode?: string) => router.push({
    pathname: '/explore',
    params: {
      from: origin,
      to: destination,
      date: getDefaultDate(),
      adultCount: '1',
      cabinClass,
      tripType,
      ...(airlineCode ? { airlines: airlineCode } : {}),
    },
  });
  const tripTypeLabel = tripType === 'roundtrip' ? 'Khứ hồi' : 'Một chiều';
  const cabinClassLabel = cabinClass === 'business' ? 'Thương gia' : 'Phổ thông';
  const scrollTo = (offset: number) => scrollRef.current?.scrollTo({ y: Math.max(offset, 0), animated: true });
  const scrollToSection = (offset: number) => scrollTo((heroMeasured || heroHeight) - 78 + offset - 8);
  const recordSection = (section: keyof typeof sectionOffsets) => (event: { nativeEvent: { layout: { y: number } } }) => {
    setSectionOffsets((current) => ({ ...current, [section]: event.nativeEvent.layout.y }));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ImageBackground
          source={require('../../assets/images/banners/hero-banner.jpg')}
          contentFit="cover"
          onLayout={(event) => setHeroMeasured(event.nativeEvent.layout.height)}
          style={[styles.hero, { minHeight: heroHeight, paddingTop: Math.max(insets.top, 16) + 8 }]}
          imageStyle={styles.heroArtwork}
        >
          <HeroShade width={width} height={heroHeight} />

          <View style={[styles.heroInner, isWide && styles.heroInnerWide, { paddingHorizontal: pagePad }]}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.brand} onPress={() => scrollTo(0)} accessibilityRole="button" accessibilityLabel="Về đầu trang">
                <View style={styles.brandMark}><AppIcon name="plane" size={18} color="#FFFFFF" /></View>
                <View style={styles.brandCopy}>
                  <Text style={styles.brandName}>SKYHAVEN</Text>
                  <Text style={styles.brandCaption}>Đặt vé, nhẹ đầu</Text>
                </View>
              </TouchableOpacity>

              {isWide ? (
                <View style={styles.navLinks}>
                  <TouchableOpacity onPress={() => scrollToSection(sectionOffsets.destinations)} accessibilityRole="link">
                    <Text style={styles.navLink}>Điểm đến</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => scrollToSection(sectionOffsets.deals)} accessibilityRole="link">
                    <Text style={styles.navLink}>Ưu đãi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => scrollToSection(sectionOffsets.guides)} accessibilityRole="link">
                    <Text style={styles.navLink}>Hãng bay</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.bookButton} onPress={() => openSearch()} accessibilityRole="button">
                  <Text style={styles.bookButtonText}>{isWide ? 'Đặt vé ngay' : 'Đặt vé'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.profileButton}
                  onPress={() => router.push('/profile')}
                  accessibilityRole="button"
                  accessibilityLabel="Mở hồ sơ"
                >
                  <View style={styles.profileAvatarHead} />
                  <View style={styles.profileAvatarBody} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.heroCopy, isWide && styles.heroCopyWide]}>
              <View style={styles.eyebrow}>
                <View style={styles.eyebrowDot} />
                <Text style={styles.eyebrowText}>CHUYẾN ĐI TIẾP THEO</Text>
              </View>
              <Text style={[styles.heroTitle, isWide && styles.heroTitleWide, isDesktop && styles.heroTitleDesktop]}>
                Bay đúng chuyến.{'\n'}Về đúng nhà.
              </Text>
              <Text style={[styles.heroSubtitle, isWide && styles.heroSubtitleWide]}>
                Chọn vé rõ giá, rõ giờ, rõ hãng — trên điện thoại khi đang di chuyển, hoặc trên web khi ngồi đặt cho cả nhà.
              </Text>
              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.heroCta} onPress={() => openSearch()} accessibilityRole="button">
                  <Text style={styles.heroCtaText}>Tìm chuyến bay</Text>
                  <Text style={styles.heroCtaArrow}>→</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroGhost} onPress={() => scrollToSection(sectionOffsets.destinations)} accessibilityRole="button">
                  <Text style={styles.heroGhostText}>Xem điểm đến</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.proof, isWide && styles.proofWide]}>
              {travelStats.map((stat, index) => (
                <View key={stat.label} style={[styles.proofItem, index > 0 && styles.proofItemBorder]}>
                  <Text style={styles.proofValue}>{stat.value}</Text>
                  <Text style={styles.proofLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </ImageBackground>

        <View style={[styles.mainContent, { paddingHorizontal: pagePad, maxWidth: 1180 }]}>
          <View style={[styles.searchCard, isDesktop && styles.searchCardWide]}>
            <View style={styles.searchAccent} />
            <View style={[styles.searchCardHeader, !isWide && styles.searchCardHeaderStacked]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productTabs}>
                <View style={styles.activeTab}><AppIcon name="plane" size={16} color="#123B5D" /><Text style={styles.activeTabText}>Chuyến bay</Text></View>
                <View style={styles.inactiveTab}><AppIcon name="hotel" size={15} color="#8AA0B1" /><Text style={styles.inactiveTabText}>Khách sạn</Text></View>
                <View style={styles.inactiveTab}><AppIcon name="restaurant" size={15} color="#8AA0B1" /><Text style={styles.inactiveTabText}>Ẩm thực</Text></View>
                <View style={styles.inactiveTab}><AppIcon name="tour" size={15} color="#8AA0B1" /><Text style={styles.inactiveTabText}>Tour</Text></View>
              </ScrollView>
              <View style={styles.flightOptions}>
                <TouchableOpacity style={styles.optionPill} onPress={() => setSelectionMenu('trip')} accessibilityRole="button">
                  <Text style={styles.optionText}>{tripTypeLabel}</Text><AppIcon name="chevron" size={15} color="#526C80" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionPill} onPress={() => setSelectionMenu('cabin')} accessibilityRole="button">
                  <Text style={styles.optionText}>{cabinClassLabel}</Text><AppIcon name="chevron" size={15} color="#526C80" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.searchFields, isDesktop && styles.searchFieldsWide]}>
              <TouchableOpacity style={[styles.searchField, isDesktop && styles.searchFieldWide]} onPress={() => openSearch()} accessibilityRole="button">
                <View style={styles.fieldIcon}><AppIcon name="takeoff" size={17} /></View>
                <View style={styles.fieldCopy}>
                  <Text style={styles.fieldLabel}>ĐIỂM ĐI</Text>
                  <Text style={styles.fieldValue} numberOfLines={1}>Hồ Chí Minh</Text>
                  <Text style={styles.fieldMeta}>SGN · Tân Sơn Nhất</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.searchField, isDesktop && styles.searchFieldWide]} onPress={() => openSearch()} accessibilityRole="button">
                <View style={styles.fieldIcon}><AppIcon name="landing" size={17} /></View>
                <View style={styles.fieldCopy}>
                  <Text style={styles.fieldLabel}>ĐIỂM ĐẾN</Text>
                  <Text style={styles.fieldValue} numberOfLines={1}>Hong Kong</Text>
                  <Text style={styles.fieldMeta}>HKG · Hong Kong Intl.</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.searchField, isDesktop && styles.searchFieldWide]} onPress={() => openSearch()} accessibilityRole="button">
                <View style={styles.fieldIcon}><AppIcon name="calendar" size={17} /></View>
                <View style={styles.fieldCopy}>
                  <Text style={styles.fieldLabel}>NGÀY BAY</Text>
                  <Text style={styles.fieldValue} numberOfLines={1}>{getDepartureLabel()}</Text>
                  <Text style={styles.fieldMeta}>Đổi được ở bước sau</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.searchField, isDesktop && styles.searchFieldWide]} onPress={() => openSearch()} accessibilityRole="button">
                <View style={styles.fieldIcon}><AppIcon name="passengers" size={17} /></View>
                <View style={styles.fieldCopy}>
                  <Text style={styles.fieldLabel}>HÀNH KHÁCH</Text>
                  <Text style={styles.fieldValue} numberOfLines={1}>1 người lớn</Text>
                  <Text style={styles.fieldMeta}>{cabinClassLabel}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.searchSubmit, !isDesktop && styles.searchSubmitMobile]} onPress={() => openSearch()} activeOpacity={0.9} accessibilityRole="button">
                <AppIcon name="search" size={18} color="#1A1206" />
                <Text style={styles.searchSubmitText}>Tìm chuyến</Text>
              </TouchableOpacity>
            </View>
          </View>

          <BookingSettingsNotice
            settings={settings}
            error={settingsQuery.isError ? 'Không tải được cài đặt.' : undefined}
          />

          {featuredPromotion ? (
            <View onLayout={recordSection('deals')} style={styles.eventSection}>
              <View style={styles.eventSectionHeader}>
                <View style={styles.sectionHeaderCopy}>
                  <Text style={styles.sectionEyebrow}>{language === 'vi' ? 'ƯU ĐÃI' : 'OFFERS'}</Text>
                  <Text style={styles.sectionTitle}>
                    {language === 'vi' ? 'Ưu đãi đang diễn ra' : 'Current offers'}
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    {language === 'vi'
                      ? 'Khám phá chương trình mới nhất từ các hãng bay.'
                      : 'Explore the latest campaigns from our airline partners.'}
                  </Text>
                </View>
                {isWide ? (
                  <TouchableOpacity
                    onPress={() => openSearch('HKG', 'SGN', featuredPromotion.airlineCode)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.seeAll}>{language === 'vi' ? 'Tìm chuyến bay →' : 'Find flights →'}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => openSearch('HKG', 'SGN', featuredPromotion.airlineCode)}
                accessibilityRole="button"
                accessibilityLabel={`${getPromotionTitle(featuredPromotion, language)} · ${language === 'vi' ? 'Tìm chuyến bay' : 'Find flights'}`}
              >
                <ImageBackground
                  source={{ uri: featuredPromotion.bannerImageUrl }}
                  contentFit="cover"
                  style={[styles.eventHero, { height: isWide ? 250 : 178 }]}
                  imageStyle={styles.eventHeroImage}
                >
                  <View style={styles.eventHeroFooter}>
                    <View style={styles.eventHeroDetails}>
                      <Text style={styles.eventHeroAirline} numberOfLines={1}>
                        {featuredPromotion.airlineCode} · {getPromotionDiscount(featuredPromotion, language)}
                      </Text>
                      <Text style={styles.eventHeroCode} numberOfLines={1}>
                        {language === 'vi' ? 'Mã ưu đãi: ' : 'Promo code: '}{featuredPromotion.code}
                      </Text>
                    </View>
                    <View style={styles.eventHeroAction}>
                      <Text style={styles.eventHeroActionText}>
                        {language === 'vi' ? 'Xem ưu đãi →' : 'View offer →'}
                      </Text>
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>

              {eventPromotions.length > 1 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.eventDealRail}
                >
                  {eventPromotions.slice(1).map((promotion) => (
                    <TouchableOpacity
                      key={promotion._id}
                      activeOpacity={0.9}
                      onPress={() => openSearch('HKG', 'SGN', promotion.airlineCode)}
                      accessibilityRole="button"
                      accessibilityLabel={`${getPromotionTitle(promotion, language)} · ${language === 'vi' ? 'Tìm chuyến bay' : 'Find flights'}`}
                      style={[styles.eventDealCard, { width: isDesktop ? (contentWidth - 24) / 3 : isWide ? 300 : Math.max(250, contentWidth - 28) }]}
                    >
                      <ImageBackground
                        source={{ uri: promotion.bannerImageUrl }}
                        contentFit="cover"
                        style={styles.eventDealImage}
                        imageStyle={styles.eventDealImageArtwork}
                      >
                        <View style={styles.eventDealFooter}>
                          <Text style={styles.eventDealTitle} numberOfLines={1}>
                            {getPromotionTitle(promotion, language)}
                          </Text>
                          <Text style={styles.eventDealMeta} numberOfLines={1}>
                            {promotion.airlineCode} · {getPromotionDiscount(promotion, language)} · {promotion.code}
                          </Text>
                        </View>
                      </ImageBackground>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null}
            </View>
          ) : promotionsQuery.isError ? (
            <View onLayout={recordSection('deals')} style={styles.eventError}>
              <Text style={styles.eventErrorText}>
                {language === 'vi' ? 'Không tải được ưu đãi đang diễn ra.' : 'Current offers could not be loaded.'}
              </Text>
              <TouchableOpacity onPress={() => { void promotionsQuery.refetch(); }} accessibilityRole="button">
                <Text style={styles.seeAll}>{language === 'vi' ? 'Thử lại' : 'Retry'}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionEyebrow}>CHẶNG HAY ĐƯỢC CHỌN</Text>
            <Text style={styles.sectionTitle}>Đi chơi, không cần lên kế hoạch dài</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.routeRail}>
              {popularRoutes.map((route) => (
                <TouchableOpacity
                  key={`${route.from}-${route.to}`}
                  style={styles.routeChip}
                  onPress={() => openSearch(route.to, route.from)}
                  activeOpacity={0.86}
                  accessibilityRole="button"
                  accessibilityLabel={`Tìm vé ${route.title}`}
                >
                  <Text style={styles.routeChipNote}>{route.note}</Text>
                  <Text style={styles.routeChipTitle}>{route.title}</Text>
                  <Text style={styles.routeChipMeta}>{route.from}  ·  {route.to}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View onLayout={recordSection('destinations')} style={styles.sectionHeader}>
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.sectionEyebrow}>ĐIỂM ĐẾN</Text>
              <Text style={styles.sectionTitle}>Một tấm ảnh, một lý do để đi</Text>
              <Text style={styles.sectionSubtitle}>Chạm vào thành phố bạn đang nghĩ tới. Chúng tôi mở sẵn tìm kiếm từ sân bay gần bạn.</Text>
            </View>
            {isWide ? (
              <TouchableOpacity onPress={() => openSearch()} accessibilityRole="button">
                <Text style={styles.seeAll}>Tìm vé khác →</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={[styles.destinationGrid, { gap: destGap }]}>
            {destinations.map((item) => {
              const cardWidth = destCardWidth;
              return (
              <TouchableOpacity
                key={item.code}
                style={[styles.destinationCard, { width: cardWidth }]}
                onPress={() => openSearch(item.code)}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel={`Tìm vé tới ${item.city}`}
              >
                <ImageBackground
                  source={item.image}
                  style={[styles.destinationImage, { width: '100%', height: destImageHeight }]}
                  imageStyle={styles.destinationImageArtwork}
                >
                  <PhotoShade id={`dest-${item.code}`} width={cardWidth} height={destImageHeight} />
                  <View style={styles.destinationMood}><Text style={styles.destinationMoodText}>{item.mood}</Text></View>
                  <View style={styles.destinationCodeBadge}><Text style={styles.destinationCode}>{item.code}</Text></View>
                  <View style={styles.destinationOverlayCopy}>
                    <Text style={styles.destinationCity}>{item.city}</Text>
                    <Text style={styles.destinationCountry}>{item.country}</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.reasonGrid, { gap: reasonGap }]}>
            {reasons.map((reason) => (
              <View key={reason.title} style={[styles.reasonCard, { width: reasonWidth }]}>
                <View style={styles.reasonIcon}>
                  <AppIcon name={reason.icon} size={18} color="#8A5A12" />
                </View>
                <Text style={styles.reasonTitle}>{reason.title}</Text>
                <Text style={styles.reasonBody}>{reason.body}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.promoRow, isWide && styles.promoRowWide]}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => openSearch('DAD', 'SGN')}
              accessibilityRole="button"
              style={isWide ? styles.promoPrimaryWide : undefined}
            >
              <ImageBackground source={require('../../assets/images/banners/3.jpg')} contentFit="cover" style={[styles.promotionCard, isWide && styles.promotionCardTall]} imageStyle={styles.promotionArtwork}>
                <View style={styles.promotionShade} />
                <View style={styles.promotionContent}>
                  <Text style={styles.promotionLabel}>MÙA NÀY</Text>
                  <Text style={styles.promotionTitle}>Ra biển{'\n'}cuối tuần này</Text>
                  <Text style={styles.promotionAction}>Xem vé Sài Gòn – Đà Nẵng  →</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => openSearch('NRT', 'SGN')}
              accessibilityRole="button"
              style={isWide ? styles.promoSecondaryWide : styles.promoSecond}
            >
              <ImageBackground source={require('../../assets/images/banners/promotion-banner.jpg')} contentFit="cover" style={[styles.promotionCard, styles.promotionCardAlt, isWide && styles.promotionCardTall]} imageStyle={styles.promotionArtwork}>
                <View style={styles.promotionShadeSoft} />
                <View style={styles.promotionContent}>
                  <Text style={styles.promotionLabel}>ĐI XA HƠN</Text>
                  <Text style={[styles.promotionTitle, styles.promotionTitleSmall]}>Tokyo,{'\n'}khi lịch đã trống</Text>
                  <Text style={styles.promotionAction}>Tìm vé đi Nhật  →</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          </View>

          <View style={styles.stepsCard}>
            <Text style={styles.sectionEyebrow}>CÁCH ĐẶT</Text>
            <Text style={styles.sectionTitle}>Ba bước, rồi để vé lo phần còn lại</Text>
            <View style={[styles.stepsRow, isWide && styles.stepsRowWide]}>
              {steps.map((step) => (
                <View key={step.n} style={[styles.step, isWide && styles.stepWide]}>
                  <Text style={styles.stepNumber}>{step.n}</Text>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepBody}>{step.body}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionEyebrow}>KHÁCH ĐÃ BAY</Text>
            <Text style={styles.sectionTitle}>Người ta quay lại vì cảm giác nhẹ</Text>
            <View style={[styles.storyGrid, isWide && styles.storyGridWide]}>
              {stories.map((story) => (
                <View key={story.name} style={[styles.storyCard, isWide && styles.storyCardWide]}>
                  <Text style={styles.storyQuote}>“{story.quote}”</Text>
                  <Text style={styles.storyName}>{story.name}</Text>
                  <Text style={styles.storyTrip}>{story.trip}</Text>
                </View>
              ))}
            </View>
          </View>

          <View onLayout={recordSection('guides')} style={styles.airlineCard}>
            <View style={[styles.airlineHeader, !isWide && styles.airlineHeaderStacked]}>
              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.sectionEyebrow}>ĐỐI TÁC</Text>
                <Text style={styles.airlineTitle}>Hãng bạn đã biết tên</Text>
              </View>
              <Text style={styles.airlineCaption}>Cùng lịch bay, cùng một cách đặt.</Text>
            </View>
            <View style={styles.airlineLogos}>
              <View style={styles.airlineLogoWrap}>
                <Image source={require('../../assets/images/airlines/vietnam-airlines.png')} style={styles.airlineLogo} resizeMode="contain" accessibilityLabel="Vietnam Airlines" />
              </View>
              <View style={styles.airlineLogoWrap}>
                <Image source={require('../../assets/images/airlines/vietjet.png')} style={styles.airlineLogo} resizeMode="contain" accessibilityLabel="VietJet Air" />
              </View>
              <View style={styles.airlineLogoWrap}>
                <Image source={require('../../assets/images/airlines/bamboo-airways.png')} style={styles.airlineLogo} resizeMode="contain" accessibilityLabel="Bamboo Airways" />
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.historyCard} onPress={() => router.push('/booking-history')} activeOpacity={0.88} accessibilityRole="button">
            <View style={styles.historyIcon}><Text style={styles.historyEmoji}>✈</Text></View>
            <View style={styles.historyTextContainer}>
              <Text style={styles.historyTitle}>Vé đã đặt</Text>
              <Text style={styles.historyDescription}>Mở lại hành trình, ghế và trạng thái thanh toán bất cứ lúc nào.</Text>
            </View>
            <Text style={styles.historyArrow}>›</Text>
          </TouchableOpacity>

          {settings && Boolean(settings.supportEmail || settings.supportPhone) ? (
            <View style={styles.supportCard}>
              <Text style={styles.supportTitle}>Cần người thật trả lời?</Text>
              {settings.supportPhone ? <Text style={styles.supportText}>Điện thoại  {settings.supportPhone}</Text> : null}
              {settings.supportEmail ? <Text style={styles.supportText}>Email  {settings.supportEmail}</Text> : null}
            </View>
          ) : null}

          <View style={styles.closing}>
            <Text style={styles.closingEyebrow}>SẴN SÀNG KHI BẠN SẴN SÀNG</Text>
            <Text style={styles.closingTitle}>Chuyến tiếp theo có thể bắt đầu từ tối nay.</Text>
            <TouchableOpacity style={styles.closingButton} onPress={() => openSearch()} accessibilityRole="button">
              <Text style={styles.closingButtonText}>Bắt đầu tìm vé</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>{settings?.siteName || 'Skyhaven'} · Bay nhẹ, về đúng nhà</Text>
        </View>
      </ScrollView>
      <Modal
        visible={selectionMenu !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectionMenu(null)}
      >
        <Pressable style={styles.modalScrim} onPress={() => setSelectionMenu(null)}>
          <Pressable style={styles.optionSheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.optionSheetTitle}>
              {selectionMenu === 'trip' ? 'Loại vé' : 'Hạng ghế'}
            </Text>
            {(selectionMenu === 'trip'
              ? [
                { label: 'Một chiều', value: 'oneway' },
                { label: 'Khứ hồi', value: 'roundtrip' },
              ]
              : [
                { label: 'Phổ thông', value: 'economy' },
                { label: 'Thương gia', value: 'business' },
              ]
            ).map((option) => {
              const isSelected = selectionMenu === 'trip'
                ? tripType === option.value
                : cabinClass === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionChoice, isSelected && styles.optionChoiceSelected]}
                  onPress={() => {
                    if (selectionMenu === 'trip') {
                      setTripType(option.value as 'oneway' | 'roundtrip');
                    } else {
                      setCabinClass(option.value as 'economy' | 'business');
                    }
                    setSelectionMenu(null);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.optionChoiceText, isSelected && styles.optionChoiceTextSelected]}>
                    {option.label}
                  </Text>
                  {isSelected ? <Text style={styles.optionChoiceCheck}>✓</Text> : null}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const webPress = Platform.OS === 'web' ? { cursor: 'pointer' as const } : undefined;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F6FA' },
  scrollContent: { paddingBottom: 36 },
  hero: { overflow: 'hidden', backgroundColor: '#0C3558', justifyContent: 'flex-end' },
  heroArtwork: { opacity: 1 },
  heroInner: { flex: 1, width: '100%', justifyContent: 'space-between', paddingBottom: 108 },
  heroInnerWide: { maxWidth: 1180, alignSelf: 'center', width: '100%' },
  header: { width: '100%', minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, ...webPress },
  brandMark: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.32)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  brandCopy: { flexShrink: 1 },
  brandName: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 1.8 },
  brandCaption: { color: 'rgba(255,255,255,0.78)', fontSize: 11, marginTop: 1 },
  navLinks: { flexDirection: 'row', alignItems: 'center', gap: 26 },
  navLink: { color: 'rgba(255,255,255,0.92)', fontSize: 14, fontWeight: '600' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bookButton: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', ...webPress },
  bookButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  profileButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', ...webPress },
  profileAvatarHead: { position: 'absolute', top: 9, width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' },
  profileAvatarBody: { position: 'absolute', bottom: 7, width: 20, height: 10, borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: '#FFFFFF' },
  heroCopy: { width: '100%', maxWidth: 680, marginTop: 36 },
  heroCopyWide: { marginTop: 48 },
  eyebrow: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E8C27A', marginRight: 8 },
  eyebrowText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', letterSpacing: 1.3 },
  heroTitle: { color: '#FFFFFF', fontSize: 40, lineHeight: 46, fontWeight: '800', marginTop: 16, letterSpacing: -0.8 },
  heroTitleWide: { fontSize: 56, lineHeight: 62 },
  heroTitleDesktop: { fontSize: 68, lineHeight: 74 },
  heroSubtitle: { color: 'rgba(255,255,255,0.88)', fontSize: 15, lineHeight: 23, maxWidth: 460, marginTop: 14 },
  heroSubtitleWide: { fontSize: 17, lineHeight: 26, maxWidth: 540 },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 22 },
  heroCta: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 13, backgroundColor: '#E8C27A', ...webPress },
  heroCtaText: { color: '#1A1206', fontSize: 14, fontWeight: '800' },
  heroCtaArrow: { color: '#1A1206', fontSize: 16, fontWeight: '700' },
  heroGhost: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', ...webPress },
  heroGhostText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  proof: { marginTop: 28, flexDirection: 'row', alignSelf: 'flex-start', borderRadius: 18, backgroundColor: 'rgba(8, 22, 38, 0.38)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  proofWide: { marginTop: 36 },
  proofItem: { paddingHorizontal: 16, paddingVertical: 12, minWidth: 96 },
  proofItemBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.16)' },
  proofValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  proofLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 11, marginTop: 2 },
  mainContent: { width: '100%', alignSelf: 'center', marginTop: -78 },
  searchCard: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 16, paddingTop: 18, borderWidth: 1, borderColor: '#E6EDF3', overflow: 'hidden', shadowColor: '#102F4A', shadowOpacity: 0.16, shadowRadius: 28, shadowOffset: { width: 0, height: 16 }, elevation: 8 },
  searchCardWide: { padding: 22, paddingTop: 24, borderRadius: 32 },
  searchAccent: { position: 'absolute', left: 0, right: 0, top: 0, height: 4, backgroundColor: '#E8C27A' },
  searchCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14 },
  searchCardHeaderStacked: { alignItems: 'flex-start', flexDirection: 'column', gap: 12 },
  productTabs: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 8 },
  inactiveTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999 },
  activeTab: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#EAF3FB' },
  inactiveTabText: { color: '#8AA0B1', fontSize: 13, fontWeight: '600' },
  activeTabText: { color: '#123B5D', fontSize: 13, fontWeight: '800' },
  flightOptions: { flexDirection: 'row', gap: 8 },
  modalScrim: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', padding: 16, backgroundColor: 'rgba(7, 26, 42, 0.48)' },
  optionSheet: { width: '100%', maxWidth: 420, borderRadius: 24, padding: 18, marginBottom: 8, backgroundColor: '#FFFFFF' },
  optionSheetTitle: { color: '#123B5D', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  optionChoice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, marginTop: 8, backgroundColor: '#F4F7FB' },
  optionChoiceSelected: { backgroundColor: '#EAF3FB' },
  optionChoiceText: { color: '#526C80', fontSize: 15, fontWeight: '700' },
  optionChoiceTextSelected: { color: '#123B5D' },
  optionChoiceCheck: { color: '#1F6FA8', fontSize: 16, fontWeight: '800' },
  optionPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, borderColor: '#E4EBF2', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F7F9FC', ...webPress },
  optionText: { color: '#24445F', fontSize: 13, fontWeight: '700' },
  searchFields: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  searchFieldsWide: { flexWrap: 'nowrap', alignItems: 'stretch', rowGap: 0, borderRadius: 18, borderWidth: 1, borderColor: '#E6EDF3', overflow: 'hidden', backgroundColor: '#F7F9FC' },
  searchField: { width: '48.5%', minHeight: 72, flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 12, backgroundColor: '#F7F9FC', ...webPress },
  searchFieldWide: { flex: 1, width: undefined, borderRadius: 0, borderRightWidth: 1, borderRightColor: '#E6EDF3', backgroundColor: 'transparent' },
  fieldIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E7F2FA', marginRight: 10 },
  fieldCopy: { flex: 1 },
  fieldLabel: { color: '#7C91A3', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  fieldValue: { color: '#123B5D', fontSize: 15, fontWeight: '800', marginTop: 3 },
  fieldMeta: { color: '#71879A', fontSize: 12, marginTop: 2 },
  searchSubmit: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingHorizontal: 18, backgroundColor: '#E8C27A', ...webPress },
  searchSubmitMobile: { width: '100%', marginTop: 2 },
  searchSubmitText: { color: '#1A1206', fontSize: 15, fontWeight: '800' },
  sectionBlock: { marginTop: 36 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginTop: 36, marginBottom: 16 },
  sectionHeaderCopy: { flex: 1 },
  sectionEyebrow: { color: '#8A5A12', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 },
  sectionTitle: { color: '#102F4A', fontSize: 26, lineHeight: 32, fontWeight: '800', letterSpacing: -0.4 },
  sectionSubtitle: { color: '#5E7486', fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 520 },
  seeAll: { color: '#1F6FA8', fontSize: 14, fontWeight: '700', paddingBottom: 4 },
  eventSection: { marginTop: 32 },
  eventSectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 16 },
  eventHero: { width: '100%', borderRadius: 20, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: '#123B5D' },
  eventHeroImage: { borderRadius: 20 },
  eventHeroFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, paddingVertical: 13, backgroundColor: 'rgba(7, 26, 42, 0.72)' },
  eventHeroDetails: { flex: 1 },
  eventHeroAirline: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  eventHeroCode: { color: 'rgba(255,255,255,0.86)', fontSize: 12, fontWeight: '600', marginTop: 3 },
  eventHeroAction: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFFFFF' },
  eventHeroActionText: { color: '#123B5D', fontSize: 13, fontWeight: '800' },
  eventDealRail: { gap: 12, paddingTop: 14, paddingBottom: 4 },
  eventDealCard: { borderRadius: 18, overflow: 'hidden', backgroundColor: '#D5E3EE', ...webPress },
  eventDealImage: { height: 174, justifyContent: 'flex-end' },
  eventDealImageArtwork: { borderRadius: 18 },
  eventDealFooter: { paddingHorizontal: 13, paddingVertical: 11, backgroundColor: 'rgba(7, 26, 42, 0.76)' },
  eventDealTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  eventDealMeta: { color: 'rgba(255,255,255,0.86)', fontSize: 11, fontWeight: '600', marginTop: 4 },
  eventError: { marginTop: 28, padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EDF3', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  eventErrorText: { flex: 1, color: '#5E7486', fontSize: 13 },
  routeRail: { gap: 10, paddingTop: 14, paddingBottom: 4 },
  routeChip: { width: 210, borderRadius: 18, padding: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EDF3', ...webPress },
  routeChipNote: { color: '#8A5A12', fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  routeChipTitle: { color: '#123B5D', fontSize: 15, fontWeight: '800', marginTop: 8 },
  routeChipMeta: { color: '#71879A', fontSize: 12, marginTop: 6, letterSpacing: 0.4 },
  destinationGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  destinationCard: { borderRadius: 22, overflow: 'hidden', backgroundColor: '#D5E3EE', ...webPress },
  destinationImage: { justifyContent: 'flex-end' },
  destinationImageArtwork: { borderRadius: 22 },
  destinationMood: { position: 'absolute', left: 12, top: 12, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.9)' },
  destinationMoodText: { color: '#123B5D', fontSize: 11, fontWeight: '800' },
  destinationCodeBadge: { position: 'absolute', right: 12, top: 12, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: 'rgba(8, 24, 40, 0.55)' },
  destinationCode: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  destinationOverlayCopy: { padding: 14 },
  destinationCity: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  destinationCountry: { color: 'rgba(255,255,255,0.86)', fontSize: 12, marginTop: 2 },
  reasonGrid: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap' },
  reasonCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E6EDF3' },
  reasonIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F8F1E3', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  reasonTitle: { color: '#123B5D', fontSize: 16, fontWeight: '800' },
  reasonBody: { color: '#5E7486', fontSize: 13, lineHeight: 20, marginTop: 6 },
  promoRow: { marginTop: 22, gap: 12 },
  promoRowWide: { flexDirection: 'row' },
  promoPrimaryWide: { flex: 1.15 },
  promoSecondaryWide: { flex: 0.85 },
  promoSecond: { marginTop: 0 },
  promotionCard: { width: '100%', height: 210, borderRadius: 24, overflow: 'hidden', padding: 22, justifyContent: 'flex-end', backgroundColor: '#1C5074' },
  promotionCardTall: { height: 280 },
  promotionCardAlt: { height: 210 },
  promotionArtwork: { borderRadius: 24 },
  promotionShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10, 32, 54, 0.5)' },
  promotionShadeSoft: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10, 32, 54, 0.42)' },
  promotionContent: { zIndex: 1, maxWidth: 360 },
  promotionLabel: { color: '#F3D7A1', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  promotionTitle: { color: '#FFFFFF', fontSize: 30, lineHeight: 36, fontWeight: '800', marginTop: 8, letterSpacing: -0.4 },
  promotionTitleSmall: { fontSize: 26, lineHeight: 32 },
  promotionAction: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginTop: 14 },
  stepsCard: { marginTop: 28, backgroundColor: '#102F4A', borderRadius: 28, padding: 22 },
  stepsRow: { marginTop: 18, gap: 16 },
  stepsRowWide: { flexDirection: 'row' },
  step: { flex: 1 },
  stepWide: { paddingRight: 12 },
  stepNumber: { color: '#E8C27A', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  stepTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginTop: 8 },
  stepBody: { color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 21, marginTop: 6 },
  storyGrid: { marginTop: 14, gap: 10 },
  storyGridWide: { flexDirection: 'row' },
  storyCard: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#E6EDF3' },
  storyCardWide: { flex: 1 },
  storyQuote: { color: '#1C3E5A', fontSize: 15, lineHeight: 23, fontWeight: '500' },
  storyName: { color: '#123B5D', fontSize: 14, fontWeight: '800', marginTop: 16 },
  storyTrip: { color: '#8A5A12', fontSize: 12, fontWeight: '700', marginTop: 3 },
  airlineCard: { backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#E6EDF3', padding: 18, marginTop: 28 },
  airlineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
  airlineHeaderStacked: { flexDirection: 'column', alignItems: 'flex-start' },
  airlineTitle: { color: '#123B5D', fontSize: 24, fontWeight: '800' },
  airlineCaption: { color: '#5E7486', fontSize: 13, lineHeight: 18, maxWidth: 220 },
  airlineLogos: { flexDirection: 'row', gap: 10, marginTop: 16 },
  airlineLogoWrap: { flex: 1, height: 72, borderRadius: 16, backgroundColor: '#F7F9FC', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  airlineLogo: { width: '100%', height: 42 },
  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: '#E6EDF3', marginTop: 12, ...webPress },
  historyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#EAF3FB', alignItems: 'center', justifyContent: 'center' },
  historyEmoji: { color: '#1F6FA8', fontSize: 20 },
  historyTextContainer: { flex: 1, marginLeft: 12 },
  historyTitle: { color: '#123B5D', fontSize: 16, fontWeight: '800' },
  historyDescription: { color: '#5E7486', fontSize: 13, marginTop: 4, lineHeight: 19 },
  historyArrow: { color: '#C4A15A', fontSize: 28, marginLeft: 8 },
  supportCard: { backgroundColor: '#FFFFFF', borderRadius: 22, borderColor: '#E6EDF3', borderWidth: 1, marginTop: 12, padding: 18 },
  supportTitle: { color: '#123B5D', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  supportText: { color: '#4E6678', fontSize: 14, marginTop: 4 },
  closing: { marginTop: 28, borderRadius: 28, padding: 24, backgroundColor: '#E9F3FB' },
  closingEyebrow: { color: '#1F6FA8', fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  closingTitle: { color: '#102F4A', fontSize: 26, lineHeight: 33, fontWeight: '800', marginTop: 8, maxWidth: 460, letterSpacing: -0.3 },
  closingButton: { alignSelf: 'flex-start', marginTop: 16, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 13, backgroundColor: '#123B5D', ...webPress },
  closingButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  footer: { textAlign: 'center', color: '#8AA0B1', fontSize: 12, marginTop: 22 },
});
