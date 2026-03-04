import "./index.css";
import { exercises, getExercisesByFilters } from "./data/exercises.js";

const state = {
  language: localStorage.getItem("fitcoach_lang") || "en",
  selectedMuscles: [],
  goal: null,
  location: null,
  gender: null,
};

const translations = {
  en: {
    "nav.home": "Home",
    "nav.workouts": "Workouts",
    "nav.profile": "Profile",
    "nav.schedule": "Schedule",
    "nav.auth": "Sign In",
    "hero.title": "TRANSFORM YOUR BODY",
    "hero.subtitle": "AI-guided training plans, smart exercise filters, and a lightweight coach demo built in plain JavaScript.",
    "hero.cta": "Start Training",
    "hero.secondary": "Explore Workouts",
    "features.title": "EVERYTHING YOU NEED",
    "features.subtitle": "A focused fitness hub with clean UI, fast filters, and no heavy frameworks.",
    "features.one.title": "Smart Filters",
    "features.one.desc": "Find exercises by muscle, goal, location, and gender in seconds.",
    "features.two.title": "Guided Plans",
    "features.two.desc": "Follow weekly training templates tailored for consistency.",
    "features.three.title": "Weekly Focus",
    "features.three.desc": "Follow a simple split and track your weekly rhythm.",
    "features.four.title": "Progress Cards",
    "features.four.desc": "Track weekly focus and stay on target.",
    "workouts.title": "MUSCLE MAP",
    "workouts.subtitle": "Select filters to reveal the best-fit exercises.",
    "workouts.count": "exercises found",
    "workouts.filter.muscle": "Muscle",
    "workouts.filter.goal": "Goal",
    "workouts.filter.location": "Place",
    "workouts.filter.gender": "Gender",
    "workouts.filter.all": "All",
    "workouts.goal.bulking": "Build Muscle",
    "workouts.goal.cutting": "Lose Weight",
    "workouts.goal.fitness": "General Fitness",
    "workouts.location.home": "Home",
    "workouts.location.gym": "Gym",
    "workouts.gender.male": "Male",
    "workouts.gender.female": "Female",
    "workouts.empty": "No exercises found. Try different filters.",
    "workouts.watch": "Watch Video",
    "profile.title": "PROFILE",
    "profile.subtitle": "Save your basic details locally in this browser.",
    "profile.save": "Save Profile",
    "schedule.title": "WEEKLY SCHEDULE",
    "schedule.subtitle": "A simple 4-day split to keep you consistent.",
    "auth.title": "SIGN IN",
    "auth.button": "Continue",
    "muscles.title": "MUSCLE GROUPS",
    "muscles.subtitle": "Quick references for focus areas.",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.workouts": "التمارين",
    "nav.profile": "الملف",
    "nav.schedule": "الجدول",
    "nav.auth": "تسجيل الدخول",
    "hero.title": "غيّر جسمك",
    "hero.subtitle": "خطط تدريب بالذكاء الاصطناعي، فلاتر تمارين سريعة، وتجربة مدرب مبسطة بجافاسكريبت فقط.",
    "hero.cta": "ابدأ التدريب",
    "hero.secondary": "استكشف التمارين",
    "features.title": "كل ما تحتاجه",
    "features.subtitle": "منصة لياقة مركزة بواجهة نظيفة وفلاتر سريعة بدون أطر ثقيلة.",
    "features.one.title": "فلاتر ذكية",
    "features.one.desc": "ابحث حسب العضلة والهدف والمكان والجنس بسرعة.",
    "features.two.title": "خطط أسبوعية",
    "features.two.desc": "تزم خطة تدريب 4 أيام للثبات.",
    "features.three.title": "تركيز أسبوعي",
    "features.three.desc": "اتبع تقسيمة بسيطة وراقب إيقاعك الأسبوعي.",
    "features.four.title": "بطاقات تقدم",
    "features.four.desc": "تابع تركيز الأسبوع.",
    "workouts.title": "خريطة العضلات",
    "workouts.subtitle": "اختر الفلاتر لعرض التمارين المناسبة.",
    "workouts.count": "تمرين",
    "workouts.filter.muscle": "العضلة",
    "workouts.filter.goal": "الهدف",
    "workouts.filter.location": "المكان",
    "workouts.filter.gender": "الجنس",
    "workouts.filter.all": "الكل",
    "workouts.goal.bulking": "بناء عضلات",
    "workouts.goal.cutting": "خسارة وزن",
    "workouts.goal.fitness": "لياقة عامة",
    "workouts.location.home": "البيت",
    "workouts.location.gym": "الجيم",
    "workouts.gender.male": "ذكر",
    "workouts.gender.female": "أنثى",
    "workouts.empty": "ما في تمارين. جرّب فلاتر مختلفة.",
    "workouts.watch": "شاهد الفيديو",
    "profile.title": "الملف الشخصي",
    "profile.subtitle": "احفظ بياناتك على هذا المتصفح فقط.",
    "profile.save": "حفظ الملف",
    "schedule.title": "الجدول الأسبوعي",
    "schedule.subtitle": "تقسيمة 4 أيام للالتزام.",
    "auth.title": "تسجيل الدخول",
    "auth.button": "متابعة",
    "muscles.title": "مجموعات العضلات",
    "muscles.subtitle": "نظرة سريعة على مناطق التركيز.",
  },
};

