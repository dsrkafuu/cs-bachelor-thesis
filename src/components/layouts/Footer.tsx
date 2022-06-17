import styles from './Footer.module.scss';
import { Layout, Select } from 'antd';
import { observer } from 'mobx-react-lite';
import { version } from '../../../package.json';
import { tzdb } from '../../../lib/dayjs';
import useStore from '../../hooks/useStore';

function Footer() {
  const { meta } = useStore();

  return (
    <Layout.Footer className={styles.footer}>
      <span>DSRAnalytics v{version}</span>
      <span>时区</span>
      <Select
        className={styles.tz}
        size='small'
        value={meta.tz}
        onChange={(v) => meta.setTZ(v)}
        showSearch
      >
        {tzdb.map((tz) => (
          <Select.Option key={tz} value={tz}>
            {tz}
          </Select.Option>
        ))}
      </Select>
      <span>&copy;{new Date().getFullYear()} DSRKafuU (NJUPT B18030620)</span>
    </Layout.Footer>
  );
}

export default observer(Footer);
