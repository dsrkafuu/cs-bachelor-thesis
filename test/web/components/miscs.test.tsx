import '@testing-library/jest-dom';
import { render } from '../test-utils';
import Loading from '../../../src/components/miscs/Loading';
import Redirect from '../../../src/components/miscs/Redirect';
import Title from '../../../src/components/miscs/Title';

describe('components/miscs/Loading', () => {
  it('renders loading page', () => {
    render(<Loading />);
  });
});

describe('components/miscs/Redirect', () => {
  it('renders redirect page', () => {
    render(<Redirect path='/' />);
  });
});

describe('components/miscs/Title', () => {
  it('renders title', () => {
    render(<Title>测试</Title>);
  });
});