const labels = {
  muscle: {
    chest: { en: "Chest", ar: "الصدر" },
    back: { en: "Back", ar: "الظهر" },
    shoulders: { en: "Shoulders", ar: "الأكتاف" },
    biceps: { en: "Biceps", ar: "الباي" },
    triceps: { en: "Triceps", ar: "التراي" },
    abs: { en: "Abs", ar: "البطن" },
    quads: { en: "Quads", ar: "الفخذ الأمامي" },
    hamstrings: { en: "Hamstrings", ar: "الفخذ الخلفي" },
    glutes: { en: "Glutes", ar: "المؤخرة" },
    calves: { en: "Calves", ar: "السمانة" },
  },
};

const muscleGroups = [
  {
    id: "upper",
    title: { en: "Upper Body", ar: "الجزء العلوي" },
    subtitle: { en: "Push and pull muscles", ar: "عضلات الدفع والسحب" },
    muscles: ["chest", "back", "shoulders", "biceps", "triceps"],
  },
  {
    id: "core",
    title: { en: "Core", ar: "الجذع" },
    subtitle: { en: "Stability and posture", ar: "الثبات ووضعية الجسم" },
    muscles: ["abs"],
  },
  {
    id: "lower",
    title: { en: "Lower Body", ar: "الجزء السفلي" },
    subtitle: { en: "Leg and hip strength", ar: "قوة الأرجل والورك" },
    muscles: ["quads", "hamstrings", "glutes", "calves"],
  },
];

const elements = {
  langToggle: document.querySelector("[data-lang-toggle]"),
  i18n: document.querySelectorAll("[data-i18n]"),
  i18nPlaceholder: document.querySelectorAll("[data-i18n-placeholder]"),
  menuToggle: document.querySelector("[data-menu-toggle]"),
  menu: document.querySelector("[data-menu]"),
  workoutMuscles: document.querySelector("[data-workout-muscles]"),
  workoutGoals: document.querySelector("[data-workout-goals]"),
  workoutLocations: document.querySelector("[data-workout-locations]"),
  workoutGenders: document.querySelector("[data-workout-genders]"),
  workoutCount: document.querySelector("[data-workout-count]"),
  workoutGrid: document.querySelector("[data-workout-grid]"),
  workoutEmpty: document.querySelector("[data-workout-empty]"),
  muscleGroups: document.querySelector("[data-muscle-groups]"),
  profileForm: document.querySelector("[data-profile-form]"),
  profileNotice: document.querySelector("[data-profile-notice]"),
  authForm: document.querySelector("[data-auth-form]"),
  authNotice: document.querySelector("[data-auth-notice]"),
};

function setLanguage(lang) {
  state.language = lang;
  localStorage.setItem("fitcoach_lang", lang);
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
  if (elements.langToggle) {
    elements.langToggle.textContent = lang === "ar" ? "EN" : "AR";
  }

  elements.i18n.forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (key && translations[lang][key]) {
      node.textContent = translations[lang][key];
    }
  });

  elements.i18nPlaceholder.forEach((node) => {
    const key = node.getAttribute("data-i18n-placeholder");
    if (key && translations[lang][key]) {
      node.setAttribute("placeholder", translations[lang][key]);
    }
  });

  renderWorkoutFilters();
  renderExercises();
  renderMuscleGroups();
}

function toggleMenu() {
  if (!elements.menu) return;
  elements.menu.classList.toggle("hidden");
}

