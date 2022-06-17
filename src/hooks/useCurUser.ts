import { runInAction } from 'mobx';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from './useStore';

function useCurUser() {
  const navigate = useNavigate();
  const { user } = useStore();
  const loading = !user.inited;

  useEffect(() => {
    runInAction(() => {
      if (!loading && user.curUser) {
        return;
      }
      user.fetchAuth().then((success) => {
        if (!success) {
          navigate('/login');
        }
        if (user.curUser?.role === 'admin') {
          user.fetchUsers();
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    loading,
    curUser: user.curUser,
  };
}

export default useCurUser;
