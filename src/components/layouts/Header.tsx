import styles from './Header.module.scss';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { Layout, Button, Select } from 'antd';
import { ISettings, ILogOut, IFingerPrint, IMenu } from '../../icons';
import useCurSite from '../../hooks/useCurSite';
import useCurUser from '../../hooks/useCurUser';
import { version } from '../../../package.json';
import Label from '../basics/Label';
import useStore from '../../hooks/useStore';

interface HeaderProps {
  onCollapse: () => void;
}

function Header({ onCollapse }: HeaderProps) {
  const navigate = useNavigate();
  const { curUser } = useCurUser();
  const { sites, curSite, setCurSite } = useCurSite();
  const { user } = useStore();

  return (
    <Layout.Header className={styles.header}>
      <Button type='primary' icon={<IMenu />} onClick={onCollapse}></Button>
      <div className={styles.logo}>
        <IFingerPrint />
        <h1>DSRAnalytics</h1>
      </div>
      <div>
        <Label>v{version} - #4b2a36e0</Label>
      </div>
      <div>
        <span>站点</span>
        <Select
          className={styles.sites}
          value={curSite?.id}
          onChange={setCurSite}
        >
          {sites.map((site) => (
            <Select.Option key={site.id} value={site.id}>
              {site.name}
            </Select.Option>
          ))}
        </Select>
      </div>
      <div className={styles.space}></div>
      <div className={styles.user}>
        <span>用户</span>
        <Label className={styles.label}>{curUser?.username}</Label>
        <Label
          className={styles.label}
          color='#fff'
          bgColor={curUser?.role === 'admin' ? '#77ccb0' : '#7793cc'}
        >
          {curUser?.role === 'admin' ? '管理员' : '普通用户'}
        </Label>
      </div>
      <div className={styles.ctrl}>
        <Button
          className={styles.btn}
          type='primary'
          icon={<ISettings />}
          onClick={() => navigate('/settings')}
        >
          设置
        </Button>
        <Button
          className={styles.btn}
          type='primary'
          icon={<ILogOut />}
          onClick={() => {
            user.clearCurUser();
            navigate('/login');
          }}
        >
          注销
        </Button>
      </div>
    </Layout.Header>
  );
}

export default observer(Header);
