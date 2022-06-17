import styles from './WorldMap.module.scss';
import { observer } from 'mobx-react-lite';
import { useMemo, useRef } from 'react';
import { EChartsOption, mercator } from '../../utils/echarts';
import { LocationData } from '../../utils/types';
import useCountry from '../../hooks/useCountry';
import useChart from '../../hooks/useChart';

interface WorldMapProps {
  data: LocationData;
  filtered: string[];
}

function WorldMap({ data, filtered }: WorldMapProps) {
  const { country } = useCountry();

  const chartRef = useRef<HTMLDivElement>(null);

  const chartOption: EChartsOption = useMemo(() => {
    let max = 1;
    const filteredData =
      filtered.length > 0
        ? data.filter((item) => filtered.includes(item.c))
        : data;
    const uvMap = {};
    const seriesData = filteredData.map((item) => {
      const value = item.pv;
      if (value > max) {
        max = value;
      }
      const cName = country[item.c] || '未知';
      (uvMap as any)[cName] = item.uv || 0;
      return {
        name: cName,
        value,
      };
    });

    return {
      grid: { top: 0, left: 0, right: 0, bottom: 0 },
      textStyle: {
        fontFamily: 'MiSans, sans-serif',
      },
      tooltip: {
        trigger: 'item',
      },
      visualMap: {
        min: 0,
        max,
        inRange: {
          color: ['#afbfe1', '#9db1da', '#8aa2d3', '#7793cc', '#6585c5'],
        },
      },
      series: [
        {
          type: 'map',
          map: 'World',
          nameMap: country,
          zoom: 2,
          scaleLimit: {
            min: 2,
            max: 16,
          },
          center: [0.1, -0.5],
          tooltip: {
            formatter(params: any) {
              const name = params.name;
              const pv = params.value || 0;
              const uv = (uvMap as any)[name] || 0;
              return `${name}<br/>PV ${pv}<br/>UV ${uv}`;
            },
          },
          selectedMode: false,
          roam: true,
          projection: mercator,
          itemStyle: {
            borderColor: '#7793cc',
            borderWidth: 1,
          },
          emphasis: {
            label: {
              show: false,
            },
            itemStyle: {
              borderColor: '#7793cc',
              areaColor: '#c2cee8',
              borderWidth: 1,
            },
          },
          data: seriesData,
        },
      ],
    };
  }, [country, data, filtered]);

  useChart(chartRef, chartOption);

  return (
    <div className={styles.container}>
      <div className={styles.chart} ref={chartRef}></div>
    </div>
  );
}

export default observer(WorldMap);
