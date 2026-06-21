export const Routes = {
  Splash: 'Splash',
  AuthLogin: 'Auth.Login',
  Main: 'Main',
  // Stack screens
  NearbyVets: 'NearbyVets',
  VetDetail: 'VetDetail',
  Booking: 'Booking',
  Payment: 'Payment',
  PaymentHistory: 'PaymentHistory',
  PaymentDetail: 'PaymentDetail',
  Notifications: 'Notifications',
  PetRecords: 'PetRecords',
  AppointmentDetail: 'AppointmentDetail',
  BlogPost: 'BlogPost',
  Prescriptions: 'Prescriptions',
  Blog: 'Blog',
  Subscriptions: 'Subscriptions',
  Consultation: 'Consultation',
  ModalityPicker: 'ModalityPicker',
  ConsultationRoom: 'ConsultationRoom',
  Chat: 'Chat',
  ServerSettings: 'ServerSettings',
  // Tab screens
  Home: 'Home',
  Search: 'Search',
  Bookings: 'Bookings',
  Pets: 'Pets',
  Profile: 'Profile',
} as const

export type RouteName = (typeof Routes)[keyof typeof Routes]
