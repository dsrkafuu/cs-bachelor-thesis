import locales from './locales.json';

function useLocales() {
  return { locales: locales as any };
}

export default useLocales;
