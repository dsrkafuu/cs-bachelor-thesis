import useStore from './useStore';
import { tzdb } from '../../lib/dayjs';

function useTimezone() {
  const { meta } = useStore();

  return {
    tz: meta.tz,
    tzdb,
  };
}

export default useTimezone;
