/** Static product catalog for the Myntra-style demo. */

export interface Product {
  id: string
  brand: string
  name: string
  price: number
  mrp: number
  discount: number
  category: 'upper_body' | 'lower_body' | 'dresses'
  image: string
  sizes: string[]
  rating: number
  ratingCount: number
  description: string
  details: string[]
}

export const PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    brand: 'Roadster',
    name: 'Men Solid Round Neck Pure Cotton T-Shirt',
    price: 599,
    mrp: 999,
    discount: 40,
    category: 'upper_body',
    image: '/garments/product-1.jpg',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    rating: 4.3,
    ratingCount: 12847,
    description:
      'Black solid T-shirt, has a round neck, and short sleeves. Premium cotton fabric for all-day comfort.',
    details: [
      'Pure Cotton',
      'Regular Fit',
      'Machine Washable',
      'Pattern: Solid',
      'Sleeve: Short Sleeves',
      'Neck: Round Neck',
    ],
  },
  {
    id: 'prod-2',
    brand: 'Levis',
    name: 'Men Trucker Denim Jacket',
    price: 1499,
    mrp: 2499,
    discount: 40,
    category: 'upper_body',
    image: '/garments/product-2.jpg',
    sizes: ['S', 'M', 'L', 'XL'],
    rating: 4.5,
    ratingCount: 3421,
    description:
      'Blue denim jacket with a classic trucker silhouette. Button closure, two chest flap pockets.',
    details: [
      '100% Cotton Denim',
      'Regular Fit',
      'Button Closure',
      'Pattern: Solid',
      'Sleeve: Long Sleeves',
      'Collar: Spread Collar',
    ],
  },
  {
    id: 'prod-3',
    brand: 'FabIndia',
    name: 'Men Printed Cotton Kurta',
    price: 899,
    mrp: 1499,
    discount: 40,
    category: 'upper_body',
    image: '/garments/product-3.jpg',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    rating: 4.1,
    ratingCount: 2156,
    description:
      'Red printed kurta crafted in pure cotton. Mandarin collar with a button placket. Perfect for festive occasions.',
    details: [
      'Pure Cotton',
      'Regular Fit',
      'Machine Washable',
      'Pattern: Printed',
      'Sleeve: Full Sleeves',
      'Collar: Mandarin',
    ],
  },
  {
    id: 'prod-4',
    brand: 'Arrow',
    name: 'Men Solid Formal Shirt',
    price: 799,
    mrp: 1299,
    discount: 38,
    category: 'upper_body',
    image: '/garments/product-4.jpg',
    sizes: ['38', '39', '40', '42', '44'],
    rating: 4.4,
    ratingCount: 5892,
    description:
      'White solid formal shirt with a slim fit cut. Spread collar, full button placket, perfect for office wear.',
    details: [
      'Cotton Blend',
      'Slim Fit',
      'Machine Washable',
      'Pattern: Solid',
      'Sleeve: Full Sleeves',
      'Collar: Spread',
    ],
  },
]
