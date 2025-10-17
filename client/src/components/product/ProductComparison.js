import React, { useState, useEffect } from "react";
import "./ProductComparison.css";
import { getApiUrl } from "../../config/api";

const ProductComparison = () => {
  const [comparisonData, setComparisonData] = useState([]);
  const [preferentialDetails, setPreferentialDetails] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("savings"); // 'savings' or 'all'

  useEffect(() => {
    fetchComparisonData();
  }, [activeTab]);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      const endpoint =
        activeTab === "savings"
          ? getApiUrl("/api/employee/products/savings/compare")
          : getApiUrl("/api/employee/products/compare/all");

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setComparisonData(result.data);
      } else {
        setError(result.message || "데이터를 불러오는데 실패했습니다.");
      }
    } catch (err) {
      console.error("Error fetching comparison data:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
      });
      setError(`서버 연결에 실패했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferentialDetails = async (productName) => {
    try {
      const response = await fetch(
        getApiUrl(
          `/api/employee/products/savings/${encodeURIComponent(
            productName
          )}/preferential-details`
        ),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setPreferentialDetails(result.data);
        setSelectedProduct(productName);
      } else {
        setError(result.message || "상세 정보를 불러오는데 실패했습니다.");
      }
    } catch (err) {
      console.error("Error fetching preferential details:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
      });
      setError(`서버 연결에 실패했습니다: ${err.message}`);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <span className="rank-badge gold">🥇 1위</span>;
    if (rank === 2) return <span className="rank-badge silver">🥈 2위</span>;
    if (rank === 3) return <span className="rank-badge bronze">🥉 3위</span>;
    return <span className="rank-badge">#{rank}</span>;
  };

  const getRateColor = (rate) => {
    if (rate.includes("5.0") || rate.includes("4.5")) return "rate-high";
    if (rate.includes("3.0") || rate.includes("2.8")) return "rate-medium";
    return "rate-normal";
  };

  if (loading) {
    return (
      <div className="product-comparison">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>상품 비교 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-comparison">
        <div className="error-container">
          <h3>❌ 오류 발생</h3>
          <p>{error}</p>
          <button onClick={fetchComparisonData} className="retry-button">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-comparison">
      <div className="comparison-header">
        <h2>🏆 우대금리 상품 비교</h2>
        <p>하나은행의 모든 적금 상품을 우대금리 기준으로 비교해보세요</p>

        <div className="tab-buttons">
          <button
            className={activeTab === "savings" ? "active" : ""}
            onClick={() => setActiveTab("savings")}
          >
            💰 적금 상품만
          </button>
          <button
            className={activeTab === "all" ? "active" : ""}
            onClick={() => setActiveTab("all")}
          >
            🏦 전체 상품
          </button>
        </div>
      </div>

      <div className="comparison-content">
        <div className="comparison-table-container">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>상품명</th>
                <th>기본금리</th>
                <th>최고금리</th>
                <th>우대조건</th>
                <th>상세보기</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((product, index) => (
                <tr key={index} className="product-row">
                  <td className="rank-cell">
                    {getRankBadge(product.순위 || index + 1)}
                  </td>
                  <td className="product-name">
                    <strong>{product.상품명}</strong>
                    {product.상품분류 && (
                      <span className="product-category">
                        {product.상품분류}
                      </span>
                    )}
                  </td>
                  <td className={`rate-cell ${getRateColor(product.기본금리)}`}>
                    {product.기본금리}
                  </td>
                  <td className={`rate-cell ${getRateColor(product.최고금리)}`}>
                    {product.최고금리}
                  </td>
                  <td className="preferential-cell">
                    <span
                      className={`preferential-badge ${
                        product.우대금리_개수 > 0
                          ? "has-preferential"
                          : "no-preferential"
                      }`}
                    >
                      {product.우대조건_요약 ||
                        `${product.우대금리_개수}개 조건`}
                    </span>
                  </td>
                  <td className="action-cell">
                    {product.상품분류 === "적금" && (
                      <button
                        className="detail-button"
                        onClick={() => fetchPreferentialDetails(product.상품명)}
                      >
                        📋 상세보기
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {preferentialDetails && selectedProduct && (
          <div className="preferential-details-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>📊 {selectedProduct} 우대금리 상세</h3>
                <button
                  className="close-button"
                  onClick={() => {
                    setPreferentialDetails(null);
                    setSelectedProduct(null);
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="product-summary">
                  <div className="summary-item">
                    <label>기본금리:</label>
                    <span className="rate-value">
                      {preferentialDetails.기본금리}
                    </span>
                  </div>
                  <div className="summary-item">
                    <label>최고금리:</label>
                    <span className="rate-value high">
                      {preferentialDetails.최고금리}
                    </span>
                  </div>
                  <div className="summary-item">
                    <label>우대조건 개수:</label>
                    <span className="count-value">
                      {preferentialDetails.우대금리_개수}개
                    </span>
                  </div>
                </div>

                <div className="preferential-list">
                  <h4>🎯 우대조건 상세</h4>
                  {preferentialDetails.우대금리_상세 && (
                    <div className="preferential-items">
                      {JSON.parse(preferentialDetails.우대금리_상세).map(
                        (item, index) => (
                          <div key={index} className="preferential-item">
                            <div className="item-header">
                              <span className="item-name">{item.item}</span>
                              <span className="item-rate">{item.rate}</span>
                            </div>
                            <div className="item-description">
                              {item.description}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductComparison;
