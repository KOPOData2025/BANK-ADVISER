import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

const PortfolioVisualization = ({ customer }) => {
  if (!customer) return null;

  // 포트폴리오 할당 데이터 파싱
  const portfolioAllocation = customer.portfolioAllocation
    ? JSON.parse(customer.portfolioAllocation)
    : { deposits: 40, funds: 30, loans: 20, insurance: 10 };

  // 파이 차트 데이터
  const pieData = [
    { name: "예금", value: portfolioAllocation.deposits, color: "#4F46E5" },
    { name: "펀드", value: portfolioAllocation.funds, color: "#10B981" },
    { name: "대출", value: portfolioAllocation.loans, color: "#F59E0B" },
    { name: "보험", value: portfolioAllocation.insurance, color: "#EF4444" },
  ];

  // 자산 구성 바 차트 데이터
  const assetData = [
    {
      category: "총 자산",
      amount: customer.totalAssets || 0,
      color: "#4F46E5",
    },
    {
      category: "월 소득",
      amount: customer.monthlyIncome || 0,
      color: "#10B981",
    },
  ];

  // 금융 건강도 데이터
  const healthScore = customer.financialHealthScore || 70;
  const healthData = [
    { name: "현재", score: healthScore },
    { name: "목표", score: 85 },
  ];

  // 위험도별 색상
  const getRiskColor = (risk) => {
    switch (risk) {
      case "안전":
        return "#10B981";
      case "보통":
        return "#F59E0B";
      case "공격적":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "var(--hana-space-4)",
        marginTop: "var(--hana-space-4)",
      }}
    >
      {/* 포트폴리오 할당 파이 차트 */}
      <div
        style={{
          background: "var(--hana-white)",
          borderRadius: "var(--hana-radius-lg)",
          padding: "var(--hana-space-4)",
          boxShadow: "var(--hana-shadow-light)",
          border: "1px solid var(--hana-border)",
        }}
      >
        <h3
          style={{
            color: "var(--hana-primary)",
            marginBottom: "var(--hana-space-3)",
            fontSize: "var(--hana-font-size-lg)",
            fontWeight: "600",
          }}
        >
          📊 포트폴리오 할당
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 자산 구성 바 차트 */}
      <div
        style={{
          background: "var(--hana-white)",
          borderRadius: "var(--hana-radius-lg)",
          padding: "var(--hana-space-4)",
          boxShadow: "var(--hana-shadow-light)",
          border: "1px solid var(--hana-border)",
        }}
      >
        <h3
          style={{
            color: "var(--hana-primary)",
            marginBottom: "var(--hana-space-3)",
            fontSize: "var(--hana-font-size-lg)",
            fontWeight: "600",
          }}
        >
          💰 자산 현황
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={assetData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
            />
            <Tooltip
              formatter={(value) => [`${value.toLocaleString()}원`, "금액"]}
              labelStyle={{ color: "var(--hana-primary)" }}
            />
            <Bar dataKey="amount" fill="#4F46E5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 금융 건강도 */}
      <div
        style={{
          background: "var(--hana-white)",
          borderRadius: "var(--hana-radius-lg)",
          padding: "var(--hana-space-4)",
          boxShadow: "var(--hana-shadow-light)",
          border: "1px solid var(--hana-border)",
        }}
      >
        <h3
          style={{
            color: "var(--hana-primary)",
            marginBottom: "var(--hana-space-3)",
            fontSize: "var(--hana-font-size-lg)",
            fontWeight: "600",
          }}
        >
          🏥 금융 건강도
        </h3>
        <div
          style={{ textAlign: "center", marginBottom: "var(--hana-space-3)" }}
        >
          <div
            style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
              color:
                healthScore >= 80
                  ? "#10B981"
                  : healthScore >= 60
                  ? "#F59E0B"
                  : "#EF4444",
              marginBottom: "var(--hana-space-2)",
            }}
          >
            {healthScore}점
          </div>
          <div
            style={{
              width: "100%",
              height: "8px",
              background: "#E5E7EB",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${healthScore}%`,
                height: "100%",
                background:
                  healthScore >= 80
                    ? "#10B981"
                    : healthScore >= 60
                    ? "#F59E0B"
                    : "#EF4444",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={healthData}>
            <Area
              type="monotone"
              dataKey="score"
              stroke="#4F46E5"
              fill="#4F46E5"
              fillOpacity={0.3}
            />
            <Tooltip formatter={(value) => [`${value}점`, "점수"]} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 투자 성향 및 목표 */}
      <div
        style={{
          background: "var(--hana-white)",
          borderRadius: "var(--hana-radius-lg)",
          padding: "var(--hana-space-4)",
          boxShadow: "var(--hana-shadow-light)",
          border: "1px solid var(--hana-border)",
        }}
      >
        <h3
          style={{
            color: "var(--hana-primary)",
            marginBottom: "var(--hana-space-3)",
            fontSize: "var(--hana-font-size-lg)",
            fontWeight: "600",
          }}
        >
          🎯 투자 성향
        </h3>
        <div style={{ display: "grid", gap: "var(--hana-space-3)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "var(--hana-space-2)",
              background: "#F8FAFC",
              borderRadius: "var(--hana-radius)",
            }}
          >
            <span style={{ fontWeight: "500" }}>위험 성향:</span>
            <span
              style={{
                color: getRiskColor(customer.riskTolerance),
                fontWeight: "600",
              }}
            >
              {customer.riskTolerance || "보통"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "var(--hana-space-2)",
              background: "#F8FAFC",
              borderRadius: "var(--hana-radius)",
            }}
          >
            <span style={{ fontWeight: "500" }}>투자 목적:</span>
            <span style={{ color: "var(--hana-primary)", fontWeight: "600" }}>
              {customer.investmentGoal || "자산 증식"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "var(--hana-space-2)",
              background: "#F8FAFC",
              borderRadius: "var(--hana-radius)",
            }}
          >
            <span style={{ fontWeight: "500" }}>투자 기간:</span>
            <span style={{ color: "var(--hana-primary)", fontWeight: "600" }}>
              {customer.investmentPeriod || 36}개월
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioVisualization;
