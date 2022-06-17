import { useEffect } from 'react';
import echarts, { EChartsOption } from '../utils/echarts';

function useChart(
  chartRef: React.RefObject<HTMLDivElement>,
  chartOption: EChartsOption
) {
  useEffect(() => {
    if (!chartRef.current) {
      return;
    }
    const chart = echarts.init(chartRef.current, 'custom', {
      renderer: 'svg',
    });
    chart.setOption(chartOption);
    const resize = () => {
      chart.resize();
    };
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      chart.dispose();
    };
  }, [chartOption, chartRef]);
}

export default useChart;
