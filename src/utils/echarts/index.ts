import * as echarts from 'echarts/core';
import {
  BarChart,
  BarSeriesOption,
  LineChart,
  LineSeriesOption,
  PieChart,
  PieSeriesOption,
  MapChart,
  MapSeriesOption,
} from 'echarts/charts';
import {
  GridComponent,
  GridComponentOption,
  TooltipComponent,
  TooltipComponentOption,
  LegendComponent,
  LegendComponentOption,
  VisualMapComponent,
  VisualMapComponentOption,
  GeoComponent,
  GeoComponentOption,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import custom from './theme.json';
import world from './world.json';

export type EChartsOption = echarts.ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | PieSeriesOption
  | MapSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | LegendComponentOption
  | VisualMapComponentOption
  | GeoComponentOption
>;

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  MapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  GeoComponent,
  SVGRenderer,
]);
echarts.registerTheme('custom', custom);
echarts.registerMap('World', world as any);

export const mercator = {
  project: (point: number[]) => {
    return [
      (point[0] / 180) * Math.PI,
      -Math.log(Math.tan((Math.PI / 2 + (point[1] / 180) * Math.PI) / 2)),
    ];
  },
  unproject: (point: number[]) => [
    (point[0] * 180) / Math.PI,
    ((2 * 180) / Math.PI) * Math.atan(Math.exp(point[1])) - 90,
  ],
};

export default echarts;
