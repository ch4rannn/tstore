// Input validators
export function validateEmail(email) {
  return /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
}

export function validatePhone(phone) {
  return /^(97|98)\d{8}$/.test(phone);
}

export function validatePassword(password) {
  return password && password.length >= 6;
}

export function validateRole(role) {
  return ['buyer', 'seller'].includes(role);
}

export function validateCategory(category) {
  return [
    'clothes', 'electronics', 'phones', 'skincare-beauty', 'furniture-home',
    'books-stationery', 'sports-fitness', 'toys-games', 'vehicles', 'others'
  ].includes(category);
}

export function validateCondition(condition) {
  return ['new', 'like-new', 'good', 'fair', 'poor'].includes(condition);
}

export function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim();
}

export function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

// Nepal districts
export const NEPAL_DISTRICTS = [
  'Achham','Arghakhanchi','Baglung','Baitadi','Bajhang','Bajura','Banke',
  'Bara','Bardiya','Bhaktapur','Bhojpur','Chitwan','Dadeldhura','Dailekh',
  'Dang','Darchula','Dhading','Dhankuta','Dhanusha','Dolakha','Dolpa','Doti',
  'Eastern Rukum','Gorkha','Gulmi','Humla','Ilam','Jajarkot','Jhapa',
  'Jumla','Kailali','Kalikot','Kanchanpur','Kapilvastu','Kaski',
  'Kavrepalanchok','Khotang','Lalitpur','Lamjung','Mahottari','Makwanpur',
  'Manang','Morang','Mugu','Mustang','Myagdi','Nawalpur','Nuwakot',
  'Okhaldhunga','Palpa','Panchthar','Parasi','Parbat','Parsa','Pyuthan',
  'Ramechhap','Rasuwa','Rautahat','Rolpa','Rupandehi','Salyan',
  'Sankhuwasabha','Saptari','Sarlahi','Sindhuli','Sindhupalchok',
  'Siraha','Solukhumbu','Sunsari','Surkhet','Syangja','Tanahun',
  'Taplejung','Terhathum','Udayapur','Western Rukum','Kathmandu'
];
