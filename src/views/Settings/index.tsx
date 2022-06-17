import styles from './index.module.scss';
import { Tabs } from 'antd';
import Title from '../../components/miscs/Title';
import Controller from '../../components/layouts/Controller';
import Sites from './Sites';
import Users from './Users';
import User from './User';
import useCurUser from '../../hooks/useCurUser';
import { observer } from 'mobx-react-lite';
import Logs from './Logs';

function Settings() {
  const { curUser } = useCurUser();

  return (
    <div className={styles.container}>
      <Title>设置</Title>
      <Controller title='设置' mode='none' />
      <div className={styles.content}>
        <Tabs defaultActiveKey='sites' centered>
          <Tabs.TabPane tab='站点管理' key='sites'>
            <Sites />
          </Tabs.TabPane>
          <Tabs.TabPane tab='用户管理' key='users'>
            {curUser?.role === 'admin' ? <Users /> : <User />}
          </Tabs.TabPane>
          {curUser?.role === 'admin' && (
            <Tabs.TabPane tab='应用日志' key='logs'>
              <Logs />
            </Tabs.TabPane>
          )}
        </Tabs>
      </div>
    </div>
  );
}

export default observer(Settings);
