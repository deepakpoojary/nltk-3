import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./translations/en.json";
import hi from "./translations/hi.json";
import kn from "./translations/kn.json";
import ta from "./translations/ta.json";
import te from "./translations/te.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    kn: { translation: kn },
    ta: { translation: ta },
    te: { translation: te },
  },
  lng: "hi", // default language
  fallbackLng: "hi",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
