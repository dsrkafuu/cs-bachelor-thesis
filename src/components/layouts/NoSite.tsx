import styles from './NoSite.module.scss';
import { Button } from 'antd';
import { UDNoData } from '../../assets';

function NoSite() {
  return (
    <div className={styles.nosite}>
      <UDNoData className={styles.image} />
      <span>未添加可用站点</span>
      <Button type='primary'>前往设置添加</Button>
    </div>
  );
}

export default NoSite;
