import { makeAutoObservable } from 'mobx';
import Cookies from 'js-cookie';
import { Store } from '..';
import { api } from '../../utils/axios';

export interface AuthData {
  id: string;
  username: string;
  role: string;
  remember: boolean;
}

export interface UserData {
  _created: string;
  id: string;
  username: string;
  role: string;
  root?: boolean;
}

/* istanbul ignore next */
class User {
  rootStore: Store = null as never;

  /** @mobx state */
  inited = false;
  users: UserData[] = [];
  curUser: AuthData | null = null;

  constructor(rootStore: Store) {
    this.rootStore = rootStore;

    // init mobx
    makeAutoObservable(this, { rootStore: false }, { autoBind: true });
  }

  /** @mobx actions */
  setInited() {
    this.inited = true;
  }
  setCurUser(user: AuthData) {
    this.curUser = user;
  }
  clearCurUser() {
    Cookies.remove('auth_token', { path: '/', sameSite: 'Strict' });
    this.curUser = null;
  }
  setUsers(users: UserData[]) {
    this.users = users;
  }

  async fetchAuth() {
    let user: AuthData | null;
    try {
      const data = (await api.get('/auth/verify')).data;
      const { id, u, r, rm } = data;
      user = { id, username: u, role: r, remember: rm } as AuthData;
    } catch {
      user = null;
    }
    if (!user) {
      return false;
    }
    this.setCurUser(user);
    this.setInited();
    return true;
  }
  async fetchUsers() {
    const res = await api.get('/users');
    const users = res.data.map(
      (user: any) =>
        ({
          _created: user._created,
          id: user._id,
          username: user.username,
          role: user.role,
          root: user.root,
        } as UserData)
    );
    this.setUsers(users);
  }
  async addUser(username: string, password: string, role: string) {
    const res = await api.post('/users', {
      username,
      password,
      role,
    });
    const { _created, _id } = res.data;
    const user = { _created, id: _id, role, username };
    this.users.push(user);
  }
  async modifyUser(
    id: string,
    username: string,
    origpass: string,
    password: string,
    role: string
  ) {
    const res = await api.put(`/users/${id}`, {
      username,
      origpass,
      password,
      role,
      root: false,
    });
    const { _created, _id } = res.data;
    const user = { _created, id: _id, role, username };
    const index = this.users.findIndex((s) => s.id === id);
    this.users[index] = user;
  }
  async deleteUser(id: string) {
    await api.delete(`/users/${id}`);
    this.users = this.users.filter((s) => s.id !== id);
  }
  async deleteUsers(ids: string[]) {
    await api.delete('/users', { data: { ids } });
    this.users = this.users.filter((s) => !ids.includes(s.id));
  }
}

export default User;
