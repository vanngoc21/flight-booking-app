import '../global.css';

import { Stack } from 'expo-router';
import QueryProvider from '../providers/QueryProvider';
import AppProviders from '../providers/AppProviders';
import { BookingDraftProvider } from '../providers/BookingDraftProvider';
import FloatingAIChatButton from '../components/FloatingAIChatButton';
import { View } from 'react-native';
import { translateText, useAppLanguage } from '../i18n';


function AppNavigator() {
  const language = useAppLanguage();
  const title = (value: string) => translateText(value, language);

  return (
    <View style={{ flex: 1 }}>
      <BookingDraftProvider>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
            headerTintColor: '#123B5D',
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 16,
            },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: {
              backgroundColor: '#F7F9FC',
            },
          }}
        >
          <Stack.Screen
            name="index"
            options={{ title: title('Flight Booking'), headerShown: false }}
          />

          <Stack.Screen name="login" options={{ title: title('Đăng nhập') }} />
          <Stack.Screen name="register" options={{ title: title('Đăng ký') }} />
          <Stack.Screen name="explore" options={{ title: title('Tìm chuyến bay') }} />
          <Stack.Screen name="flights/[id]" options={{ title: title('Chi tiết chuyến bay') }} />
          <Stack.Screen name="profile" options={{ title: title('Hồ sơ khách hàng') }} />
          <Stack.Screen name="booking-history" options={{ title: title('Lịch sử đặt vé') }} />
          <Stack.Screen name="booking/success" options={{ title: title('Đặt vé thành công') }} />
          <Stack.Screen name="booking/failed" options={{ title: title('Thanh toán thất bại') }} />
          <Stack.Screen name="booking/ticket" options={{ title: title('Vé điện tử') }} />
          <Stack.Screen name="booking/detail" options={{ title: title('Chi tiết đặt vé') }} />
          <Stack.Screen name="booking/seats" options={{ title: title('Chọn ghế') }} />
          <Stack.Screen name="booking/passenger" options={{ title: title('Thông tin hành khách') }} />
          <Stack.Screen name="tracker" options={{ title: title('Theo dõi chuyến bay') }} />
          <Stack.Screen name="notifications" options={{ title: title('Thông báo') }} />
          <Stack.Screen
            name="ai-assistant"
            options={{
              title: title('AI Flight Assistant'),
              headerStyle: { backgroundColor: '#123B5D' },
              headerTintColor: '#FFFFFF',
            }}
          />
        </Stack>
      </BookingDraftProvider>

      <FloatingAIChatButton />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <QueryProvider>
        <AppNavigator />
      </QueryProvider>
    </AppProviders>
  );
}