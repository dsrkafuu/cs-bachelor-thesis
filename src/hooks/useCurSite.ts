import { runInAction } from 'mobx';
import { useEffect } from 'react';
import useStore from './useStore';

function useCurSite() {
  const { sites } = useStore();
  const loading = !sites.inited;

  useEffect(() => {
    runInAction(() => {
      /* istanbul ignore if */
      if (!loading && sites.sites.length) {
        return;
      }
      sites.fetchSites();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    loading,
    sites: sites.sites,
    curSite: sites.curSite,
    setCurSite: sites.setCurSite,
  };
}

export default useCurSite;
