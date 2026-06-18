"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

const axisTick = { fontSize: 12, fill: "#94a3b8" } as const;
const gridStroke = "#8891a81f";
const tooltipStyle = {
  background: "#111726",
  border: "1px solid #232c44",
  borderRadius: 12,
  color: "#e8ecf6",
  fontSize: 12,
} as const;

type WeeklyDatum = { week: string; completed: number };

export function WeeklyTrend({ data }: { data: WeeklyDatum[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={gridStroke} vertical={false} />
          <XAxis dataKey="week" tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "#6366f1", strokeOpacity: 0.25 }} />
          <Area type="monotone" dataKey="completed" name="Completed" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradCompleted)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

type CategoryDatum = { category: string; count: number };
const categoryColors = ["#6366f1", "#22d3ee", "#a78bfa", "#f59e0b"];

export function CategoryBars({ data }: { data: CategoryDatum[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={gridStroke} vertical={false} />
          <XAxis dataKey="category" tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={40} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#6366f10f" }} />
          <Bar dataKey="count" name="Pieces" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((entry, index) => (
              <Cell key={entry.category} fill={categoryColors[index % categoryColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

type IncomeDatum = { month: string; income: number; goal?: number };

export function IncomeBars({ data }: { data: IncomeDatum[] }) {
  const goal = data.length > 0 ? data[0].goal ?? 0 : 0;
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -6 }}>
          <CartesianGrid stroke={gridStroke} vertical={false} />
          <XAxis dataKey="month" tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => `$${v / 1000}k`} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#6366f10f" }} formatter={(value) => [`$${Number(value).toLocaleString()}`, "Income"]} />
          {goal > 0 && (
            <ReferenceLine y={goal} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: "Goal", position: "right", fill: "#f59e0b", fontSize: 11 }} />
          )}
          <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

type StatusDatum = { name: string; value: number; color: string };

export function StatusDonut({ data }: { data: StatusDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className="relative h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip contentStyle={tooltipStyle} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={2} stroke="none">
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums">{total}</span>
        <span className="text-xs text-muted-foreground">tasks</span>
      </div>
    </div>
  );
}

type FunnelDatum = { stage: string; value: number };

export function FunnelBars({ data }: { data: FunnelDatum[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 6, right: 16, bottom: 0, left: 22 }}>
          <CartesianGrid stroke={gridStroke} horizontal={false} />
          <XAxis type="number" tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="stage" tick={axisTick} tickLine={false} axisLine={false} width={72} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#6366f10f" }} />
          <Bar dataKey="value" name="Candidates" fill="#818cf8" radius={[0, 6, 6, 0]} maxBarSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
