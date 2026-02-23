import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { motion } from "framer-motion";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { getExerciseVideoUrl, isLocalExerciseVideo } from "@/data/exerciseVideoResolver";
function ExerciseCard({ exercise, selectedGender = null }) {
  const { language, t } = useLanguage();
  const [showVideo, setShowVideo] = useState(false);
  const resolvedVideoUrl = getExerciseVideoUrl(exercise, selectedGender);
  const localVideo = isLocalExerciseVideo(resolvedVideoUrl);
  const hasVideo = localVideo && resolvedVideoUrl.length > 0;
  const name = language === "ar" ? exercise.nameAr : exercise.name;
  const description = language === "ar" ? exercise.descriptionAr : exercise.description;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        className: "glass-card rounded-xl overflow-hidden group hover:border-primary/50 transition-all duration-300",
        children: [
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: `relative h-40 bg-secondary overflow-hidden ${hasVideo ? "cursor-pointer" : "cursor-not-allowed opacity-80"}`,
              onClick: () => {
                if (hasVideo) {
                  setShowVideo(true);
                }
              },
              children: [
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-card to-transparent z-10" }),
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center z-20", children: hasVideo ? /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-glow", children: /* @__PURE__ */ jsx(Play, { className: "w-6 h-6 text-primary-foreground ml-1" }) }) : /* @__PURE__ */ jsx("span", { className: "text-xs px-3 py-1 rounded-full bg-background/70 text-muted-foreground border border-border/50", children: language === "ar" ? "\u0644\u0627 \u064A\u0648\u062C\u062F \u0641\u064A\u062F\u064A\u0648" : "No video" }) }),
                hasVideo ? /* @__PURE__ */ jsx(
                  "video",
                  {
                    src: resolvedVideoUrl,
                    className: "w-full h-full object-cover",
                    muted: true,
                    playsInline: true,
                    preload: "metadata"
                  }
                ) : /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: "/placeholder.svg",
                    alt: name,
                    className: "w-full h-full object-cover"
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-lg text-foreground mb-1", children: name }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-4 line-clamp-2", children: description }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 text-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-primary font-bold", children: exercise.sets }),
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: t("workouts.sets") })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-primary font-bold", children: exercise.reps }),
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: t("workouts.reps") })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-3 flex-wrap", children: [
              /* @__PURE__ */ jsx("span", { className: "px-2 py-1 text-xs rounded-full bg-primary/20 text-primary", children: t(`muscle.${exercise.muscle}`) }),
              /* @__PURE__ */ jsx("span", { className: "px-2 py-1 text-xs rounded-full bg-accent/20 text-accent", children: exercise.location === "home" ? t("common.home") : exercise.location === "gym" ? t("common.gym") : "Both" })
            ] })
          ] })
        ]
      }
    ),
    showVideo && hasVideo && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4",
        onClick: () => setShowVideo(false),
        children: /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 },
            className: "relative w-full max-w-3xl aspect-video bg-card rounded-xl overflow-hidden",
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  className: "absolute top-2 right-2 z-10 bg-background/50 hover:bg-background/80",
                  onClick: () => setShowVideo(false),
                  children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
                }
              ),
              localVideo ? /* @__PURE__ */ jsx(
                "video",
                {
                  src: resolvedVideoUrl,
                  className: "w-full h-full object-contain bg-black",
                  controls: true,
                  autoPlay: true,
                  playsInline: true
                }
              ) : /* @__PURE__ */ jsx(
                "iframe",
                {
                  src: `${resolvedVideoUrl}?autoplay=1`,
                  className: "w-full h-full",
                  allow: "autoplay; encrypted-media",
                  allowFullScreen: true,
                  title: name
                }
              )
            ]
          }
        )
      }
    )
  ] });
}
export {
  ExerciseCard
};
