import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import SplashScreen from '../screens/Splash/SplashScreen'
import LoginScreen from '../screens/Auth/LoginScreen'
import HomeScreen from '../screens/Home/HomeScreen'
import SearchScreen from '../screens/Search/SearchScreen'
import PetsScreen from '../screens/Pets/PetsScreen'
import PetRecordsScreen from '../screens/Pets/PetRecordsScreen'
import AppointmentsScreen from '../screens/Appointments/AppointmentsScreen'
import ProfileScreen from '../screens/Profile/ProfileScreen'
import VetDetailScreen from '../screens/Vet/VetDetailScreen'
import BookingScreen from '../screens/Booking/BookingScreen'
import PaymentScreen from '../screens/Payment/PaymentScreen'
import NotificationsScreen from '../screens/Notifications/NotificationsScreen'
import SosScreen from '../screens/SOS/SosScreen'
import ConfirmationScreen from '../screens/Confirmation/ConfirmationScreen'
import ModalityPickerScreen from '../screens/Consultation/ModalityPickerScreen'
import ConsultationRoomScreen from '../screens/Consultation/ConsultationRoomScreen'
import AppointmentDetailScreen from '../screens/Appointments/AppointmentDetailScreen'
import BlogScreen from '../screens/Blog/BlogScreen'
import BlogPostScreen from '../screens/Blog/BlogPostScreen'
import PrescriptionsScreen from '../screens/Pets/PrescriptionsScreen'
import SubscriptionPlansScreen from '../screens/Subscription/SubscriptionPlansScreen'
import ChatScreen from '../screens/Chat/ChatScreen'
import { AuthProvider } from '../contexts/AuthProvider'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ff6b2c',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: { backgroundColor: '#fff7f1', borderTopColor: '#f4e3d5' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Bookings" component={AppointmentsScreen} />
      <Tab.Screen name="Pets" component={PetsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
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
      <NavigationContainer linking={linking}>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Auth.Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="VetDetail" component={VetDetailScreen} />
          <Stack.Screen name="Booking" component={BookingScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="SOS" component={SosScreen} />
          <Stack.Screen name="PetRecords" component={PetRecordsScreen} />
          <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
          <Stack.Screen name="ModalityPicker" component={ModalityPickerScreen} />
          <Stack.Screen name="ConsultationRoom" component={ConsultationRoomScreen} />
          <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
          <Stack.Screen name="Blog" component={BlogScreen} />
          <Stack.Screen name="BlogPost" component={BlogPostScreen} />
          <Stack.Screen name="Prescriptions" component={PrescriptionsScreen} />
          <Stack.Screen name="Subscriptions" component={SubscriptionPlansScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  )
}
