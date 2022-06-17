import styles from './Sidebar.module.scss';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  IBug,
  IDesktop,
  IDocumentText,
  IList,
  IScale,
  ISpeedometer,
  ITrendingUp,
} from '../../icons';

interface SidebarProps {
  collapsed: boolean;
}

function Sidebar({ collapsed }: SidebarProps) {
  const { pathname } = useLocation();
  const simplePath = '/' + (pathname.split('/')[1] || '');

  return (
    <Layout.Sider
      className={styles.sidebar}
      collapsed={collapsed}
      theme='light'
    >
      <Menu
        defaultOpenKeys={['/content', '/client']}
        mode='inline'
        selectedKeys={[simplePath]}
      >
        <Menu.Item key='/' icon={<IScale />}>
          <Link to='/'>概况</Link>
        </Menu.Item>
        <Menu.Item key='/log' icon={<IList />}>
          <Link to='/log'>访问记录</Link>
        </Menu.Item>
        <Menu.Item key='/trend' icon={<ITrendingUp />}>
          <Link to='/trend'>站点趋势</Link>
        </Menu.Item>
        <Menu.Item key='/errors' icon={<IBug />}>
          <Link to='/errors'>错误监控</Link>
        </Menu.Item>
        <Menu.SubMenu key='/content' title='内容数据' icon={<IDocumentText />}>
          <Menu.Item key='/pages'>
            <Link to='/pages'>受访页面</Link>
          </Menu.Item>
          <Menu.Item key='/refreg'>
            <Link to='/refreg'>来路分类</Link>
          </Menu.Item>
          <Menu.Item key='/referrer'>
            <Link to='/referrer'>来路情况</Link>
          </Menu.Item>
        </Menu.SubMenu>
        <Menu.SubMenu key='/client' title='用户信息' icon={<IDesktop />}>
          <Menu.Item key='/system'>
            <Link to='/system'>系统环境</Link>
          </Menu.Item>
          <Menu.Item key='/location'>
            <Link to='/location'>国家/地区</Link>
          </Menu.Item>
        </Menu.SubMenu>
        <Menu.Item key='/vitals' icon={<ISpeedometer />}>
          <Link to='/vitals'>Web Vitals</Link>
        </Menu.Item>
      </Menu>
    </Layout.Sider>
  );
}

export default Sidebar;
