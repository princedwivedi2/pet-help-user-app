import React, { useEffect, useRef } from 'react'
import { NavigationContainerRef, NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import * as Notifications from 'expo-notifications'
import SplashScreen from '../screens/Splash/SplashScreen'
import LoginScreen from '../screens/Auth/LoginScreen'
import HomeScreen from '../screens/Home/HomeScreen'
import SearchScreen from '../screens/Search/SearchScreen'
import PetsScreen from '../screens/Pets/PetsScreen'
import PetRecordsScreen from '../screens/Pets/PetRecordsScreen'
import AppointmentsScreen from '../screens/Appointments/AppointmentsScreen'
import ProfileScreen from '../screens/Profile/ProfileScreen'
import VetDetailScreen from '../screens/Vet/VetDetailScreen'
import NearbyVetsScreen from '../screens/Map/NearbyVetsScreen'
import BookingScreen from '../screens/Booking/BookingScreen'
import PaymentScreen from '../screens/Payment/PaymentScreen'
import PaymentHistoryScreen from '../screens/Payment/PaymentHistoryScreen'
import PaymentDetailScreen from '../screens/Payment/PaymentDetailScreen'
import NotificationsScreen from '../screens/Notifications/NotificationsScreen'
import ConfirmationScreen from '../screens/Confirmation/ConfirmationScreen'
import ModalityPickerScreen from '../screens/Consultation/ModalityPickerScreen'
import ConsultationRoomScreen from '../screens/Consultation/ConsultationRoomScreen'
import AppointmentDetailScreen from '../screens/Appointments/AppointmentDetailScreen'
import BlogScreen from '../screens/Blog/BlogScreen'
import BlogPostScreen from '../screens/Blog/BlogPostScreen'
import PrescriptionsScreen from '../screens/Pets/PrescriptionsScreen'
import SubscriptionPlansScreen from '../screens/Subscription/SubscriptionPlansScreen'
import ChatScreen from '../screens/Chat/ChatScreen'
import WalletScreen from '../screens/Payment/WalletScreen'
import ServerSettingsScreen from '../screens/Dev/ServerSettingsScreen'
import EmergencyScreen from '../screens/Emergency/EmergencyScreen'
import { HelpSupportScreen, LegalAboutScreen, NotificationPreferencesScreen } from '../screens/Profile/ProductSettingsScreens'
import { Ionicons } from '@expo/vector-icons'
import { View } from 'react-native'
import { colors, radius } from '../theme'
import { AuthProvider } from '../contexts/AuthProvider'
import { setPostSignOutNav } from '../utils/authEvents'
import { withSafeTop } from '../components/SafeScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// Tab screens — wrapped so titles clear the status bar under edge-to-edge.
const HomeTab = withSafeTop(HomeScreen)
const SearchTab = withSafeTop(SearchScreen)
const BookingsTab = withSafeTop(AppointmentsScreen)
const PetsTab = withSafeTop(PetsScreen)
const ProfileTab = withSafeTop(ProfileScreen)

// Stack screens — same treatment. Full-bleed screens (Splash, ConsultationRoom)
// and screens that already pad for the status bar (Payment, NearbyVets) opt out.
const LoginStack = withSafeTop(LoginScreen)
const VetDetailStack = withSafeTop(VetDetailScreen)
const BookingStack = withSafeTop(BookingScreen)
const NotificationsStack = withSafeTop(NotificationsScreen)
const PetRecordsStack = withSafeTop(PetRecordsScreen)
const ConfirmationStack = withSafeTop(ConfirmationScreen)
const ModalityPickerStack = withSafeTop(ModalityPickerScreen)
const AppointmentDetailStack = withSafeTop(AppointmentDetailScreen)
const BlogStack = withSafeTop(BlogScreen)
const BlogPostStack = withSafeTop(BlogPostScreen)
const PrescriptionsStack = withSafeTop(PrescriptionsScreen)
const SubscriptionsStack = withSafeTop(SubscriptionPlansScreen)
const ChatStack = withSafeTop(ChatScreen)
const WalletStack = withSafeTop(WalletScreen)
const PaymentHistoryStack = withSafeTop(PaymentHistoryScreen)
const PaymentDetailStack = withSafeTop(PaymentDetailScreen)
const ServerSettingsStack = withSafeTop(ServerSettingsScreen)
const EmergencyStack = withSafeTop(EmergencyScreen)
const NotificationPreferencesStack = withSafeTop(NotificationPreferencesScreen)
const HelpSupportStack = withSafeTop(HelpSupportScreen)
const LegalAboutStack = withSafeTop(LegalAboutScreen)

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtle,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 9, lineHeight: 13, fontWeight: '700', marginBottom: 8 },
        tabBarItemStyle: { paddingTop: 9 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          height: 88,
          shadowColor: colors.dark,
          shadowOpacity: 0.1,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: -7 },
          elevation: 10,
        },
        tabBarIcon: ({ focused, color }) => {
          type IoniconsName = React.ComponentProps<typeof Ionicons>['name']
          const iconMap: Record<string, [IoniconsName, IoniconsName]> = {
            Home: ['home', 'home-outline'],
            Search: ['search', 'search-outline'],
            Bookings: ['calendar', 'calendar-outline'],
            Pets: ['paw', 'paw-outline'],
            Profile: ['person', 'person-outline'],
          }
          const [active, inactive] = iconMap[route.name] ?? ['help-circle', 'help-circle-outline']
          return (
            <View style={{ width: 37, height: 29, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? colors.primary : 'transparent' }}>
              <Ionicons name={focused ? active : inactive} size={20} color={focused ? colors.onPrimary : color} />
            </View>
          )
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeTab} />
      <Tab.Screen name="Search" component={SearchTab} options={{ tabBarLabel: 'Find care' }} />
      <Tab.Screen name="Bookings" component={BookingsTab} options={{ tabBarLabel: 'Appointments' }} />
      <Tab.Screen name="Pets" component={PetsTab} />
      <Tab.Screen name="Profile" component={ProfileTab} />
    </Tab.Navigator>
  )
}