function createFilterButton(label, isActive, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `px-3 py-1.5 rounded-full text-sm border transition ${isActive ? "bg-primary text-primary-foreground border-primary" : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border"}`;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function renderWorkoutFilters() {
  const lang = state.language;
  if (!elements.workoutMuscles) return;

  const muscleKeys = Object.keys(labels.muscle);
  elements.workoutMuscles.innerHTML = "";
  muscleKeys.forEach((muscle) => {
    const label = labels.muscle[muscle][lang];
    const isActive = state.selectedMuscles.includes(muscle);
    const button = createFilterButton(label, isActive, () => {
      state.selectedMuscles = isActive
        ? state.selectedMuscles.filter((m) => m !== muscle)
        : [...state.selectedMuscles, muscle];
      renderWorkoutFilters();
      renderExercises();
    });
    elements.workoutMuscles.appendChild(button);
  });

  const goalOptions = [
    { value: null, label: translations[lang]["workouts.filter.all"] },
    { value: "bulking", label: translations[lang]["workouts.goal.bulking"] },
    { value: "cutting", label: translations[lang]["workouts.goal.cutting"] },
    { value: "fitness", label: translations[lang]["workouts.goal.fitness"] },
  ];
  elements.workoutGoals.innerHTML = "";
  goalOptions.forEach((option) => {
    const isActive = state.goal === option.value;
    elements.workoutGoals.appendChild(
      createFilterButton(option.label, isActive, () => {
        state.goal = option.value;
        renderWorkoutFilters();
        renderExercises();
      })
    );
  });

  const locationOptions = [
    { value: null, label: translations[lang]["workouts.filter.all"] },
    { value: "home", label: translations[lang]["workouts.location.home"] },
    { value: "gym", label: translations[lang]["workouts.location.gym"] },
  ];
  elements.workoutLocations.innerHTML = "";
  locationOptions.forEach((option) => {
    const isActive = state.location === option.value;
    elements.workoutLocations.appendChild(
      createFilterButton(option.label, isActive, () => {
        state.location = option.value;
        renderWorkoutFilters();
        renderExercises();
      })
    );
  });

  const genderOptions = [
    { value: null, label: translations[lang]["workouts.filter.all"] },
    { value: "male", label: translations[lang]["workouts.gender.male"] },
    { value: "female", label: translations[lang]["workouts.gender.female"] },
  ];
  elements.workoutGenders.innerHTML = "";
  genderOptions.forEach((option) => {
    const isActive = state.gender === option.value;
    elements.workoutGenders.appendChild(
      createFilterButton(option.label, isActive, () => {
        state.gender = option.value;
        renderWorkoutFilters();
        renderExercises();
      })
    );
  });
}

function renderExercises() {
  if (!elements.workoutCount || !elements.workoutGrid || !elements.workoutEmpty) return;
  const filtered = getExercisesByFilters(
    state.selectedMuscles,
    state.goal,
    state.location,
    state.gender
  );

  elements.workoutCount.textContent = `${filtered.length} ${translations[state.language]["workouts.count"]}`;
  elements.workoutGrid.innerHTML = "";

  if (filtered.length === 0) {
    elements.workoutEmpty.classList.remove("hidden");
    return;
  }

  elements.workoutEmpty.classList.add("hidden");
  filtered.forEach((exercise) => {
    const card = document.createElement("div");
    card.className = "glass-card rounded-2xl p-5 border border-border/40 hover:border-primary/50 transition";
    card.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold">${state.language === "ar" ? exercise.nameAr : exercise.name}</h3>
        <span class="text-xs px-2 py-1 rounded-full bg-secondary/60 text-secondary-foreground">${labels.muscle[exercise.muscle][state.language]}</span>
      </div>
      <p class="text-sm text-muted-foreground mb-4">${state.language === "ar" ? exercise.descriptionAr : exercise.description}</p>
      <div class="flex items-center justify-between text-xs text-muted-foreground mb-4">
        <span>${exercise.sets} sets</span>
        <span>${exercise.reps} reps</span>
      </div>
    `;
    elements.workoutGrid.appendChild(card);
  });
}

function renderMuscleGroups() {
  if (!elements.muscleGroups) return;

  const lang = state.language;
  elements.muscleGroups.innerHTML = "";

  muscleGroups.forEach((group) => {
    const card = document.createElement("article");
    card.className = "glass-card rounded-2xl p-6 border border-border/40";

    const title = document.createElement("h3");
    title.className = "font-display text-2xl mb-1";
    title.textContent = group.title[lang];

    const subtitle = document.createElement("p");
    subtitle.className = "text-sm text-muted-foreground mb-4";
    subtitle.textContent = group.subtitle[lang];

    const chips = document.createElement("div");
    chips.className = "flex flex-wrap gap-2";

    group.muscles.forEach((muscleKey) => {
      const chip = document.createElement("span");
      chip.className = "px-3 py-1.5 rounded-full border border-border/50 text-sm";
      chip.textContent = labels.muscle[muscleKey][lang];
      chips.appendChild(chip);
    });

    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(chips);
    elements.muscleGroups.appendChild(card);
  });
}

function setupProfile() {
  if (!elements.profileForm || !elements.profileNotice) return;
  const saved = localStorage.getItem("fitcoach_profile");
  if (saved) {
    try {
      const data = JSON.parse(saved);
      Object.entries(data).forEach(([key, value]) => {
        const input = elements.profileForm.querySelector(`[name="${key}"]`);
        if (input) input.value = value;
      });
    } catch {
      // ignore parsing errors
    }
  }

  elements.profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(elements.profileForm);
    const profile = Object.fromEntries(formData.entries());
    localStorage.setItem("fitcoach_profile", JSON.stringify(profile));
    elements.profileNotice.textContent = state.language === "ar" ? "تم الحفظ!" : "Saved!";
    setTimeout(() => {
      elements.profileNotice.textContent = "";
    }, 2000);
  });
}

function setupAuth() {
  if (!elements.authForm || !elements.authNotice) return;
  elements.authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    elements.authNotice.textContent = state.language === "ar" ? "تم الإرسال (تجريبي)" : "Submitted (demo only)";
    setTimeout(() => {
      elements.authNotice.textContent = "";
    }, 2000);
  });
}

if (elements.menuToggle) {
  elements.menuToggle.addEventListener("click", toggleMenu);
}

if (elements.langToggle) {
  elements.langToggle.addEventListener("click", () => {
    setLanguage(state.language === "en" ? "ar" : "en");
  });
}

setLanguage(state.language);
setupProfile();
setupAuth();
