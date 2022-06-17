import styles from './TrendChart.module.scss';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { message } from 'antd';
import dayjs, { Dayjs } from '../../../lib/dayjs';
import { TrendData } from '../../utils/types';
import { EChartsOption } from '../../utils/echarts';
import useCurSite from '../../hooks/useCurSite';
import { api } from '../../utils/axios';
import useChart from '../../hooks/useChart';

interface TrendChartProps {
  time: Dayjs;
}

function TrendChart({ time }: TrendChartProps) {
  const { curSite } = useCurSite();

  const chartRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<TrendData>([]);

  const fetchList = useCallback(async () => {
    if (!curSite) {
      return;
    }
    try {
      const res = await api.get(`/metrics/${curSite.id}/trend`, {
        params: {
          from: time.startOf('day').valueOf(),
          to: time.endOf('day').valueOf(),
        },
      });
      const data = res.data as TrendData;
      setData(data);
    } catch {
      message.error('获取站点趋势失败');
    }
  }, [curSite, time]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const chartOption: EChartsOption = useMemo(() => {
    const xAxisData = data.map((item) => {
      return dayjs(`2000-01-01 ${item.date}:00`).format('HH:mm');
    });
    const series = [
      {
        name: '访问次数（PV）',
        type: 'line' as const,
        data: data.map((item) => item.pv),
        smooth: true,
      },
      {
        name: '访客数（UV）',
        type: 'line' as const,
        data: data.map((item) => item.uv),
        smooth: true,
      },
      {
        name: '独立错误',
        type: 'line' as const,
        data: data.map((item) => item.des),
        smooth: true,
      },
    ];

    const legendData = series.map((item) => item.name);

    return {
      textStyle: {
        fontFamily: 'MiSans, sans-serif',
      },
      grid: {
        top: 30,
        bottom: 48,
        left: 60,
        right: 150,
      },
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: legendData,
        orient: 'vertical',
        align: 'left',
        x: 'right',
        y: 'center',
        textStyle: {
          width: 200,
          overflow: 'truncate',
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisData,
      },
      yAxis: {
        type: 'value',
      },
      series,
    };
  }, [data]);

  useChart(chartRef, chartOption);

  return (
    <div className={styles.container}>
      <div className={styles.chart} ref={chartRef}></div>
    </div>
  );
}

export default observer(TrendChart);
