import styles from './SessionModal.module.scss';
import { observer } from 'mobx-react-lite';
import { Button, Col, message, Modal, Row, Spin } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import dayjs from '../../../lib/dayjs';
import Label from '../../components/basics/Label';
import { api } from '../../utils/axios';
import { SessionData } from '../../utils/types';
import useCountry from '../../hooks/useCountry';
import useLocales from '../../hooks/useLocales';
import { fmtArch, fmtPlatform } from '../../utils/format';
import useCurSite from '../../hooks/useCurSite';

interface SessionModalProps {
  sid?: string;
  onCancel?: () => void;
}

function SessionModal({ sid, onCancel }: SessionModalProps) {
  const { curSite } = useCurSite();
  const { country } = useCountry();
  const { locales } = useLocales();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SessionData | null>(null);

  // fetch list on site change/realtime mode update
  const fetchSession = useCallback(async () => {
    if (!sid) {
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/metrics/${curSite}/sessions/${sid}`);
      const data = res.data as SessionData;
      setData(data);
      setLoading(false);
    } catch {
      setLoading(false);
      message.error('获取访客信息失败');
    }
  }, [curSite, sid]);
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return (
    <Modal
      title='访客信息'
      visible={!!sid}
      onCancel={onCancel}
      footer={[
        <Button key='cancel' onClick={onCancel}>
          关闭
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        <div className={styles.container}>
          <Row className={styles.row}>
            <Col span={24}>
              <span className={styles.llabel}>访客唯一标识</span>
              <Label>{sid}</Label>
            </Col>
          </Row>
          <Row className={styles.row}>
            <Col span={24}>
              <span className={styles.llabel}>首次访问时间</span>
              <span>{dayjs(data?._created).format('YYYY-MM-DD HH:mm:ss')}</span>
            </Col>
          </Row>
          <Row className={styles.row}>
            <Col span={24}>
              <span className={styles.slabel}>IP</span>
              <Label>{data?.ip}</Label>
            </Col>
          </Row>
          <Row className={styles.row}>
            <Col span={12}>
              <span className={styles.slabel}>地区</span>
              <span>
                {country && data?.location ? country[data.location] : '未知'}
              </span>
            </Col>
            <Col span={12}>
              <span className={styles.slabel}>语言</span>
              <span>
                {locales && data?.language ? locales[data.language] : '未知'}
              </span>
            </Col>
          </Row>
          <Row className={styles.row}>
            <Col span={12}>
              <span className={styles.slabel}>浏览器</span>
              <span>{data?.browser}</span>
            </Col>
            <Col span={12}>
              <span className={styles.slabel}>版本</span>
              <span>{data?.version}</span>
            </Col>
          </Row>
          <Row className={styles.row}>
            <Col span={12}>
              <span className={styles.slabel}>系统</span>
              <span>{data?.system}</span>
            </Col>
            <Col span={12}>
              <span className={styles.slabel}>分辨率</span>
              <span>{data?.screen}</span>
            </Col>
          </Row>
          <Row className={styles.row}>
            <Col span={12}>
              <span className={styles.slabel}>类型</span>
              <span>{fmtPlatform(data?.platform)}</span>
            </Col>
            <Col span={12}>
              <span className={styles.slabel}>架构</span>
              <span>{fmtArch(data?.archtecture, data?.platform)}</span>
            </Col>
          </Row>
          {!!data?.model && (
            <Row className={styles.row}>
              <Col span={24}>
                <span className={styles.slabel}>型号</span>
                <Label>{data?.model}</Label>
              </Col>
            </Row>
          )}
        </div>
      </Spin>
    </Modal>
  );
}

export default observer(SessionModal);
