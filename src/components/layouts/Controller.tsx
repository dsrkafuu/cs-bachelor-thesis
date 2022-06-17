import styles from './Controller.module.scss';
import dayjs, { Dayjs } from '../../../lib/dayjs';
import { Button, Checkbox, Select } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import DatePicker from '../basics/DatePicker';
import { IDownload } from '../../icons';
import _export from '../../utils/export';

interface ControllerProps {
  title: string;
  mode: 'single' | 'range' | 'time' | 'none';
  exporter?: { path: string; params?: any };
  value?: any;
  onChange?: any;
  children?: React.ReactNode;
}

function Controller({
  title,
  mode,
  value,
  exporter,
  onChange,
  children,
}: ControllerProps) {
  const [realtime, setRealtime] = useState<number | null>(null);
  const handleCheckRealtime = useCallback(
    (e: any) => {
      const checked = e.target.checked;
      if (checked) {
        onChange(dayjs());
        const int = window.setInterval(() => {
          onChange(dayjs());
        }, 10000); // refresh time every 10s
        setRealtime(int);
      } else {
        realtime && window.clearInterval(realtime);
        setRealtime(null);
      }
    },
    [onChange, realtime]
  );
  useEffect(() => {
    return () => {
      realtime && window.clearInterval(realtime);
    };
  }, [realtime]);

  const diff = useMemo(() => {
    if (Array.isArray(value)) {
      return value[1].diff(value[0], 'hour');
    }
    return 0;
  }, [value]);
  /* istanbul ignore next */
  const handleTimeChange = useCallback(
    (value: string) => {
      if (value === '1') {
        onChange([dayjs().subtract(1, 'hour'), dayjs()]);
      } else if (value === '12') {
        onChange([dayjs().subtract(12, 'hour'), dayjs()]);
      } else if (value === '24') {
        onChange([dayjs().subtract(24, 'hour'), dayjs()]);
      }
    },
    [onChange]
  );

  const [exportLoading, setExportLoading] = useState(false);

  return (
    <div className={styles.controller}>
      {exporter && (
        <Button
          type='primary'
          loading={exportLoading}
          icon={<IDownload />}
          style={{ marginRight: '20px' }}
          onClick={() => {
            setExportLoading(true);
            _export(exporter.path, exporter.params || {}).then(() => {
              setExportLoading(false);
            });
          }}
        />
      )}
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.children}>{children}</div>
      {mode === 'none' ? null : mode === 'time' ? (
        <div className={styles.time}>
          <span className={styles.text}>时间</span>
          <Select value={`${diff}`} onChange={handleTimeChange}>
            <Select.Option value='1'>1 小时</Select.Option>
            <Select.Option value='12'>12 小时</Select.Option>
            <Select.Option value='24'>24 小时</Select.Option>
          </Select>
        </div>
      ) : mode === 'single' ? (
        <div className={styles.time}>
          <span className={styles.text}>日期</span>
          <DatePicker
            showTime={false}
            format='YYYY-MM-DD'
            value={value as Dayjs}
            onChange={(e) => {
              e && onChange(e);
            }}
          />
          <Checkbox
            className={styles.realtime}
            checked={!!realtime}
            onChange={handleCheckRealtime}
          >
            实时模式
          </Checkbox>
        </div>
      ) : (
        <div className={styles.time}>
          <span className={styles.text}>日期范围</span>
          <DatePicker.RangePicker
            format='YYYY-MM-DD'
            value={value}
            onChange={(e) => {
              if (e && e.length === 2) {
                const start = e[0];
                const end = e[1];
                if (start && end) {
                  // set time of start day to 00:00:00, end day to 23:59:59
                  onChange([start.startOf('day'), end.endOf('day')]);
                }
              }
            }}
            ranges={{
              当日: [dayjs(), dayjs()],
              '24 时': [dayjs().subtract(1, 'day'), dayjs()],
              '7 日': [
                dayjs().subtract(7, 'day').startOf('day'),
                dayjs().subtract(1, 'day').endOf('day'),
              ],
              '15 日': [
                dayjs().subtract(15, 'day').startOf('day'),
                dayjs().subtract(1, 'day').endOf('day'),
              ],
              '30 日': [
                dayjs().subtract(30, 'day').startOf('day'),
                dayjs().subtract(1, 'day').endOf('day'),
              ],
              '90 日': [
                dayjs().subtract(90, 'day').startOf('day'),
                dayjs().subtract(1, 'day').endOf('day'),
              ],
            }}
          />
        </div>
      )}
    </div>
  );
}

export default Controller;
