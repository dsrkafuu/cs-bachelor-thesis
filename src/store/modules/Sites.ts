import { makeAutoObservable } from 'mobx';
import { Store } from '..';
import { api } from '../../utils/axios';
import { setItem, KEY_CUR_SITE, getItem } from '../../utils/storage';

export interface SiteData {
  _created: string;
  id: string;
  name: string;
  domain: string;
  baseURL?: string;
}

/* istanbul ignore next */
class Sites {
  rootStore: Store = null as never;

  /** @mobx state */
  inited = false;
  sites: SiteData[] = [];
  curSite: SiteData | null = null;

  constructor(rootStore: Store) {
    this.rootStore = rootStore;

    // init mobx
    makeAutoObservable(this, { rootStore: false }, { autoBind: true });
  }

  /** @mobx actions */
  setInited() {
    this.inited = true;
  }
  setSites(sites: SiteData[]) {
    this.sites = sites;
  }
  setCurSite(site: SiteData | string) {
    let curSite: SiteData | null;
    if (typeof site === 'string') {
      curSite = this.sites.find((s) => s.id === site) || null;
    } else {
      curSite = site;
    }
    this.curSite = curSite;
    curSite?.id && setItem(KEY_CUR_SITE, curSite.id);
  }

  async fetchSites() {
    const res = await api.get('/sites');
    const sites = res.data.map((site: any) => ({
      _created: site._created,
      id: site._id,
      name: site.name,
      domain: site.domain,
      baseURL: site.baseURL,
    })) as SiteData[];
    this.setSites(sites);
    if (sites.length > 0) {
      const stored = getItem(KEY_CUR_SITE);
      if (stored) {
        const finded = sites.find((s) => s.id === stored);
        // use site in localStorage
        finded && this.setCurSite(stored);
      } else {
        // use first site as default
        this.setCurSite(sites[0]);
      }
    }
    this.setInited();
  }
  async addSite(name: string, domain: string, baseURL?: string) {
    const res = await api.post('/sites', {
      name,
      domain,
      baseURL,
    });
    const { _created, _id } = res.data;
    const site = { _created, id: _id, name, domain, baseURL };
    this.sites.push(site);
  }
  async modifySite(id: string, name: string, domain: string, baseURL?: string) {
    const res = await api.put(`/sites/${id}`, {
      name,
      domain,
      baseURL,
    });
    const { _created, _id } = res.data;
    const site = { _created, id: _id, name, domain, baseURL };
    const index = this.sites.findIndex((s) => s.id === id);
    this.sites[index] = site;
  }
  async deleteSite(id: string) {
    await api.delete(`/sites/${id}`);
    this.sites = this.sites.filter((s) => s.id !== id);
  }
  async deleteSites(ids: string[]) {
    await api.delete('/sites', { data: { ids } });
    this.sites = this.sites.filter((s) => !ids.includes(s.id));
  }
}

export default Sites;
