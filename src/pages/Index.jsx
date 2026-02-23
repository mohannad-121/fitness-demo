import { jsx, jsxs } from "react/jsx-runtime";
import { motion } from "framer-motion";
import { ArrowRight, Dumbbell, Target, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import heroBg from "@/assets/hero-bg.jpg";
const Index = () => {
  const { t } = useLanguage();
  const features = [
    {
      icon: Target,
      title: "Personalized Workouts",
      description: "Exercise recommendations based on your goals and body type."
    },
    {
      icon: Dumbbell,
      title: "Home & Gym Ready",
      description: "Exercises adapted for wherever you train - no equipment needed at home."
    },
    {
      icon: Zap,
      title: "Track Progress",
      description: "Monitor your journey with smart analytics and personalized insights."
    }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsxs("section", { className: "relative min-h-screen flex items-center justify-center overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 z-0", children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: heroBg,
            alt: "Fitness hero",
            className: "w-full h-full object-cover"
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 container mx-auto px-4 text-center pt-20", children: [
        /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 30 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.8 },
            children: [
              /* @__PURE__ */ jsx("h1", { className: "font-display text-6xl md:text-8xl lg:text-9xl text-foreground mb-6 leading-none", children: t("hero.title") }),
              /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10", children: t("hero.subtitle") }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [
                /* @__PURE__ */ jsx(Link, { to: "/workouts", children: /* @__PURE__ */ jsxs(Button, { variant: "hero", size: "xl", children: [
                  t("hero.cta"),
                  /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5 ml-2" })
                ] }) }),
                /* @__PURE__ */ jsx(Link, { to: "/workouts", children: /* @__PURE__ */ jsx(Button, { variant: "glass", size: "xl", children: t("hero.secondary") }) })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          motion.div,
          {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { delay: 1, duration: 0.5 },
            className: "absolute bottom-8 left-1/2 -translate-x-1/2",
            children: /* @__PURE__ */ jsx(
              motion.div,
              {
                animate: { y: [0, 10, 0] },
                transition: { duration: 1.5, repeat: Infinity },
                className: "w-6 h-10 rounded-full border-2 border-muted-foreground/50 flex items-start justify-center p-2",
                children: /* @__PURE__ */ jsx("div", { className: "w-1.5 h-3 bg-primary rounded-full" })
              }
            )
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "py-20 px-4", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto", children: [
      /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          className: "text-center mb-16",
          children: [
            /* @__PURE__ */ jsx("h2", { className: "font-display text-4xl md:text-5xl text-foreground mb-4", children: "EVERYTHING YOU NEED" }),
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground max-w-xl mx-auto", children: "A complete fitness platform designed to help you achieve your goals" })
          ]
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: features.map((feature, index) => /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { delay: index * 0.1 },
          className: "glass-card rounded-2xl p-6 text-center hover:border-primary/50 transition-all duration-300 group",
          children: [
            /* @__PURE__ */ jsx("div", { className: "w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors", children: /* @__PURE__ */ jsx(feature.icon, { className: "w-7 h-7 text-primary" }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-2", children: feature.title }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: feature.description })
          ]
        },
        index
      )) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 px-4", children: /* @__PURE__ */ jsx("div", { className: "container mx-auto", children: /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, scale: 0.95 },
        whileInView: { opacity: 1, scale: 1 },
        viewport: { once: true },
        className: "glass-card rounded-3xl p-10 md:p-16 text-center glow-border",
        children: [
          /* @__PURE__ */ jsx("h2", { className: "font-display text-4xl md:text-6xl text-foreground mb-4", children: "START YOUR TRANSFORMATION" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground max-w-xl mx-auto mb-8", children: "Join thousands of users who achieve their fitness goals with structured workouts." }),
          /* @__PURE__ */ jsx(Link, { to: "/workouts", children: /* @__PURE__ */ jsxs(Button, { variant: "hero", size: "xl", children: [
            "Get Started Free",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5 ml-2" })
          ] }) })
        ]
      }
    ) }) }),
    /* @__PURE__ */ jsx("footer", { className: "border-t border-border/50 py-8 px-4", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto flex flex-col md:flex-row items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center", children: /* @__PURE__ */ jsx(Dumbbell, { className: "w-4 h-4 text-primary-foreground" }) }),
        /* @__PURE__ */ jsx("span", { className: "font-display text-xl", children: "FITTRAIN" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "\xA9 2026 FitTrain. All rights reserved." })
    ] }) })
  ] });
};
var stdin_default = Index;
export {
  stdin_default as default
};
