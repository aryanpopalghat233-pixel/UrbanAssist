export interface Service {
  id: string;
  name: string;
  icon: string;
  category: string;
  price: number;
  description: string;
  longDescription: string;
  highlights: string[];
}

export interface Booking {
  _id?: string;
  service: string;
  category: string;
  date: string;
  status: string;
  price: number;
  workerName?: string;
  rating?: number;
  cancellationReason?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  createdAt?: string;
}

export const SERVICES: Service[] = [
  { 
    id: '1', 
    name: 'Salon for Women', 
    icon: 'Scissors', 
    category: 'Salon', 
    price: 499, 
    description: 'Premium facial and hair services',
    longDescription: 'Get a salon-like experience at the comfort of your home. Our certified beauticians use premium products and maintain the highest hygiene standards for all facial and hair treatments.',
    highlights: ['Certified Beauticians', 'Disposable Kits', 'Premium Products', 'Mess-free Experience']
  },
  { 
    id: '2', 
    name: 'Manicure & Pedicure', 
    icon: 'Sparkles', 
    category: 'Salon', 
    price: 799, 
    description: 'Luxe hand and nail care',
    longDescription: 'Pamper your hands and feet with our relaxing manicure and pedicure services. We provide deep cleaning, exfoliation, and a soothing massage using skin-friendly ingredients.',
    highlights: ['Deep Exfoliation', 'Skin-safe Ingredients', 'Relaxing Massage', 'Single-use Kits']
  },
  { 
    id: '3', 
    name: 'AC Repair & Service', 
    icon: 'Wind', 
    category: 'Appliances', 
    price: 599, 
    description: 'Fast and reliable cooling repair',
    longDescription: 'Ensure optimal cooling and energy efficiency for your air conditioner. Our experts provide comprehensive servicing, gas charging, and repair for all AC models.',
    highlights: ['90-day Warranty', 'Genuine Spare Parts', 'Service History Check', 'No-mess Cleanup']
  },
  { 
    id: '4', 
    name: 'Home Cleaning', 
    icon: 'Home', 
    category: 'Cleaning', 
    price: 1299, 
    description: 'Deep cleaning for every corner',
    longDescription: 'A complete deep cleaning solution for your home. Our professionals use machine-based techniques and eco-friendly chemicals to ensure your home is spotless and sanitized.',
    highlights: ['Eco-friendly Chemicals', 'Industrial Grade Machines', 'Verified Personnel', '100% Satisfaction Guarantee']
  },
  { 
    id: '5', 
    name: 'Pest Control', 
    icon: 'Bug', 
    category: 'Cleaning', 
    price: 899, 
    description: 'Eco-friendly pest eradication',
    longDescription: 'Safe and effective pest control services for your home and office. We target cockroaches, termites, bed bugs, and more using ODORLESS and government-approved chemicals.',
    highlights: ['Odorless Treatment', 'Safe for Pets & Kids', 'Warranty Included', 'Targeted Eradication']
  },
  { 
    id: '6', 
    name: 'Electricians', 
    icon: 'Zap', 
    category: 'Maintenance', 
    price: 299, 
    description: 'Safe electrical repairs',
    longDescription: 'Expert electrical solutions for all your needs, from simple switch repairs to complex wiring installations. Our electricians prioritize safety and precision.',
    highlights: ['Safety-first Approach', 'Available 24/7', 'Transparent Pricing', 'Certified Professionals']
  },
  { 
    id: '7', 
    name: 'Plumbers', 
    icon: 'Droplets', 
    category: 'Maintenance', 
    price: 349, 
    description: 'Leak fixes and installations',
    longDescription: 'Reliable plumbing services for leak repairs, pipe installations, and bathroom fitting maintenance. We provide long-lasting solutions to all plumbing issues.',
    highlights: ['Quick Turnaround', 'Expert Fitting', 'Durability Focus', 'Emergency Support']
  },
  { 
    id: '8', 
    name: 'Painters', 
    icon: 'Palette', 
    category: 'Home Projects', 
    price: 4999, 
    description: 'Professional home wall painting',
    longDescription: 'Transform your living space with our premium painting services. We offer color consultation, surface preparation, and high-quality finishing for an exquisite look.',
    highlights: ['On-time Completion', 'Furniture Protection', 'Color Consultation', 'Lustre Finishing']
  },
];

export const CATEGORIES = ['All', 'Salon', 'Appliances', 'Cleaning', 'Maintenance', 'Home Projects'];
