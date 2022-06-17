import styles from './PieChart.module.scss';
import { useMemo, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { EChartsOption } from '../../utils/echarts';
import { RefregData } from '../../utils/types';
import { fmtReferrer, referrer } from '../../utils/format';
import useChart from '../../hooks/useChart';

interface PieChartProps {
  data: RefregData | null;
  mkey: string;
}

function PieChart({ data, mkey }: PieChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const chartOption: EChartsOption = useMemo(() => {
    const objectKeys = Object.keys(referrer);
    let total = 0;
    let seriesData;
    if (data) {
      seriesData = objectKeys.map((key) => {
        const value =
          (data && (data as any)[key] && (data as any)[key][mkey]) || 0;
        total += value;
        return {
          name: ' ' + fmtReferrer(key),
          value,
        };
      });
      const pcts = [] as number[];
      seriesData.forEach((item: any) => {
        const pct = Math.ceil((item.value / total) * 100);
        pcts.push(pct);
      });
      const pctsum = pcts.reduce((a, b) => a + b, 0);
      const minus = 100 - pctsum;
      const maxPctIdx = pcts.indexOf(Math.max(...pcts));
      pcts[maxPctIdx] = pcts[maxPctIdx] + minus;
      seriesData.forEach((item, idx) => {
        item.name += `（${pcts[idx]}%）`;
      });
    }

    return {
      textStyle: {
        fontFamily: 'MiSans, sans-serif',
      },
      tooltip: {
        trigger: 'item',
      },
      series: {
        type: 'pie',
        radius: ['40%', '70%'],
        label: {
          position: 'outer',
          alignTo: 'edge',
          edgeDistance: 16,
        },
        data: seriesData || [],
      },
    };
  }, [data, mkey]);

  useChart(chartRef, chartOption);

  return (
    <div className={styles.container}>
      <div className={styles.chart} ref={chartRef}></div>
    </div>
  );
}

export default observer(PieChart);
