import styles from './index.module.scss';
import { observer } from 'mobx-react-lite';
import LoginForm from './LoginForm';
import { IFingerPrint } from '../../icons';

function Login() {
  return (
    <div className={styles.login}>
      <div className={styles.title}>
        <IFingerPrint />
        <h1>DSRAnalytics</h1>
      </div>
      <LoginForm />
    </div>
  );
}

export default observer(Login);
