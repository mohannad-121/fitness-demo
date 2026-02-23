import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { motion } from "framer-motion";
import { Dumbbell, Home as HomeIcon } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { AnatomyBody, advancedToGroupMap } from "@/components/workout/AnatomyBody";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { getExercisesByFilters } from "@/data/exercises";
function WorkoutsPage() {
  const { t, language } = useLanguage();
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [locationFilter, setLocationFilter] = useState(null);
  const [goalFilter, setGoalFilter] = useState(null);
  const [genderFilter, setGenderFilter] = useState(null);
  const toggleMuscle = (muscleId) => {
    setSelectedMuscles(
      (prev) => prev.includes(muscleId) ? prev.filter((m) => m !== muscleId) : [...prev, muscleId]
    );
  };
  const muscleNames = {
    "muscle.chest": t("muscle.chest"),
    "muscle.back": t("muscle.back"),
    "muscle.shoulders": t("muscle.shoulders"),
    "muscle.biceps": t("muscle.biceps"),
    "muscle.triceps": t("muscle.triceps"),
    "muscle.abs": t("muscle.abs"),
    "muscle.quads": t("muscle.quads"),
    "muscle.hamstrings": t("muscle.hamstrings"),
    "muscle.glutes": t("muscle.glutes"),
    "muscle.calves": t("muscle.calves")
  };
  const mappedMuscles = selectedMuscles.map((m) => advancedToGroupMap[m] || m);
  const uniqueMuscles = [...new Set(mappedMuscles)];
  const exercises = getExercisesByFilters(uniqueMuscles, goalFilter, locationFilter, genderFilter);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen pb-24 md:pb-8", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsxs("main", { className: "container mx-auto px-4 pt-24", children: [
      /* @__PURE__ */ jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "text-center mb-8", children: [
        /* @__PURE__ */ jsx("h1", { className: "font-display text-4xl md:text-5xl text-foreground mb-2", children: t("workouts.title") }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: t("workouts.subtitle") })
      ] }),
      /* @__PURE__ */ jsx(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.1 },
          className: "glass-card rounded-2xl p-6 mb-8",
          children: /* @__PURE__ */ jsx(AnatomyBody, { selectedMuscles, onMuscleToggle: toggleMuscle, muscleNames })
        }
      ),
      /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.2 },
          className: "flex flex-wrap gap-3 mb-8 justify-center",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 bg-card/50 rounded-xl p-1 border border-border/30", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground px-2", children: [
                language === "ar" ? "\u0627\u0644\u062C\u0646\u0633" : "Gender",
                ":"
              ] }),
              [{ val: null, label: t("workouts.filter.all") }, { val: "male", label: t("common.male") }, { val: "female", label: t("common.female") }].map((opt) => /* @__PURE__ */ jsx(
                Button,
                {
                  variant: genderFilter === opt.val ? "default" : "ghost",
                  size: "sm",
                  onClick: () => setGenderFilter(opt.val),
                  children: opt.label
                },
                String(opt.val)
              ))
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 bg-card/50 rounded-xl p-1 border border-border/30", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground px-2", children: [
                language === "ar" ? "\u0627\u0644\u0645\u0643\u0627\u0646" : "Place",
                ":"
              ] }),
              [{ val: null, label: t("workouts.filter.all") }, { val: "home", label: t("common.home"), icon: HomeIcon }, { val: "gym", label: t("common.gym"), icon: Dumbbell }].map((opt) => /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: locationFilter === opt.val ? "default" : "ghost",
                  size: "sm",
                  onClick: () => setLocationFilter(opt.val),
                  children: [
                    opt.icon && /* @__PURE__ */ jsx(opt.icon, { className: "w-3.5 h-3.5 mr-1" }),
                    opt.label
                  ]
                },
                String(opt.val)
              ))
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 bg-card/50 rounded-xl p-1 border border-border/30", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground px-2", children: [
                language === "ar" ? "\u0627\u0644\u0647\u062F\u0641" : "Goal",
                ":"
              ] }),
              [{ val: null, label: t("workouts.filter.all") }, { val: "bulking", label: t("goal.bulking") }, { val: "cutting", label: t("goal.cutting") }, { val: "fitness", label: t("goal.fitness") }].map((opt) => /* @__PURE__ */ jsx(
                Button,
                {
                  variant: goalFilter === opt.val ? "default" : "ghost",
                  size: "sm",
                  onClick: () => setGoalFilter(opt.val),
                  children: opt.label
                },
                String(opt.val)
              ))
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "text-center mb-6", children: /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
        exercises.length,
        " ",
        t("workouts.exercises")
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: exercises.map((exercise, index) => /* @__PURE__ */ jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.05 + index * 0.02 }, children: /* @__PURE__ */ jsx(ExerciseCard, { exercise, selectedGender: genderFilter }) }, exercise.id)) }),
      exercises.length === 0 && /* @__PURE__ */ jsxs("div", { className: "text-center py-16", children: [
        /* @__PURE__ */ jsx(Dumbbell, { className: "w-16 h-16 mx-auto text-muted-foreground mb-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: t("workouts.noResults") })
      ] })
    ] })
  ] });
}
export {
  WorkoutsPage
};
