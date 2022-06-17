import styles from './SearchChart.module.scss';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { message } from 'antd';
import { Dayjs } from '../../../lib/dayjs';
import { EChartsOption } from '../../utils/echarts';
import { RefregSearchData } from '../../utils/types';
import useCurSite from '../../hooks/useCurSite';
import { api } from '../../utils/axios';
import useTimezone from '../../hooks/useTimezone';
import useChart from '../../hooks/useChart';

interface SearchChartProps {
  times: [Dayjs, Dayjs];
  mkey: string;
}

function SearchChart({ times, mkey }: SearchChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { curSite } = useCurSite();
  const { tz } = useTimezone();

  const [data, setData] = useState<RefregSearchData>([]);
  const sortedData = useMemo(() => {
    return [...data].sort((a: any, b: any) => a[mkey] - b[mkey]);
  }, [data, mkey]);

  const fetchSearch = useCallback(async () => {
    if (!curSite) {
      return;
    }
    try {
      const res = await api.get(`/metrics/${curSite.id}/refreg/search`, {
        params: {
          from: times[0].valueOf(),
          to: times[1].valueOf(),
          tz,
        },
      });
      const newData = res.data as RefregSearchData;
      if (!newData?.length) {
        return;
      }
      setData(newData);
    } catch {
      message.error('获取搜索引擎趋势数据失败');
      return;
    }
  }, [curSite, tz, times]);
  useEffect(() => {
    fetchSearch();
  }, [fetchSearch]);

  const chartOption: EChartsOption = useMemo(() => {
    let series: any = [];
    if (sortedData.length) {
      series = [
        {
          name: '访问次数（PV）',
          type: 'bar',
          data: sortedData.map((item) => item.pv) || [],
        },
        {
          name: '访客数（UV）',
          type: 'bar',
          data: sortedData.map((item) => item.uv) || [],
        },
      ];
    }
    return {
      textStyle: {
        fontFamily: 'MiSans, sans-serif',
      },
      grid: {
        top: 20,
        bottom: 50,
        left: 80,
        right: 50,
      },
      tooltip: {
        trigger: 'item',
      },
      xAxis: {
        type: 'value',
        boundaryGap: [0, 0.01],
      },
      yAxis: {
        type: 'category',
        data: sortedData.map((item) => item.name) || [],
      },
      series,
    };
  }, [sortedData]);

  useChart(chartRef, chartOption);

  return (
    <div className={styles.container}>
      <div className={styles.chart} ref={chartRef}></div>
    </div>
  );
}

export default observer(SearchChart);