// Set default notification handler so foreground notifications show a banner.
// Guarded so a missing/misconfigured native notifications module can never throw
// at module-load time and take down app launch.
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })
} catch (e) {
  console.warn('[notifications] setNotificationHandler failed (non-fatal)', e)
}

function useNotificationNavigation(navRef: React.RefObject<NavigationContainerRef<any> | null>) {
  useEffect(() => {
    // Wrapped defensively — without a configured push backend (no
    // google-services.json) the native module may be partially available;
    // subscribing must never crash app launch.
    let sub: { remove: () => void } | undefined
    try {
      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<string, unknown>
        const nav = navRef.current
        if (!nav) return

        const screen = data?.screen as string | undefined
        const params = (data?.params ?? {}) as Record<string, unknown>

        if (screen === 'AppointmentDetail') {
          ;(nav as any).navigate('AppointmentDetail', params)
        } else if (screen === 'ConsultationRoom') {
          ;(nav as any).navigate('ConsultationRoom', params)
        } else if (screen === 'Notifications') {
          nav.navigate('Notifications' as never)
        } else if (screen === 'PaymentHistory') {
          nav.navigate('PaymentHistory' as never)
        } else {
          // Fallback — open Notifications list
          nav.navigate('Notifications' as never)
        }
      })
    } catch (e) {
      console.warn('[notifications] listener subscription failed (non-fatal)', e)
    }
    return () => sub?.remove()
  }, [navRef])
}

export default function AppNavigator() {
  const navRef = useRef<NavigationContainerRef<any>>(null)
  useNotificationNavigation(navRef)

  // Route to login whenever AuthProvider clears the session (signOut or 401)
  useEffect(() => {
    setPostSignOutNav(() => {
      // Small delay so React state flush completes before navigation
      setTimeout(() => navRef.current?.navigate('Auth.Login' as never), 50)
    })
  }, [])

  const linking = {
    prefixes: ['respaw://'],
    config: {
      screens: {
        Main: { screens: { Bookings: 'appointments' } } as any,
        VetDetail: 'vet/:vetId',
        Confirmation: 'confirmation/:appointmentUuid',
      },
    },
  }

  return (
    <AuthProvider>
      <NavigationContainer
        ref={navRef}
        linking={linking}
        theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.surface, primary: colors.primary, text: colors.text, border: colors.border, notification: colors.danger } }}
      >
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Auth.Login" component={LoginStack} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="NearbyVets" component={NearbyVetsScreen} />
          <Stack.Screen name="VetDetail" component={VetDetailStack} />
          <Stack.Screen name="Booking" component={BookingStack} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="PaymentHistory" component={PaymentHistoryStack} />
          <Stack.Screen name="PaymentDetail" component={PaymentDetailStack} />
          <Stack.Screen name="Notifications" component={NotificationsStack} />
          <Stack.Screen name="PetRecords" component={PetRecordsStack} />
          <Stack.Screen name="Confirmation" component={ConfirmationStack} />
          <Stack.Screen name="ModalityPicker" component={ModalityPickerStack} />
          <Stack.Screen name="ConsultationRoom" component={ConsultationRoomScreen} />
          <Stack.Screen name="AppointmentDetail" component={AppointmentDetailStack} />
          <Stack.Screen name="Blog" component={BlogStack} />
          <Stack.Screen name="BlogPost" component={BlogPostStack} />
          <Stack.Screen name="Prescriptions" component={PrescriptionsStack} />
          <Stack.Screen name="Subscriptions" component={SubscriptionsStack} />
          <Stack.Screen name="Chat" component={ChatStack} />
          <Stack.Screen name="Wallet" component={WalletStack} />
          <Stack.Screen name="ServerSettings" component={ServerSettingsStack} />
          <Stack.Screen name="Emergency" component={EmergencyStack} />
          <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesStack} />
          <Stack.Screen name="HelpSupport" component={HelpSupportStack} />
          <Stack.Screen name="LegalAbout" component={LegalAboutStack} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  )
}
