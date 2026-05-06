"use client";

import type { ChartSpecResolved } from "@/lib/chart-spec";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MUTED = "#5a6d85";
const AXIS_TEXT = "#8b9cb3";
const AXIS_LABEL = "#b8c4d4";
const PIE_COLORS = ["#3d9cf0", "#4ade80", "#fbbf24", "#a78bfa", "#fb7185", "#2dd4bf"];

type Props = {
  chart: ChartSpecResolved;
  rows: Record<string, unknown>[];
  /** Fired when user clicks a chart segment (bar / line point / pie slice). */
  onDatumClick?: (context: { label: string; row: Record<string, unknown> }) => void;
};

function toNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function labelStr(v: unknown): string {
  if (v === null || v === undefined) return "—";
  return String(v);
}

export function InsightChart({ chart, rows, onDatumClick }: Props) {
  if (chart.type === "table" || !chart.xField || !chart.yFields?.length) {
    return null;
  }

  const xKey = chart.xField;
  const y0 = chart.yFields[0];
  const y1 = chart.yFields[1];
  const xLabel = chart.xLabel;
  const yLabel = chart.yLabel;

  const chartData = rows.map((r) => {
    const base: Record<string, unknown> = { ...r };
    base.__x = labelStr(r[xKey]);
    return base;
  });

  const cartesianMargin = {
    top: 8,
    right: 16,
    left: yLabel ? 24 : 0,
    bottom: xLabel ? 24 : 0,
  };

  const commonAxis = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke={MUTED} opacity={0.35} />
      <XAxis
        dataKey="__x"
        tick={{ fill: AXIS_TEXT, fontSize: 11 }}
        interval={0}
        angle={-25}
        textAnchor="end"
        height={xLabel ? 80 : 60}
      >
        {xLabel ? (
          <Label
            value={xLabel}
            position="insideBottom"
            offset={-4}
            fill={AXIS_LABEL}
            style={{ fontSize: 12, fontWeight: 500 }}
          />
        ) : null}
      </XAxis>
      <YAxis tick={{ fill: AXIS_TEXT, fontSize: 11 }} width={yLabel ? 64 : 48}>
        {yLabel ? (
          <Label
            value={yLabel}
            angle={-90}
            position="insideLeft"
            offset={10}
            fill={AXIS_LABEL}
            style={{ fontSize: 12, fontWeight: 500, textAnchor: "middle" }}
          />
        ) : null}
      </YAxis>
      <Tooltip
        contentStyle={{ background: "#0f1419", border: "1px solid #2d3a4d", borderRadius: 8 }}
        labelStyle={{ color: "#e8eef5" }}
        formatter={(value: number | string) => fmtNum(value)}
      />
    </>
  );

  if (chart.type === "pie" && y0) {
    const pieData = rows.map((r) => ({
      name: labelStr(r[xKey]),
      value: toNum(r[y0]),
      __row: r,
    }));
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
              onClick={(_, index) => {
                const row = rows[index];
                if (row && onDatumClick) onDatumClick({ label: labelStr(row[xKey]), row });
              }}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#1a222d" />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => fmtNum(v)} />
          </PieChart>
        </ResponsiveContainer>
        <p className="mt-1 text-center text-xs text-[var(--muted)]">{chart.title}</p>
      </div>
    );
  }

  if (chart.type === "scatter" && y0 && y1) {
    const scat = rows.map((r) => ({
      x: toNum(r[y0]),
      y: toNum(r[y1]),
      label: labelStr(r[xKey]),
      __row: r,
    }));
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{
              top: 8,
              right: 16,
              left: yLabel ? 24 : 8,
              bottom: xLabel ? 24 : 8,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={MUTED} opacity={0.35} />
            <XAxis type="number" dataKey="x" name={y0} tick={{ fill: AXIS_TEXT, fontSize: 11 }}>
              {xLabel ? (
                <Label
                  value={xLabel}
                  position="insideBottom"
                  offset={-4}
                  fill={AXIS_LABEL}
                  style={{ fontSize: 12, fontWeight: 500 }}
                />
              ) : null}
            </XAxis>
            <YAxis
              type="number"
              dataKey="y"
              name={y1}
              tick={{ fill: AXIS_TEXT, fontSize: 11 }}
              width={yLabel ? 64 : 48}
            >
              {yLabel ? (
                <Label
                  value={yLabel}
                  angle={-90}
                  position="insideLeft"
                  offset={10}
                  fill={AXIS_LABEL}
                  style={{ fontSize: 12, fontWeight: 500, textAnchor: "middle" }}
                />
              ) : null}
            </YAxis>
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(v: number) => fmtNum(v)}
              labelFormatter={(_, p) => (p?.[0]?.payload?.label as string) ?? ""}
            />
            <Scatter
              name={chart.title}
              data={scat}
              fill="#3d9cf0"
              onClick={(d: { __row?: Record<string, unknown> }) => {
                const row = d?.__row;
                if (row && onDatumClick) onDatumClick({ label: labelStr(row[xKey]), row });
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
        <p className="mt-1 text-center text-xs text-[var(--muted)]">{chart.title}</p>
      </div>
    );
  }

  if (chart.type === "line") {
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={cartesianMargin}>
            {commonAxis}
            <Legend />
            {chart.yFields.map((y, i) => (
              <Line
                key={y}
                type="monotone"
                dataKey={y}
                stroke={PIE_COLORS[i % PIE_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <p className="mt-1 text-center text-xs text-[var(--muted)]">{chart.title}</p>
      </div>
    );
  }

  if (chart.type === "area") {
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={cartesianMargin}>
            {commonAxis}
            <Legend />
            {chart.yFields.map((y, i) => (
              <Area
                key={y}
                type="monotone"
                dataKey={y}
                stackId="1"
                stroke={PIE_COLORS[i % PIE_COLORS.length]}
                fill={PIE_COLORS[i % PIE_COLORS.length]}
                fillOpacity={0.35}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
        <p className="mt-1 text-center text-xs text-[var(--muted)]">{chart.title}</p>
      </div>
    );
  }

  /* bar (default) */
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={cartesianMargin}>
          {commonAxis}
          <Legend />
          {chart.yFields.map((y, i) => (
            <Bar
              key={y}
              dataKey={y}
              fill={PIE_COLORS[i % PIE_COLORS.length]}
              radius={[4, 4, 0, 0]}
              onClick={(_, index: number) => {
                const row = rows[index];
                if (row && onDatumClick) onDatumClick({ label: labelStr(row[xKey]), row });
              }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-xs text-[var(--muted)]">{chart.title}</p>
    </div>
  );
}

function fmtNum(v: unknown): string {
  if (typeof v === "string" || typeof v === "number") {
    const n = toNum(v);
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return String(v ?? "");
}
