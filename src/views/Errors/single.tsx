import styles from './single.module.scss';
import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, message, Space, Spin } from 'antd';
import dayjs from '../../../lib/dayjs';
import Title from '../../components/miscs/Title';
import Controller from '../../components/layouts/Controller';
import useCurSite from '../../hooks/useCurSite';
import { api } from '../../utils/axios';
import { ErrorsSingleData } from '../../utils/types';
import Label from '../../components/basics/Label';
import { fmtErrtype } from '../../utils/format';
import SessionTable from './SessionTable';
import StackViewer from './StackViewer';

function Single() {
  const { eid } = useParams();
  const { curSite } = useCurSite();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ErrorsSingleData | null>(null);

  const fetchList = useCallback(async () => {
    if (!curSite) {
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/metrics/${curSite.id}/errors/${eid}`, {});
      const data = res.data as ErrorsSingleData;
      setData(data);
      setLoading(false);
    } catch {
      navigate('/errors');
      setLoading(false);
    }
  }, [curSite, eid, navigate]);
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handlePutStatus = useCallback(
    async (eid: string | undefined, newStatus: string) => {
      if (!curSite) {
        return;
      }
      try {
        setLoading(true);
        const res = await api.put(`/metrics/${curSite.id}/errors/${eid}`, {
          status: newStatus,
        });
        const data = res.data as any;
        const modified = data.modifiedCount as number;
        if (modified > 0) {
          message.success(`修改 ${modified} 个错误状态成功`);
          fetchList();
        } else {
          message.error('修改错误状态失败');
          setLoading(false);
        }
      } catch {
        message.error('修改错误状态失败');
        setLoading(false);
      }
    },
    [curSite, fetchList]
  );

  const handleDelItem = useCallback(
    async (eid: string | undefined) => {
      if (!curSite) {
        return;
      }
      try {
        setLoading(true);
        const res = await api.delete(`/metrics/${curSite.id}/errors/${eid}`);
        const data = res.data as any;
        const deleted = data.deletedCount as number;
        if (deleted > 0) {
          message.success(`删除 ${deleted} 个错误成功`);
          navigate('/errors');
        } else {
          message.error('删除错误失败');
          setLoading(false);
        }
      } catch {
        message.error('删除错误失败');
        setLoading(false);
      }
    },
    [curSite, navigate]
  );

  return (
    <div className={styles.container}>
      <Title>错误监控</Title>
      <Controller mode='none' title={`错误 ${eid}`} />
      <div className={styles.content}>
        <Spin spinning={loading}>
          <div className={styles.basics}>
            <div className={styles.meta}>
              <div>
                <Label className={styles.label}>{fmtErrtype(data?.type)}</Label>
                <span className={styles.name}>{data?.name}</span>
              </div>
              <div className={styles.desc}>{data?.message}</div>
              {(data?.rmessages || []).length > 0 && (
                <div className={styles.desc}>{(data?.rmessages || [])[0]}</div>
              )}
            </div>
            <div className={styles.ebox}>
              <div>
                <div>错误次数</div>
                <div>{data?.pv}</div>
              </div>
              <div>
                <div>访客数</div>
                <div>{data?.uv}</div>
              </div>
              <div>
                <div>
                  最后出现&nbsp;&nbsp;
                  {dayjs(data?.last).format('YYYY-MM-DD HH:MM')}
                </div>
                <div>
                  首次出现&nbsp;&nbsp;
                  {dayjs(data?.first).format('YYYY-MM-DD HH:MM')}
                </div>
              </div>
            </div>
          </div>
        </Spin>
        <Space className={styles.ctrl}>
          <span>当前状态</span>
          <Label>
            {data?.status === 'resolved'
              ? '已修复'
              : data?.status === 'reviewed'
              ? '已确认'
              : '未确认'}
          </Label>
          {data?.status !== 'unresolved' && (
            <Button onClick={() => handlePutStatus(eid, 'unresolved')}>
              标为未确认
            </Button>
          )}
          {data?.status !== 'reviewed' && (
            <Button
              type={data?.status === 'unresolved' ? 'primary' : 'default'}
              onClick={() => handlePutStatus(eid, 'reviewed')}
            >
              标为已确认
            </Button>
          )}
          {data?.status !== 'resolved' && (
            <Button
              type={data?.status === 'reviewed' ? 'primary' : 'default'}
              onClick={() => handlePutStatus(eid, 'resolved')}
            >
              标为已修复
            </Button>
          )}
          <Button danger onClick={() => handleDelItem(eid)}>
            删除
          </Button>
        </Space>
      </div>
      <StackViewer loading={loading} data={data} />
      <SessionTable loading={loading} data={data} />
    </div>
  );
}

export default Single;
