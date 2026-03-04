import { jsx, jsxs } from "react/jsx-runtime";
import { Link, useLocation } from "react-router-dom";
import { Home, Dumbbell, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
function Navbar() {
  const { t, language, setLanguage } = useLanguage();
  const location = useLocation();
  const navItems = [
    { path: "/", icon: Home, label: t("nav.home") },
    { path: "/workouts", icon: Dumbbell, label: t("nav.workouts") }
  ];
  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };
  return /* @__PURE__ */ jsxs("nav", { className: "fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50", children: [
    /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between h-16", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center", children: /* @__PURE__ */ jsx(Dumbbell, { className: "w-6 h-6 text-primary-foreground" }) }),
        /* @__PURE__ */ jsx("span", { className: "font-display text-2xl tracking-wide text-foreground", children: "FITTRAIN" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "hidden md:flex items-center gap-1", children: navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return /* @__PURE__ */ jsx(Link, { to: item.path, children: /* @__PURE__ */ jsxs(
          Button,
          {
            variant: isActive ? "default" : "ghost",
            className: `relative ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`,
            children: [
              /* @__PURE__ */ jsx(item.icon, { className: "w-4 h-4 mr-2" }),
              item.label
            ]
          }
        ) }, item.path);
      }) }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "outline",
          size: "sm",
          onClick: toggleLanguage,
          className: "border-border/50 text-muted-foreground hover:text-foreground",
          children: [
            /* @__PURE__ */ jsx(Globe, { className: "w-4 h-4 mr-1" }),
            language === "en" ? "\u0639\u0631\u0628\u064A" : "EN"
          ]
        }
      ) })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "md:hidden fixed bottom-0 left-0 right-0 glass-card border-t border-border/50 px-2 py-1.5", children: /* @__PURE__ */ jsx("div", { className: "flex justify-around", children: navItems.map((item) => {
      const isActive = location.pathname === item.path;
      return /* @__PURE__ */ jsx(Link, { to: item.path, children: /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          className: `flex flex-col items-center gap-0.5 h-auto py-1.5 px-2 ${isActive ? "text-primary" : "text-muted-foreground"}`,
          children: [
            /* @__PURE__ */ jsx(item.icon, { className: "w-4 h-4" }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px]", children: item.label })
          ]
        }
      ) }, item.path);
    }) }) })
  ] });
}
export {
  Navbar
};
