// Categories, Districts, and Constants for Thrief

export const CATEGORIES = [
  { id: 'clothes', name: 'Clothes', icon: '👕', subCategories: [
    { id: 'mens-tshirts', name: "Men's T-Shirts" },
    { id: 'mens-shirts', name: "Men's Shirts" },
    { id: 'mens-pants', name: "Men's Pants & Jeans" },
    { id: 'mens-jackets', name: "Men's Jackets & Hoodies" },
    { id: 'womens-tops', name: "Women's Tops & Blouses" },
    { id: 'womens-dresses', name: "Women's Dresses & Kurtas" },
    { id: 'womens-pants', name: "Women's Pants & Jeans" },
    { id: 'womens-jackets', name: "Women's Jackets & Sweaters" },
    { id: 'kids-clothing', name: "Kids' Clothing" },
    { id: 'shoes-sneakers', name: "Shoes & Sneakers" },
    { id: 'traditional', name: "Traditional & Ethnic Wear" },
    { id: 'sportswear', name: "Sportswear & Activewear" },
    { id: 'innerwear', name: "Innerwear & Loungewear" },
    { id: 'bags-wallets', name: "Bags, Wallets & Belts" },
    { id: 'watches-accessories', name: "Watches & Accessories" },
  ]},
  { id: 'electronics', name: 'Electronics', icon: '📱', subCategories: [
    { id: 'laptops', name: 'Laptops' },
    { id: 'tvs', name: 'TVs' },
    { id: 'cameras', name: 'Cameras' },
    { id: 'accessories', name: 'Accessories' },
  ]},
  { id: 'phones', name: 'Phones', icon: '📲', subCategories: [
    { id: 'android', name: 'Android' },
    { id: 'iphone', name: 'iPhone' },
  ]},
  { id: 'skincare-beauty', name: 'Skin Care & Beauty', icon: '💄', subCategories: [
    { id: 'skincare', name: 'Skincare' },
    { id: 'makeup', name: 'Makeup' },
    { id: 'haircare', name: 'Hair Care' },
    { id: 'perfumes', name: 'Perfumes' },
  ]},
  { id: 'furniture-home', name: 'Furniture & Home', icon: '🛋️', subCategories: [
    { id: 'sofas', name: 'Sofas' },
    { id: 'tables', name: 'Tables' },
    { id: 'beds', name: 'Beds' },
    { id: 'kitchen', name: 'Kitchen Items' },
  ]},
  { id: 'books-stationery', name: 'Books & Stationery', icon: '📚', subCategories: [] },
  { id: 'sports-fitness', name: 'Sports & Fitness', icon: '⚽', subCategories: [] },
  { id: 'toys-games', name: 'Toys & Games', icon: '🎮', subCategories: [] },
  { id: 'vehicles', name: 'Vehicles', icon: '🏍️', subCategories: [
    { id: 'bikes', name: 'Bikes' },
    { id: 'scooters', name: 'Scooters' },
  ]},
  { id: 'others', name: 'Others', icon: '📦', subCategories: [] },
];

export const CONDITIONS = [
  { id: 'new', label: 'New', color: 'badge-new' },
  { id: 'like-new', label: 'Like New', color: 'badge-like-new' },
  { id: 'good', label: 'Good', color: 'badge-good' },
  { id: 'fair', label: 'Fair', color: 'badge-fair' },
  { id: 'poor', label: 'Poor', color: 'badge-poor' },
];

export const NEPAL_DISTRICTS = [
  'Achham','Arghakhanchi','Baglung','Baitadi','Bajhang','Bajura','Banke',
  'Bara','Bardiya','Bhaktapur','Bhojpur','Chitwan','Dadeldhura','Dailekh',
  'Dang','Darchula','Dhading','Dhankuta','Dhanusha','Dolakha','Dolpa','Doti',
  'Eastern Rukum','Gorkha','Gulmi','Humla','Ilam','Jajarkot','Jhapa',
  'Jumla','Kailali','Kalikot','Kanchanpur','Kapilvastu','Kaski','Kathmandu',
  'Kavrepalanchok','Khotang','Lalitpur','Lamjung','Mahottari','Makwanpur',
  'Manang','Morang','Mugu','Mustang','Myagdi','Nawalpur','Nuwakot',
  'Okhaldhunga','Palpa','Panchthar','Parasi','Parbat','Parsa','Pyuthan',
  'Ramechhap','Rasuwa','Rautahat','Rolpa','Rupandehi','Salyan',
  'Sankhuwasabha','Saptari','Sarlahi','Sindhuli','Sindhupalchok',
  'Siraha','Solukhumbu','Sunsari','Surkhet','Syangja','Tanahun',
  'Taplejung','Terhathum','Udayapur','Western Rukum'
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

export const formatPrice = (price) => {
  return `Rs ${Number(price).toLocaleString('en-NP')}`;
};

export const getConditionBadge = (condition) => {
  return CONDITIONS.find(c => c.id === condition) || CONDITIONS[2];
};

export const getCategoryName = (categoryId) => {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  return cat ? cat.name : categoryId;
};

export const timeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
