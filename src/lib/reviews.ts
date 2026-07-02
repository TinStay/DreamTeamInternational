// Customer reviews from the DreamTeam Google Business profile.
// Avatar `initials` + `color` mirror the letter icons shown on Google
// (for reviewers with a photo, we use their initials on a colored circle).
export const GOOGLE_REVIEWS_URL = "https://maps.app.goo.gl/ZjFXMCZwiBtvMugY7";

export type Review = {
  name: string;
  text: string;
  /** 1-5 */
  rating: number;
  /** Letters shown on the avatar circle. */
  initials: string;
  /** Avatar circle background color (hex). */
  color: string;
};

export const REVIEWS: Review[] = [
  {
    name: "Rada Gulubova",
    initials: "R",
    color: "#00897B",
    rating: 5,
    text: "Изключителни професионалисти! Заслужава си. Много бързо и качествено. Добра комуникация.",
  },
  {
    name: "Stoika Stankova",
    initials: "S",
    color: "#34A853",
    rating: 5,
    text: "Страхотни специалисти! Успяха да разберат отлично нуждите на нашия бранд и да ги превърнат в атрактивни и професионални визии за социалните медии. Дизайните са последователни, модерни и съобразени с актуалните тенденции.",
  },
  {
    name: "Vladimir Shehov",
    initials: "V",
    color: "#7E57C2",
    rating: 5,
    text: "Много коректни и отзивчиви. За първи път използвах услуга за AI видео реклама и не знаех какво да очаквам, но крайният резултат беше наистина впечатляващ. Благодаря за професионализма и вниманието към детайлите.",
  },
  {
    name: "Dimitar Vladikov",
    initials: "D",
    color: "#8E24AA",
    rating: 5,
    text: "Направиха ми много добро и професионално изработено видео. Посланието е ясно, визията е модерна, а монтажът задържа вниманието през цялото видео.",
  },
  {
    name: "Lucy Nguyen",
    initials: "LN",
    color: "#3949AB",
    rating: 5,
    text: "Благодаря, направихме консултация, изслушваха ме, търпеливо ми направиха и промените. Доволна съм и препоръчвам.",
  },
  {
    name: "Rosen Kanev",
    initials: "R",
    color: "#7B1FA2",
    rating: 5,
    text: "Работата с тях беше удоволствие! Професионализъм и доставка навреме. Горещо препоръчвам!",
  },
  {
    name: "BG Broker",
    initials: "BG",
    color: "#D81B60",
    rating: 5,
    text: "Изключително съм доволен от работата на момчетата! Страхотни видеа, бърза работа и разумни цени. Препоръчвам!",
  },
  {
    name: "Radoslav Kochev",
    initials: "R",
    color: "#2E7D32",
    rating: 4,
    text: "Фирмата е сериозна и изпълниха проекта ми на 90% от представите ми. Цената по мое мнение е над средната, но за мен лично е приемлива за качеството, което получих.",
  },
  {
    name: "Kaloyan Georgiev",
    initials: "KG",
    color: "#6D4C41",
    rating: 5,
    text: "Уникални професионалисти! Направиха ни страхотна AI видео реклама, която събра куп комплименти. Процесът беше супер приятен, а крайният продукт е на високо ниво. Много свежи идеи и коректно отношение. Със сигурност ще работим пак заедно!",
  },
];
