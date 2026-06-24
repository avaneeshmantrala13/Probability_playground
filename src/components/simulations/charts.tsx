import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartColors } from "./useChartColors";
import { tooltipLabelStyle, tooltipStyle } from "./ui";

export interface BarDatum {
  name: string;
  value: number;
}

/** SVG label rendered above each bar showing its share of the running total. */
function renderPercentLabel(
  props: { x?: string | number; y?: string | number; width?: string | number; value?: string | number },
  total: number,
  fill: string,
) {
  if (total <= 0) return null;
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const width = Number(props.width ?? 0);
  const value = Number(props.value ?? 0);
  const pct = Math.round((value / total) * 100);
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      fill={fill}
      textAnchor="middle"
      fontSize={12}
      fontWeight={600}
    >
      {pct}%
    </text>
  );
}

/** Theme-aware frequency bar chart used by most simulations. */
export function FrequencyBarChart({
  data,
  height = 220,
  perBarColors,
  showPercent = false,
}: {
  data: BarDatum[];
  height?: number;
  /** Optional explicit color per bar; defaults to cycling the palette. */
  perBarColors?: string[];
  /** Show each bar's share of the total as a percentage label above it. */
  showPercent?: boolean;
}) {
  const colors = useChartColors();
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: showPercent ? 24 : 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        <XAxis
          dataKey="name"
          stroke={colors.axis}
          tick={{ fill: colors.axis, fontSize: 12 }}
          tickLine={false}
          interval={0}
        />
        <YAxis
          allowDecimals={false}
          stroke={colors.axis}
          tick={{ fill: colors.axis, fontSize: 12 }}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: colors.grid, opacity: 0.3 }}
          contentStyle={tooltipStyle}
          labelStyle={tooltipLabelStyle}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={
                perBarColors?.[i] ?? colors.series[i % colors.series.length]
              }
            />
          ))}
          {showPercent && (
            <LabelList
              dataKey="value"
              content={(props) => renderPercentLabel(props, total, colors.axis)}
            />
          )}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export interface LineDatum {
  trial: number;
  value: number;
}

/** Running-proportion line chart with an optional theoretical target line. */
export function RunningLineChart({
  data,
  target,
  height = 220,
  yLabel,
}: {
  data: LineDatum[];
  target?: number;
  height?: number;
  yLabel?: string;
}) {
  const colors = useChartColors();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis
          dataKey="trial"
          stroke={colors.axis}
          tick={{ fill: colors.axis, fontSize: 12 }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 1]}
          stroke={colors.axis}
          tick={{ fill: colors.axis, fontSize: 12 }}
          tickLine={false}
          tickFormatter={(v) => `${Math.round(v * 100)}%`}
          label={
            yLabel
              ? { value: yLabel, angle: -90, position: "insideLeft", fill: colors.axis, fontSize: 12 }
              : undefined
          }
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={tooltipLabelStyle}
          formatter={(v: number) => `${(v * 100).toFixed(1)}%`}
        />
        {target !== undefined && (
          <ReferenceLine
            y={target}
            stroke={colors.series[2]}
            strokeDasharray="5 4"
            strokeWidth={1.5}
          />
        )}
        <Line
          type="monotone"
          dataKey="value"
          stroke={colors.accent}
          strokeWidth={2.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
