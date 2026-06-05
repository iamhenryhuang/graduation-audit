import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#44403c", "#e7e5e4"];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "white",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: "8px 14px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      fontSize: "13px",
    }}>
      <strong>{payload[0].name}</strong>：{payload[0].value.toFixed(1)} 學分
    </div>
  );
};

export default function CreditPieChart({ earned, remain }) {
  const data = [
    { name: "已完成", value: earned },
    { name: "尚缺", value: Math.max(remain, 0) },
  ];

  return (
    <PieChart width={320} height={220}>
      <Pie
        data={data}
        cx="50%"
        cy="48%"
        innerRadius={58}
        outerRadius={85}
        paddingAngle={3}
        dataKey="value"
      >
        {data.map((_, i) => (
          <Cell key={i} fill={COLORS[i]} stroke="none" />
        ))}
      </Pie>
      <Tooltip content={<CustomTooltip />} />
      <Legend
        wrapperStyle={{ fontSize: "13px", paddingTop: "8px" }}
        formatter={(value, entry) => (
          <span style={{ color: "#374151" }}>{value}</span>
        )}
      />
    </PieChart>
  );
}
