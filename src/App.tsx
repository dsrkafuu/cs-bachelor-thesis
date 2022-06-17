import styles from './App.module.scss';
import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Layout } from 'antd';
import useCurUser from './hooks/useCurUser';
import useCurSite from './hooks/useCurSite';
import Loading from './components/miscs/Loading';
import Sidebar from './components/layouts/Sidebar';
import Header from './components/layouts/Header';
import Footer from './components/layouts/Footer';
import NoSite from './components/layouts/NoSite';

/**
 * make sure app is authed
 */
function App() {
  const { loading: userLoading } = useCurUser();
  const { sites, loading: siteLoading } = useCurSite();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const handleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  if (userLoading || siteLoading) {
    return <Loading />;
  }
  return (
    <Layout className={styles.layout}>
      <Header onCollapse={handleCollapse} />
      <Layout>
        <Sidebar collapsed={collapsed} />
        <Layout>
          <Layout.Content>
            {sites.length > 0 || location.pathname === '/settings' ? (
              <Outlet />
            ) : (
              <NoSite />
            )}
          </Layout.Content>
          <Footer />
        </Layout>
      </Layout>
    </Layout>
  );
}

export default observer(App);
