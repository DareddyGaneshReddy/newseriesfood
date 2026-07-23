// Real restaurant photography (Unsplash source URLs) mapped by dish keyword.
// Warm lighting, ceramic plates, wooden tables — no AI-generated food.
const map: Record<string, string> = {
  "mini meals": "photo-1567337710282-00832b415979",
  "full veg meals": "photo-1567337710282-00832b415979",
  "curd rice": "photo-1546833998-877b37c2e5c6",
  "lemon rice": "photo-1596797038530-2c107229654b",
  "tomato rice": "photo-1596797038530-2c107229654b",
  "jeera rice": "photo-1596797038530-2c107229654b",
  "veg biryani": "photo-1631452180519-c014fe946bc7",
  "egg biryani": "photo-1631452180519-c014fe946bc7",
  "chicken biryani": "photo-1633945274309-2c16c9673e5b",
  "mutton biryani": "photo-1589302168068-964664d93dc0",
  "plain roti": "photo-1626074353765-517a681e40be",
  "butter roti": "photo-1626074353765-517a681e40be",
  "plain naan": "photo-1610057099443-fde8c4d50f91",
  "butter naan": "photo-1610057099443-fde8c4d50f91",
  "dal fry": "photo-1546833998-877b37c2e5c6",
  "dal tadka": "photo-1546833998-877b37c2e5c6",
  "mixed veg curry": "photo-1585937421612-70a008356fbe",
  "paneer butter masala": "photo-1631452180519-c014fe946bc7",
  "kadai paneer": "photo-1567188040759-fb8a883dc6d8",
  "palak paneer": "photo-1585937421612-70a008356fbe",
  "mushroom masala": "photo-1567188040759-fb8a883dc6d8",
  "chicken meals": "photo-1633945274309-2c16c9673e5b",
  "chicken curry": "photo-1604908176997-125f25cc6f3d",
  "butter chicken": "photo-1588166524941-3bf61a9c41db",
  "kadai chicken": "photo-1604908176997-125f25cc6f3d",
  "chicken fry": "photo-1626082927389-6cd097cdc6ec",
  "chicken 65": "photo-1626082927389-6cd097cdc6ec",
  "mutton curry": "photo-1589302168068-964664d93dc0",
  "mutton fry": "photo-1589302168068-964664d93dc0",
  "fish curry": "photo-1626509653291-18d9a934b9db",
  "fish fry": "photo-1626509653291-18d9a934b9db",
  "egg curry": "photo-1607301405390-d831c242f59b",
  "omelette": "photo-1607301405390-d831c242f59b",
  "veg fried rice": "photo-1603133872878-684f208fb84b",
  "veg noodles": "photo-1585032226651-759b368d7246",
  "gobi manchurian": "photo-1626074353765-517a681e40be",
  "veg manchurian": "photo-1626074353765-517a681e40be",
  "chilli paneer": "photo-1567188040759-fb8a883dc6d8",
  "paneer fried rice": "photo-1603133872878-684f208fb84b",
  "egg fried rice": "photo-1603133872878-684f208fb84b",
  "chicken fried rice": "photo-1603133872878-684f208fb84b",
  "egg noodles": "photo-1585032226651-759b368d7246",
  "chicken noodles": "photo-1585032226651-759b368d7246",
  "chicken manchurian": "photo-1585032226651-759b368d7246",
  "chilli chicken": "photo-1626082927389-6cd097cdc6ec",
  "dragon chicken": "photo-1626082927389-6cd097cdc6ec",
  "chicken lollipop": "photo-1626082927389-6cd097cdc6ec",
  "mineral water": "photo-1548839140-29a749e1cf4d",
  "soft drink": "photo-1622483767028-3f66f32aef97",
  "buttermilk": "photo-1571091718767-18b5b1457add",
  "fresh lime soda": "photo-1556679343-c7306c1976bc",
  "tea": "photo-1571934811356-5cc061b6821f",
  "coffee": "photo-1509042239860-f550ce710b93",
};

const fallback = "photo-1567337710282-00832b415979";

export function imageFor(name: string): string {
  const key = name.toLowerCase();
  let hit = map[key];
  if (!hit) {
    for (const k of Object.keys(map)) {
      if (key.includes(k)) { hit = map[k]; break; }
    }
  }
  const id = hit ?? fallback;
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;
}
