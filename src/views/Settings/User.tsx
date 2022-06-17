import styles from './User.module.scss';
import { Col, Row } from 'antd';
import { observer } from 'mobx-react-lite';
import UserForm from './UserForm';
import useCurUser from '../../hooks/useCurUser';

function User() {
  const { curUser } = useCurUser();

  return (
    <div className={styles.container}>
      <Row>
        <Col span={12}>
          <UserForm
            mode='edit'
            noAdminMode
            data={{
              id: curUser?.id || '',
              username: curUser?.username || '',
              password: '',
              role: 'user',
              root: false,
            }}
          />
        </Col>
      </Row>
    </div>
  );
}

export default observer(User);
