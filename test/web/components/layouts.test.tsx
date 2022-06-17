import '@testing-library/jest-dom';
import { render, fireEvent } from '../test-utils';
import dayjs from '../../../lib/dayjs';
import Controller from '../../../src/components/layouts/Controller';
import Footer from '../../../src/components/layouts/Footer';
import NoSite from '../../../src/components/layouts/NoSite';

describe('components/layouts/Controller', () => {
  it('renders controller', () => {
    const component = render(<Controller title='测试' mode='none' />);
    expect(component.getByText('测试')).toBeInTheDocument();
  });
  it('renders controller in time mode', () => {
    const component = render(<Controller title='测试' mode='time' />);
    expect(component.getByText('时间')).toBeInTheDocument();
  });
  it('renders controller in single mode', () => {
    const onChange = jest.fn();
    const component = render(
      <Controller title='测试' mode='single' onChange={onChange} />
    );
    expect(component.getByLabelText('实时模式')).toBeInTheDocument();
    fireEvent.click(component.getByLabelText('实时模式'));
    fireEvent.click(component.getByLabelText('实时模式'));
    expect(onChange).toHaveBeenCalled();
  });
  it('renders controller in range mode', () => {
    const component = render(
      <Controller
        title='测试'
        mode='range'
        value={[dayjs().subtract(2, 'd'), dayjs()]}
      />
    );
    expect(component.getByText('日期范围')).toBeInTheDocument();
  });
});

describe('components/layouts/Footer', () => {
  it('renders footer', () => {
    render(<Footer />);
  });
});

describe('components/layouts/NoSite', () => {
  it('renders no site', () => {
    const component = render(<NoSite />);
    expect(component.getByText('未添加可用站点')).toBeInTheDocument();
  });
});
