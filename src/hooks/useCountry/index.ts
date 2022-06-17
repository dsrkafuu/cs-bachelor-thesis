import country from './country.json';

function useCountry() {
  return { country: country as any };
}

export default useCountry;
