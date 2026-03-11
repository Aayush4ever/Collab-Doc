import { create } from 'zustand';

const savedTheme = localStorage.getItem('theme');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

export const useThemeStore = create((set) => ({
  isDark: savedTheme ? savedTheme === 'dark' : systemDark,

  toggleTheme: () => {
    set((state) => {
      const newDark = !state.isDark;
      localStorage.setItem('theme', newDark ? 'dark' : 'light');
      return { isDark: newDark };
    });
  },

  setTheme: (dark) => {
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    set({ isDark: dark });
  },
}));
