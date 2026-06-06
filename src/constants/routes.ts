export const Routes = {
  Splash: 'Splash',
  AuthLogin: 'Auth.Login',
  Main: 'Main',
  // Stack screens
  VetDetail: 'VetDetail',
  Booking: 'Booking',
  Payment: 'Payment',
  Notifications: 'Notifications',
  SOS: 'SOS',
  PetRecords: 'PetRecords',
  Blog: 'Blog',
  Subscriptions: 'Subscriptions',
  Consultation: 'Consultation',
  Chat: 'Chat',
  // Tab screens
  Home: 'Home',
  Search: 'Search',
  Bookings: 'Bookings',
  Pets: 'Pets',
  Profile: 'Profile',
} as const

export type RouteName = (typeof Routes)[keyof typeof Routes]
