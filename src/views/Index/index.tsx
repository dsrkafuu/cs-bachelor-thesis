import styles from './index.module.scss';
import { useCallback, useState } from 'react';
import { observer } from 'mobx-react-lite';
import dayjs, { Dayjs } from '../../../lib/dayjs';
import Controller from '../../components/layouts/Controller';
import Title from '../../components/miscs/Title';
import CentralBar from './CentralBar';
import TrendChart from './TrendChart';
import PagesGrid from './PagesGrid';
import RefGrid from './RefGrid';
import PlatGrid from './PlatGrid';

function Index() {
  const [time, setTime] = useState<Dayjs>(dayjs('2022-05-15T23:00:00+08:00'));
  const handleTimeChange = useCallback((range) => {
    setTime(range);
  }, []);

  return (
    <div className={styles.container}>
      <Title>概况</Title>
      <Controller
        mode='single'
        title='概况'
        value={time}
        onChange={handleTimeChange}
      />
      <div className={styles.content}>
        <CentralBar time={time} />
        <TrendChart time={time} />
      </div>
      <div className={styles.content}>
        <PlatGrid time={time} />
        <PagesGrid time={time} />
        <RefGrid time={time} />
      </div>
    </div>
  );
}

export default observer(Index);
