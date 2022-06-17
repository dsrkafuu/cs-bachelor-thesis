import { makeAutoObservable } from 'mobx';
import { Store } from '..';
import dayjs, { tzdb } from '../../../lib/dayjs';
import { getItem, KEY_TZ, setItem } from '../../utils/storage';

export interface StringMap {
  [key: string]: string;
}

class Meta {
  rootStore: Store = null as never;

  /** @mobx state */
  tz = '';

  constructor(rootStore: Store) {
    this.rootStore = rootStore;

    const savedTZ = getItem(KEY_TZ);
    if (savedTZ && typeof savedTZ === 'string') {
      this.setTZ(savedTZ);
    } else {
      const guessedTZ = dayjs.tz.guess();
      this.setTZ(tzdb.includes(guessedTZ) ? guessedTZ : 'Asia/Shanghai');
    }

    // init mobx
    makeAutoObservable(this, { rootStore: false }, { autoBind: true });
  }

  /** @mobx actions */
  setTZ(tz: string) {
    setItem(KEY_TZ, tz);
    this.tz = tz;
  }
}

export default Meta;
