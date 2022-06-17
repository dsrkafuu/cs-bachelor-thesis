import { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import useCurSite from '../../hooks/useCurSite';

interface HelmatProps {
  children?: React.ReactNode;
}

function Title({ children }: HelmatProps) {
  const { curSite } = useCurSite();
  const title = useMemo(() => curSite?.name || 'DSRAnalytics', [curSite?.name]);

  return (
    <Helmet>
      <title>
        {children} | {title}
      </title>
    </Helmet>
  );
}

export default Title;
