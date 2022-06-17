import { createContext } from 'react';
import { configure } from 'mobx';

// store modules
import User from './modules/User';
import Sites from './modules/Sites';
import Meta from './modules/Meta';

// mobx linter
configure({
  enforceActions: 'never',
  computedRequiresReaction: false,
  observableRequiresReaction: false,
  reactionRequiresObservable: false,
});

/**
 * combined root store
 */
export class Store {
  meta = new Meta(this);
  user = new User(this);
  sites = new Sites(this);
}

// init store instance
export const store = new Store();
export const StoreContext = createContext(store);
