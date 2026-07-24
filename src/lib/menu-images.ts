// Curated food photography — each dish name is mapped to a hand-picked
// Unsplash photo that visually matches. Longer keys are checked first so
// "chicken biryani" wins over "chicken".
const map: Record<string, string> = {
  // Chef combos (compound names first)
  "chicken biryani + soft drink": "photo-1563379091339-03b21ab4a4f8",
  "veg meals + buttermilk": "photo-1567337710282-00832b415979",
  "chicken fried rice + chilli chicken": "photo-1626082927389-6cd097cdc6ec",

  // Biryani
  "chicken biryani": "photo-1563379091339-03b21ab4a4f8",
  "mutton biryani": "photo-1589302168068-964664d93dc0",
  "egg biryani": "photo-1631452180519-c014fe946bc7",
  "veg biryani": "photo-1596797038530-2c107229654b",

  // Meals / rice
  "mini meals": "photo-1567337710282-00832b415979",
  "full veg meals": "photo-1567337710282-00832b415979",
  "chicken meals": "photo-1567337710282-00832b415979",
  "curd rice": "photo-1567337710282-00832b415979",
  "lemon rice": "photo-1596797038530-2c107229654b",
  "tomato rice": "photo-1596797038530-2c107229654b",
  "jeera rice": "photo-1596797038530-2c107229654b",

  // Breads
  "butter naan": "photo-1610057099443-fde8c4d50f91",
  "plain naan": "photo-1610057099443-fde8c4d50f91",
  "butter roti": "photo-1626074353765-517a681e40be",
  "plain roti": "photo-1626074353765-517a681e40be",

  // Veg curries
  "paneer butter masala": "photo-1631452180519-c014fe946bc7",
  "kadai paneer": "photo-1567188040759-fb8a883dc6d8",
  "palak paneer": "photo-1585937421612-70a008356fbe",
  "chilli paneer": "photo-1567188040759-fb8a883dc6d8",
  "mushroom masala": "photo-1585937421612-70a008356fbe",
  "mixed veg curry": "photo-1585937421612-70a008356fbe",
  "dal tadka": "photo-1546833998-877b37c2e5c6",
  "dal fry": "photo-1546833998-877b37c2e5c6",

  // Non-veg curries & fries
  "butter chicken": "photo-1588166524941-3bf61a9c41db",
  "kadai chicken": "photo-1604908176997-125f25cc6f3d",
  "chicken curry": "photo-1604908176997-125f25cc6f3d",
  "chicken 65": "photo-1626082927389-6cd097cdc6ec",
  "chicken fry": "photo-1626082927389-6cd097cdc6ec",
  "chilli chicken": "photo-1626082927389-6cd097cdc6ec",
  "dragon chicken": "photo-1626082927389-6cd097cdc6ec",
  "chicken lollipop": "photo-1626082927389-6cd097cdc6ec",
  "mutton curry": "photo-1589302168068-964664d93dc0",
  "mutton fry": "photo-1589302168068-964664d93dc0",
  "fish curry": "photo-1626509653291-18d9a934b9db",
  "fish fry": "photo-1626509653291-18d9a934b9db",
  "egg curry": "photo-1607301405390-d831c242f59b",
  "omelette": "photo-1607301405390-d831c242f59b",

  // Chinese
  "veg fried rice": "photo-1603133872878-684f208fb84b",
  "paneer fried rice": "photo-1603133872878-684f208fb84b",
  "egg fried rice": "photo-1603133872878-684f208fb84b",
  "chicken fried rice": "photo-1603133872878-684f208fb84b",
  "veg noodles": "photo-1552611052-33e04de081de",
  "egg noodles": "photo-1552611052-33e04de081de",
  "chicken noodles": "photo-1552611052-33e04de081de",
  "gobi manchurian": "photo-1626200419199-391ae4be7a41",
  "veg manchurian": "photo-1626200419199-391ae4be7a41",
  "chicken manchurian": "photo-1552611052-33e04de081de",

  // Beverages — each is its own dedicated photo
  "mineral water": "photo-1616118132534-381148898bb4",
  "soft drink": "photo-1554866585-cd94860890b7",
  "buttermilk": "photo-1628088062854-d1870b4553da",
  "fresh lime soda": "photo-1621263764928-df1444c5e859",
  "tea": "photo-1571934811356-5cc061b6821f",
  "coffee": "photo-1509042239860-f550ce710b93",
};

const FALLBACK_ID = "photo-1567337710282-00832b415979";
export const FALLBACK_IMAGE = `https://images.unsplash.com/${FALLBACK_ID}?auto=format&fit=crop&w=900&q=80`;

// Longer, more specific keys should match first.
const sortedKeys = Object.keys(map).sort((a, b) => b.length - a.length);

export function imageFor(name: string): string {
  const key = name.toLowerCase().trim();
  let hit = map[key];
  if (!hit) {
    for (const k of sortedKeys) {
      if (key.includes(k)) { hit = map[k]; break; }
    }
  }
  const id = hit ?? FALLBACK_ID;
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;
}
