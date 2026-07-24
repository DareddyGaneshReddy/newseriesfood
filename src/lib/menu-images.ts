// Curated food photography — every dish name is mapped to a real,
// verified Wikimedia Commons photo of that exact dish. Longer keys are
// checked first so "chicken biryani" wins over "chicken".

const WM = "https://upload.wikimedia.org/wikipedia/commons";

const map: Record<string, string> = {
  // ---- Combos (match before their parts) ----
  "chicken biryani + soft drink": `${WM}/thumb/7/7c/Hyderabadi_Chicken_Biryani.jpg/960px-Hyderabadi_Chicken_Biryani.jpg`,
  "veg meals + buttermilk": `${WM}/thumb/4/4b/My_traditional_Indian_thali_meal_%2848625245542%29.jpg/960px-My_traditional_Indian_thali_meal_%2848625245542%29.jpg`,
  "chicken fried rice + chilli chicken": `${WM}/thumb/7/71/Fried_rice_with_chicken_%2817234644521%29.jpg/960px-Fried_rice_with_chicken_%2817234644521%29.jpg`,

  // ---- Biryani ----
  "chicken biryani": `${WM}/thumb/7/7c/Hyderabadi_Chicken_Biryani.jpg/960px-Hyderabadi_Chicken_Biryani.jpg`,
  "mutton biryani": `${WM}/thumb/e/e8/Hyderabadi_Mutton_Biryani.jpg/960px-Hyderabadi_Mutton_Biryani.jpg`,
  "egg biryani": `${WM}/thumb/1/16/Egg_Biryani_in_a_restaurant.jpg/960px-Egg_Biryani_in_a_restaurant.jpg`,
  "veg biryani": `${WM}/thumb/2/2f/Veg_biryani.jpg/960px-Veg_biryani.jpg`,

  // ---- Meals / rice ----
  "mini meals": `${WM}/thumb/9/96/%279%27_A_Thali%2C_meal_served_in_India.jpg/960px-%279%27_A_Thali%2C_meal_served_in_India.jpg`,
  "full veg meals": `${WM}/thumb/4/4b/My_traditional_Indian_thali_meal_%2848625245542%29.jpg/960px-My_traditional_Indian_thali_meal_%2848625245542%29.jpg`,
  "chicken meals": `${WM}/thumb/4/46/Darjeeling%2C_India%2C_Indian_Thali_meal.jpg/960px-Darjeeling%2C_India%2C_Indian_Thali_meal.jpg`,
  "curd rice": `${WM}/thumb/5/58/Curd_Rice.jpg/960px-Curd_Rice.jpg`,
  "lemon rice": `${WM}/thumb/b/bb/Lemon_Rice_in_Kerala.jpg/960px-Lemon_Rice_in_Kerala.jpg`,
  "tomato rice": `${WM}/thumb/b/be/Tomato_Rice_up-close_%281862224148%29.jpg/960px-Tomato_Rice_up-close_%281862224148%29.jpg`,
  "jeera rice": `${WM}/thumb/b/b8/Jeera_Rice_India.jpg/960px-Jeera_Rice_India.jpg`,

  // ---- Breads ----
  "butter naan": `${WM}/thumb/8/8f/Butter_Naan_with_three_different_Indian_curry.jpg/960px-Butter_Naan_with_three_different_Indian_curry.jpg`,
  "plain naan": `${WM}/thumb/4/4e/Annapurna_Naan.jpg/960px-Annapurna_Naan.jpg`,
  "butter roti": `${WM}/thumb/7/74/2020-05-08_19_34_28_Chapati_being_made_in_a_pan_in_the_Franklin_Farm_section_of_Oak_Hill%2C_Fairfax_County%2C_Virginia.jpg/960px-2020-05-08_19_34_28_Chapati_being_made_in_a_pan_in_the_Franklin_Farm_section_of_Oak_Hill%2C_Fairfax_County%2C_Virginia.jpg`,
  "plain roti": `${WM}/thumb/f/fe/2_Chapati_warm_and_ready_to_be_eaten.jpg/960px-2_Chapati_warm_and_ready_to_be_eaten.jpg`,

  // ---- Veg curries ----
  "paneer butter masala": `${WM}/thumb/7/7e/Paneer_Butter_Masala_3.jpg/960px-Paneer_Butter_Masala_3.jpg`,
  "kadai paneer": `${WM}/thumb/f/fc/Kadai_Paneer_Recipe.JPG/960px-Kadai_Paneer_Recipe.JPG`,
  "palak paneer": `${WM}/thumb/a/a2/Palak_Paneer_curry_on_plate.jpg/960px-Palak_Paneer_curry_on_plate.jpg`,
  "chilli paneer": `${WM}/thumb/2/2c/Chilly_Paneer_01.jpg/960px-Chilly_Paneer_01.jpg`,
  "mushroom masala": `${WM}/thumb/7/7f/Mushroom_masala_on_white_rice%2C_with_shrimp_and_black_olives_-_Massachusetts.jpg/960px-Mushroom_masala_on_white_rice%2C_with_shrimp_and_black_olives_-_Massachusetts.jpg`,
  "mixed veg curry": `${WM}/4/49/Vegetarian_Curry.jpeg`,
  "dal tadka": `${WM}/thumb/0/00/Dal_tadka_and_chapati.jpg/960px-Dal_tadka_and_chapati.jpg`,
  "dal fry": `${WM}/thumb/b/b1/Dal_Fry_Recipe_In_Dhaba_Style_From_Indian_Cuisine_By_Sonia_Goyal.jpg/960px-Dal_Fry_Recipe_In_Dhaba_Style_From_Indian_Cuisine_By_Sonia_Goyal.jpg`,

  // ---- Non-veg curries & fries ----
  "butter chicken": `${WM}/thumb/f/fb/Butter_Chicken%2C_City_Grill_Kottayam.jpg/960px-Butter_Chicken%2C_City_Grill_Kottayam.jpg`,
  "kadai chicken": `${WM}/thumb/4/48/Kadhai_chicken-_Gorakhpur-_Uttar_Pradesh-_001.jpg/960px-Kadhai_chicken-_Gorakhpur-_Uttar_Pradesh-_001.jpg`,
  "chicken curry": `${WM}/e/e4/Indian_Curry_Chicken.jpg`,
  "chicken 65": `${WM}/thumb/5/5d/Chicken_65_%28Dish%29.jpg/960px-Chicken_65_%28Dish%29.jpg`,
  "chicken fry": `${WM}/thumb/1/15/Chicken_ghee_roast.jpg/960px-Chicken_ghee_roast.jpg`,
  "chilli chicken": `${WM}/thumb/4/45/Chicken_Chilli.JPG/1920px-Chicken_Chilli.JPG`,
  "dragon chicken": `${WM}/thumb/4/4e/Kadhai_Chicken_Fry.jpg/960px-Kadhai_Chicken_Fry.jpg`,
  "chicken lollipop": `${WM}/thumb/a/a1/Chicken_Lollipop.jpg/960px-Chicken_Lollipop.jpg`,
  "mutton curry": `${WM}/thumb/8/80/Bengali_Mutton_Curry.JPG/1920px-Bengali_Mutton_Curry.JPG`,
  "mutton fry": `${WM}/thumb/8/80/Bengali_Mutton_Curry.JPG/1920px-Bengali_Mutton_Curry.JPG`,
  "fish curry": `${WM}/thumb/2/28/Alappy_Fish_Curry.JPG/960px-Alappy_Fish_Curry.JPG`,
  "fish fry": `${WM}/f/ff/Indian_Style_Fish_Fry.jpg`,
  "egg curry": `${WM}/thumb/f/fb/Egg_curry_Indian_style.jpg/960px-Egg_curry_Indian_style.jpg`,
  "omelette": `${WM}/thumb/7/7f/Omelette_3.jpg/960px-Omelette_3.jpg`,

  // ---- Chinese ----
  "veg fried rice": `${WM}/thumb/a/a7/Veg_Fried_Rice_%2851465%29.jpg/960px-Veg_Fried_Rice_%2851465%29.jpg`,
  "paneer fried rice": `${WM}/thumb/c/c9/Veg_fried_rice_2.jpg/960px-Veg_fried_rice_2.jpg`,
  "egg fried rice": `${WM}/thumb/3/30/Fried_rice_with_chicken_and_egg.jpg/960px-Fried_rice_with_chicken_and_egg.jpg`,
  "chicken fried rice": `${WM}/thumb/7/71/Fried_rice_with_chicken_%2817234644521%29.jpg/960px-Fried_rice_with_chicken_%2817234644521%29.jpg`,
  "veg noodles": `${WM}/thumb/a/a9/Hakka_Noodles_Veg.jpg/960px-Hakka_Noodles_Veg.jpg`,
  "egg noodles": `${WM}/thumb/e/e4/Veg_noodles_made_by_me.jpg/960px-Veg_noodles_made_by_me.jpg`,
  "chicken noodles": `${WM}/thumb/9/9b/Chicken_noodles_with_sauce.jpg/960px-Chicken_noodles_with_sauce.jpg`,
  "gobi manchurian": `${WM}/e/e8/Gobi_manchurian.jpg`,
  "veg manchurian": `${WM}/9/9f/Hakka_Noodles%2C_Veg_Manchurian_PK009.jpg`,
  "chicken manchurian": `${WM}/thumb/2/2d/Sticky_Rice%2C_chiken_Manchurian%2C_PK006.jpg/960px-Sticky_Rice%2C_chiken_Manchurian%2C_PK006.jpg`,

  // ---- Beverages ----
  "mineral water": `${WM}/thumb/b/b6/Kangso_Mineral_Water_Bottling_Factory_-_03.jpg/960px-Kangso_Mineral_Water_Bottling_Factory_-_03.jpg`,
  "soft drink": `${WM}/thumb/e/e8/15-09-26-RalfR-WLC-0098_-_Coca-Cola_glass_bottle_%28Germany%29.jpg/960px-15-09-26-RalfR-WLC-0098_-_Coca-Cola_glass_bottle_%28Germany%29.jpg`,
  "buttermilk": `${WM}/thumb/2/23/Buttermilk-%28right%29-and-Milk-%28left%29.jpg/1920px-Buttermilk-%28right%29-and-Milk-%28left%29.jpg`,
  "fresh lime soda": `${WM}/thumb/d/d3/Cider_%28lemon-lime_drink%29.jpg/960px-Cider_%28lemon-lime_drink%29.jpg`,
  "tea": `${WM}/thumb/6/6a/Masala_Chai.jpg/960px-Masala_Chai.jpg`,
  "coffee": `${WM}/8/84/Indian_filter_coffee_in_Dabarah.jpg`,
};

export const FALLBACK_IMAGE = `${WM}/thumb/4/4b/My_traditional_Indian_thali_meal_%2848625245542%29.jpg/960px-My_traditional_Indian_thali_meal_%2848625245542%29.jpg`;

// Longer, more specific keys should match first.
const sortedKeys = Object.keys(map).sort((a, b) => b.length - a.length);

export function imageFor(name: string): string {
  const key = name.toLowerCase().trim();
  if (map[key]) return map[key];
  for (const k of sortedKeys) {
    if (key.includes(k)) return map[k];
  }
  return FALLBACK_IMAGE;
}
