import styles from './SessionTable.module.scss';
import { ErrorsSingleData } from '../../utils/types';
import { Table } from 'antd';
import { useMemo } from 'react';
import { fmtArch, fmtPlatform } from '../../utils/format';

interface SessionTableProps {
  data: ErrorsSingleData | null;
  loading: boolean;
}

function SessionTable({ data, loading }: SessionTableProps) {
  const columns = useMemo(() => {
    return [
      {
        title: '浏览器',
        key: 'browser',
        dataIndex: 'browser',
      },
      {
        title: '版本号',
        key: 'version',
        dataIndex: 'version',
      },
      {
        title: '系统',
        key: 'system',
        dataIndex: 'system',
      },
      {
        title: '设备类型',
        key: 'platform',
        render: (record: any) => fmtPlatform(record.platform),
      },
      {
        title: '设备架构',
        key: 'arch',
        render: (record: any) => fmtArch(record.arch, record.platform),
      },
      {
        title: '错误次数',
        key: 'pv',
        dataIndex: 'pv',
      },
    ];
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.title}>Session 信息</div>
      <Table
        className={styles.table}
        loading={loading}
        size='small'
        rowKey={(r) => r.browser + r.version + r.system + r.platform + r.arch}
        dataSource={data?.sessions || []}
        columns={columns as any}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
}

export default SessionTable;
