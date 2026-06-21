export type Vet = {
  id: string;
  name: string;
  clinic: string;
  specialization: string;
  rating: number;
  reviews: number;
  distance: string;
  chips: string[];
  fee: string;
  phone: string;
};

export type Pet = {
  id: string;
  name: string;
  species: string;
  emoji: string;
  reminder: string;
  medication: string;
};

export type Appointment = {
  id: string;
  title: string;
  vet: string;
  when: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  pet: string;
};

export type Article = {
  id: string;
  title: string;
  category: string;
  readTime: string;
};

export const quickActions = [
  { id: 'consult', label: 'Consult', emoji: '💬', note: 'Start now' },
  { id: 'book', label: 'Book Visit', emoji: '📅', note: 'Clinic/online' },
  { id: 'records', label: 'Records', emoji: '🗂️', note: 'Prescriptions' },
];

export const vetHighlights: Vet[] = [
  {
    id: 'vet-1',
    name: 'Dr. Maya Patel',
    clinic: 'City Paws Clinic',
    specialization: 'Dermatology',
    rating: 4.9,
    reviews: 142,
    distance: '1.2 km away',
    chips: ['Open now', 'Home visit', 'Online consult'],
    fee: '₹699',
    phone: '+91 98765 43210',
  },
  {
    id: 'vet-2',
    name: 'Dr. Arjun Mehta',
    clinic: 'PawCare Studio',
    specialization: 'Emergency',
    rating: 4.8,
    reviews: 98,
    distance: '2.4 km away',
    chips: ['24/7', 'Online consult'],
    fee: '₹899',
    phone: '+91 98765 43211',
  },
  {
    id: 'vet-3',
    name: 'Dr. Sana Khan',
    clinic: 'MediPet House',
    specialization: 'Nutrition',
    rating: 4.7,
    reviews: 76,
    distance: '3.1 km away',
    chips: ['Available now', 'Book visit'],
    fee: '₹599',
    phone: '+91 98765 43212',
  },
];

export const pets: Pet[] = [
  {
    id: 'pet-1',
    name: 'Bingo',
    species: 'Golden Retriever',
    emoji: '🐶',
    reminder: 'Vaccination follow-up due today',
    medication: 'Amoxicillin - 2 doses left',
  },
  {
    id: 'pet-2',
    name: 'Mochi',
    species: 'British Shorthair',
    emoji: '🐱',
    reminder: 'Dental cleaning next week',
    medication: 'Vitamin paste - morning dose',
  },
];

export const appointments: Appointment[] = [
  {
    id: 'appt-1',
    title: 'Vaccination follow-up',
    vet: 'Dr. Maya Patel',
    when: 'Today, 3:30 PM',
    status: 'confirmed',
    pet: 'Bingo',
  },
  {
    id: 'appt-2',
    title: 'Nutrition consult',
    vet: 'Dr. Arjun Mehta',
    when: 'Fri, 11:00 AM',
    status: 'pending',
    pet: 'Mochi',
  },
  {
    id: 'appt-3',
    title: 'Home visit check-in',
    vet: 'Dr. Sana Khan',
    when: 'Last week',
    status: 'completed',
    pet: 'Bingo',
  },
];

export const articles: Article[] = [
  { id: 'art-1', title: 'Hydration during summer', category: 'Wellness', readTime: '3 min read' },
  { id: 'art-2', title: 'Spotting early warning signs', category: 'Emergency', readTime: '4 min read' },
  { id: 'art-3', title: 'Making medication time calmer', category: 'Routine', readTime: '5 min read' },
];

export const filters = ['Distance', 'Emergency', 'Available now', 'Rating 4.5+', 'Home visit', 'Online'];

export const profileRows = [
  { label: 'Saved vets', value: '6' },
  { label: 'Subscriptions', value: 'Premium plan' },
  { label: 'Notification alerts', value: 'On' },
  { label: 'Support', value: '24/7 help center' },
];