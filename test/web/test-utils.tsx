import { FC, ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import { StoreContext, store } from '../../src/store';
import { Route, BrowserRouter, Routes } from 'react-router-dom';

const AllTheProviders: FC = ({ children }) => {
  return (
    <StoreContext.Provider value={store}>
      <ConfigProvider
        locale={zhCN}
        autoInsertSpaceInButton={false}
        dropdownMatchSelectWidth={true}
      >
        <BrowserRouter>
          <Routes>
            <Route path='/' element={children} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </StoreContext.Provider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
