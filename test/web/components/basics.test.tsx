import '@testing-library/jest-dom';
import { render } from '../test-utils';
import DatePicker from '../../../src/components/basics/DatePicker';
import Label from '../../../src/components/basics/Label';

describe('components/basics/DatePicker', () => {
  it('renders date picker', () => {
    const component = render(<DatePicker />);
    expect(component.getByPlaceholderText('请选择日期')).toBeInTheDocument();
  });
});

describe('components/basics/Label', () => {
  it('renders label', () => {
    const component = render(<Label>Label Text</Label>);
    expect(component.getByText('Label Text')).toBeInTheDocument();
  });
});
