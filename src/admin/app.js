import GuestDashboard from './extensions/components/GuestDashboard/index.jsx';

const config = {
  locales: [
    // 'ar',
    // 'fr',
    // 'cs',
    // 'de',
    // 'dk',
    // 'es',
    // 'he',
    // 'id',
    // 'it',
    // 'ja',
    // 'ko',
    // 'ms',
    // 'nl',
    // 'no',
    // 'pl',
    // 'pt-BR',
    // 'pt',
    // 'ru',
    // 'sk',
    // 'sv',
    // 'th',
    // 'tr',
    // 'uk',
    // 'vi',
    // 'zh-Hans',
    // 'zh',
  ],
  translations: {
    es: {
      "app.components.LeftMenu.navbrand.title": "Boda Dashboard",
      "guest-dashboard": "Dashboard de Invitados",
    },
  },
  menu: {
    logo: null,
  },
};

const bootstrap = (app) => {
  // Registrar la página personalizada
  app.addMenuLink({
    to: '/guest-dashboard',
    icon: 'chart-pie',
    intlLabel: {
      id: 'guest-dashboard',
      defaultMessage: 'Dashboard de Invitados',
    },
    Component: async () => {
      return GuestDashboard;
    },
    permissions: [
      
    ],
  });
};

export default {
  config,
  bootstrap,
};