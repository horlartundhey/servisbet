
export const mockBusinesses = [
  {
    id: '1',
    name: 'The Garden Bistro',
    category: 'Restaurant',
    rating: 4.8,
    reviewCount: 1247,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&fit=crop',
    description: 'Farm-to-table dining experience with seasonal menus and organic ingredients sourced from local farmers.'
  },
  {
    id: '2',
    name: 'TechFix Pro',
    category: 'Electronics Repair',
    rating: 4.9,
    reviewCount: 892,
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=300&fit=crop',
    description: 'Professional electronics repair service specializing in smartphones, tablets, and laptop repairs with warranty.'
  },
  {
    id: '3',
    name: 'Sunset Spa & Wellness',
    category: 'Spa & Beauty',
    rating: 4.7,
    reviewCount: 654,
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500&h=300&fit=crop',
    description: 'Luxury spa offering massage therapy, facial treatments, and wellness packages in a serene environment.'
  },
  {
    id: '4',
    name: 'Urban Coffee Roasters',
    category: 'Coffee Shop',
    rating: 4.6,
    reviewCount: 2103,
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&h=300&fit=crop',
    description: 'Artisan coffee shop with freshly roasted beans, specialty drinks, and cozy atmosphere for work or relaxation.'
  },
  {
    id: '5',
    name: 'Elite Fitness Studio',
    category: 'Fitness & Gym',
    rating: 4.8,
    reviewCount: 756,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop',
    description: 'Modern fitness studio with personal training, group classes, and state-of-the-art equipment.'
  },
  {
    id: '6',
    name: 'Bloom & Petal Florist',
    category: 'Florist',
    rating: 4.9,
    reviewCount: 423,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&h=300&fit=crop',
    description: 'Creative floral arrangements for weddings, events, and everyday occasions with fresh seasonal flowers.'
  }
];

export const mockReviews = [
  {
    id: '1',
    customerName: 'Sarah Johnson',
    customerAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    date: '2 days ago',
    title: 'Absolutely incredible experience!',
    content: 'The Garden Bistro exceeded all expectations. The ambiance was perfect, the staff was attentive, and every dish was a masterpiece. The seasonal menu really showcases the chef\'s creativity.',
    images: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=300&h=300&fit=crop'
    ],
    businessResponse: 'Thank you so much, Sarah! We\'re thrilled you enjoyed your dining experience. Our chef will be delighted to hear your kind words about the seasonal menu. We look forward to welcoming you back soon!'
  },
  {
    id: '2',
    customerName: 'Michael Chen',
    customerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    date: '1 week ago',
    title: 'Fast and professional repair service',
    content: 'TechFix Pro repaired my laptop screen quickly and professionally. The pricing was fair, and they explained everything clearly. Highly recommend for any electronics issues!',
    images: [
      'https://images.unsplash.com/photo-1588200908342-23b585c03e26?w=300&h=300&fit=crop'
    ]
  },
  {
    id: '3',
    customerName: 'Emma Rodriguez',
    customerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    rating: 4,
    date: '3 days ago',
    title: 'Relaxing spa day',
    content: 'Had a wonderful massage and facial at Sunset Spa. The facilities are beautiful and the staff is very professional. Only minor issue was the waiting area could be quieter.',
    images: [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1596178060810-7d4fbc1d5d15?w=300&h=300&fit=crop'
    ],
    businessResponse: 'Hi Emma, thank you for your review! We\'re glad you enjoyed your treatments. We\'ve noted your feedback about the waiting area and are working on creating an even more peaceful environment.'
  }
];
