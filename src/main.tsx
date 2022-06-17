import 'antd/dist/antd.less';
import 'dsr-design/css/reset.css';
import './styles/global.scss';

import ReactDOM from 'react-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import { StoreContext, store } from './store';

import App from './App';
import Login from './views/Login';
import Index from './views/Index';
import Log from './views/Log';
import Pages from './views/Pages';
import Trend from './views/Trend';
import Errors from './views/Errors';
import ErrorsSingle from './views/Errors/single';
import Settings from './views/Settings';
import Referrer from './views/Referrer';
import System from './views/System';
import Location from './views/Location';
import Refreg from './views/Refreg';
import Vitals from './views/Vitals';

ReactDOM.render(
  <StoreContext.Provider value={store}>
    <ConfigProvider
      locale={zhCN}
      autoInsertSpaceInButton={false}
      dropdownMatchSelectWidth={true}
    >
      <BrowserRouter>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/' element={<App />}>
            <Route index element={<Index />} />
            <Route path='log' element={<Log />} />
            <Route path='trend' element={<Trend />} />
            <Route path='errors' element={<Errors />} />
            <Route path='errors/:eid' element={<ErrorsSingle />} />
            <Route path='pages' element={<Pages />} />
            <Route path='referrer' element={<Referrer />} />
            <Route path='refreg' element={<Refreg />} />
            <Route path='system' element={<System />} />
            <Route path='location' element={<Location />} />
            <Route path='vitals' element={<Vitals />} />
            <Route path='settings' element={<Settings />} />
          </Route>
          <Route path='*' element={'404'} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  </StoreContext.Provider>,
  document.getElementById('root')
);
