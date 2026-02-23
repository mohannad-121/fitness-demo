import { jsx } from "react/jsx-runtime";
import { createContext, useContext, useState } from "react";

const translations = {
  en: {
    "nav.home": "Home",
    "nav.workouts": "Workouts",
    "hero.title": "TRANSFORM YOUR BODY",
    "hero.subtitle": "Personalized workouts for your goals and fitness level.",
    "hero.cta": "Start Your Journey",
    "hero.secondary": "Explore Workouts",
    "workouts.title": "MUSCLE MAP",
    "workouts.subtitle": "Select target muscles to find exercises",
    "workouts.filter.all": "All",
    "workouts.filter.goal": "By Goal",
    "workouts.filter.muscle": "By Muscle",
    "workouts.exercises": "exercises found",
    "workouts.sets": "Sets",
    "workouts.reps": "Reps",
    "workouts.watch": "Watch Video",
    "workouts.noResults": "No exercises found. Try adjusting your filters.",
    "muscle.chest": "Chest",
    "muscle.back": "Back",
    "muscle.shoulders": "Shoulders",
    "muscle.biceps": "Biceps",
    "muscle.triceps": "Triceps",
    "muscle.abs": "Abs",
    "muscle.quads": "Quads",
    "muscle.hamstrings": "Hamstrings",
    "muscle.glutes": "Glutes",
    "muscle.calves": "Calves",
    "common.male": "Male",
    "common.female": "Female",
    "common.home": "Home",
    "common.gym": "Gym",
    "goal.bulking": "Build Muscle",
    "goal.cutting": "Lose Weight",
    "goal.fitness": "General Fitness",
    "common.loading": "Loading...",
    "common.error": "Something went wrong",
    "common.save": "Save",
    "common.cancel": "Cancel"
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.workouts": "التمارين",
    "hero.title": "غيّر جسمك",
    "hero.subtitle": "تمارين مخصصة حسب هدفك ومستواك الرياضي.",
    "hero.cta": "ابدأ رحلتك",
    "hero.secondary": "استكشف التمارين",
    "workouts.title": "خريطة العضلات",
    "workouts.subtitle": "اختر العضلات المستهدفة لعرض التمارين",
    "workouts.filter.all": "الكل",
    "workouts.filter.goal": "حسب الهدف",
    "workouts.filter.muscle": "حسب العضلة",
    "workouts.exercises": "تمرين",
    "workouts.sets": "مجموعات",
    "workouts.reps": "تكرارات",
    "workouts.watch": "شاهد الفيديو",
    "workouts.noResults": "ما لقيت تمارين. جرب تغيير الفلاتر.",
    "muscle.chest": "الصدر",
    "muscle.back": "الظهر",
    "muscle.shoulders": "الأكتاف",
    "muscle.biceps": "الباي",
    "muscle.triceps": "التراي",
    "muscle.abs": "البطن",
    "muscle.quads": "الفخذ الأمامي",
    "muscle.hamstrings": "الفخذ الخلفي",
    "muscle.glutes": "المؤخرة",
    "muscle.calves": "السمانة",
    "common.male": "ذكر",
    "common.female": "أنثى",
    "common.home": "البيت",
    "common.gym": "الجيم",
    "goal.bulking": "بناء عضلات",
    "goal.cutting": "إنقاص الوزن",
    "goal.fitness": "لياقة عامة",
    "common.loading": "جاري التحميل...",
    "common.error": "صار خطأ",
    "common.save": "حفظ",
    "common.cancel": "إلغاء"
  }
};

const LanguageContext = createContext(void 0);

function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("en");
  const t = (key) => translations[language][key] || key;
  const dir = language === "ar" ? "rtl" : "ltr";

  return /* @__PURE__ */ jsx(LanguageContext.Provider, {
    value: { language, setLanguage, t, dir },
    children: /* @__PURE__ */ jsx("div", { dir, children })
  });
}

function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export {
  LanguageProvider,
  useLanguage
};
