import React, { useState, useEffect } from "react";
import axios from "axios";
import { getApiUrl } from "../config/api";
import "./ProductComparison.css";

const ProductComparison = () => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [simulationAmount, setSimulationAmount] = useState(1000000);
  const [simulationPeriod, setSimulationPeriod] = useState(12);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");

  // API에서 상품 데이터 가져오기
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = selectedCategory
        ? getApiUrl(
            `/api/recommendations/products?category=${selectedCategory}`
          )
        : getApiUrl("/api/recommendations/products");

      const response = await axios.get(url);
      setProducts(response.data);
    } catch (err) {
      console.error("상품 데이터 로딩 실패:", err);
      setError("상품 데이터를 불러오는데 실패했습니다.");
      // 에러 시 샘플 데이터 사용
      setProducts(getSampleProducts());
    } finally {
      setLoading(false);
    }
  };

  // 샘플 상품 데이터 (API 실패 시 사용)
  const getSampleProducts = () => [
    {
      id: 1,
      name: "급여하나 월복리 적금",
      basicRate: 2.0,
      maxRate: 4.15,
      category: "적금",
      conditions: [
        { name: "급여하나 우대", rate: 0.9, icon: "💰" },
        { name: "자동이체 우대", rate: 0.1, icon: "🔄" },
        { name: "신규고객 우대", rate: 1.15, icon: "🆕" },
      ],
      color: "#4CAF50",
    },
    {
      id: 2,
      name: "(내맘) 적금",
      basicRate: 2.0,
      maxRate: 2.4,
      category: "적금",
      conditions: [{ name: "자동이체 우대", rate: 0.5, icon: "🔄" }],
      color: "#2196F3",
    },
    {
      id: 3,
      name: "달달 하나 적금",
      basicRate: 1.8,
      maxRate: 3.2,
      category: "적금",
      conditions: [
        { name: "급여하나 우대", rate: 0.8, icon: "💰" },
        { name: "다문화가정 우대", rate: 0.6, icon: "🌍" },
      ],
      color: "#FF9800",
    },
    {
      id: 4,
      name: "하나의 정기예금",
      basicRate: 1.8,
      maxRate: 2.15,
      category: "예금",
      conditions: [
        { name: "주거래 우대", rate: 0.2, icon: "🏦" },
        { name: "온라인 우대", rate: 0.15, icon: "💻" },
      ],
      color: "#9C27B0",
    },
  ];

  // 상품 선택/해제
  const toggleProduct = (productId) => {
    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else if (prev.length < 3) {
        return [...prev, productId];
      }
      return prev;
    });
  };

  // 수익 계산
  const calculateReturns = (product) => {
    const monthlyAmount = simulationAmount;
    const totalAmount = monthlyAmount * simulationPeriod;
    const interest = (totalAmount * product.maxRate) / 100 / 2;
    return {
      totalAmount,
      interest,
      finalAmount: totalAmount + interest,
    };
  };

  // 선택된 상품들
  const selectedProductData = products.filter((p) =>
    selectedProducts.includes(p.id)
  );

  return (
    <div className="product-comparison">
      <div className="comparison-header">
        <h1>상품 비교</h1>
        <p>최대 3개 상품까지 비교할 수 있습니다</p>

        {/* 카테고리 필터 */}
        <div className="category-filter">
          <label>상품 카테고리:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">전체</option>
            <option value="적금">적금</option>
            <option value="예금">예금</option>
          </select>
        </div>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>상품 데이터를 불러오는 중...</p>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="error-state">
          <p>⚠️ {error}</p>
          <button onClick={fetchProducts}>다시 시도</button>
        </div>
      )}

      {/* 상품 선택 */}
      {!loading && !error && (
        <div className="product-selection">
          <h3>비교할 상품 선택</h3>
          <div className="product-grid">
            {products.map((product) => (
              <div
                key={product.id}
                className={`product-card ${
                  selectedProducts.includes(product.id) ? "selected" : ""
                }`}
                onClick={() => toggleProduct(product.id)}
                style={{ borderColor: product.color }}
              >
                <div className="product-header">
                  <h4>{product.name}</h4>
                  <span className="product-category">{product.category}</span>
                </div>
                <div className="product-rates">
                  <div className="basic-rate">
                    <span>기본</span>
                    <span>{product.basicRate}%</span>
                  </div>
                  <div className="max-rate">
                    <span>최고</span>
                    <span>{product.maxRate}%</span>
                  </div>
                </div>
                <div className="product-conditions">
                  {product.conditions.map((condition, index) => (
                    <div key={index} className="condition-tag">
                      <span className="condition-icon">{condition.icon}</span>
                      <span>{condition.name}</span>
                    </div>
                  ))}
                </div>
                <div className="selection-indicator">
                  {selectedProducts.includes(product.id) ? "✅" : "⬜"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 시뮬레이션 설정 */}
      {selectedProductData.length > 0 && (
        <div className="simulation-settings">
          <h3>수익 시뮬레이션</h3>
          <div className="simulation-controls">
            <div className="control-group">
              <label>월 납입금액</label>
              <input
                type="number"
                value={simulationAmount}
                onChange={(e) => setSimulationAmount(Number(e.target.value))}
                min="10000"
                max="3000000"
                step="10000"
              />
              <span>원</span>
            </div>
            <div className="control-group">
              <label>납입기간</label>
              <select
                value={simulationPeriod}
                onChange={(e) => setSimulationPeriod(Number(e.target.value))}
              >
                <option value={12}>1년</option>
                <option value={24}>2년</option>
                <option value={36}>3년</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 비교 결과 */}
      {selectedProductData.length > 0 && (
        <div className="comparison-results">
          <h3>비교 결과</h3>
          <div className="comparison-grid">
            {selectedProductData.map((product) => {
              const returns = calculateReturns(product);
              return (
                <div
                  key={product.id}
                  className="comparison-card"
                  style={{ borderColor: product.color }}
                >
                  <div
                    className="card-header"
                    style={{ backgroundColor: product.color }}
                  >
                    <h4>{product.name}</h4>
                    <span className="category">{product.category}</span>
                  </div>

                  <div className="rate-comparison">
                    <div className="rate-item">
                      <span className="rate-label">기본금리</span>
                      <span className="rate-value">{product.basicRate}%</span>
                    </div>
                    <div className="rate-item">
                      <span className="rate-label">최고금리</span>
                      <span className="rate-value highlight">
                        {product.maxRate}%
                      </span>
                    </div>
                  </div>

                  <div className="conditions-list">
                    <h5>우대조건</h5>
                    {product.conditions.map((condition, index) => (
                      <div key={index} className="condition-item">
                        <span className="condition-icon">{condition.icon}</span>
                        <span className="condition-name">{condition.name}</span>
                        <span className="condition-rate">
                          +{condition.rate}%
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="returns-calculation">
                    <h5>예상 수익</h5>
                    <div className="returns-item">
                      <span>총 납입금액</span>
                      <span>{returns.totalAmount.toLocaleString()}원</span>
                    </div>
                    <div className="returns-item">
                      <span>예상 이자</span>
                      <span className="interest">
                        {returns.interest.toLocaleString()}원
                      </span>
                    </div>
                    <div className="returns-item final">
                      <span>만기 수령액</span>
                      <span className="final-amount">
                        {returns.finalAmount.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 추천 상품 */}
      {selectedProductData.length > 1 && (
        <div className="recommendation">
          <h3>추천 상품</h3>
          {(() => {
            const bestProduct = selectedProductData.reduce((best, current) => {
              const bestReturns = calculateReturns(best);
              const currentReturns = calculateReturns(current);
              return currentReturns.finalAmount > bestReturns.finalAmount
                ? current
                : best;
            });

            return (
              <div
                className="recommendation-card"
                style={{ borderColor: bestProduct.color }}
              >
                <div className="recommendation-header">
                  <h4>🏆 최고 수익 상품</h4>
                  <h3>{bestProduct.name}</h3>
                </div>
                <div className="recommendation-details">
                  <div className="detail-item">
                    <span>최고금리</span>
                    <span className="highlight">{bestProduct.maxRate}%</span>
                  </div>
                  <div className="detail-item">
                    <span>예상 수익</span>
                    <span className="highlight">
                      {calculateReturns(
                        bestProduct
                      ).finalAmount.toLocaleString()}
                      원
                    </span>
                  </div>
                  <div className="detail-item">
                    <span>추가 수익</span>
                    <span className="highlight">
                      +{calculateReturns(bestProduct).interest.toLocaleString()}
                      원
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ProductComparison;
