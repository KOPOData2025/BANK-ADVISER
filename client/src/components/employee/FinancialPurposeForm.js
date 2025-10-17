import React from "react";
import styles from "./FinancialPurposeForm.module.css";

const FinancialPurposeForm = ({ fieldValues = {}, onFieldClick }) => {
  return (
    <div className="page-container">
      <div className={styles.formContainer}>
        <header className={styles.header}>
          <div className={styles.approvalBox}>
            <table>
              <tbody>
                <tr>
                  <td>본인확인</td>
                  <td>담당</td>
                  <td>책임자</td>
                </tr>
                <tr>
                  <td style={{ height: "50px" }}></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </header>

        <h1 className={styles.title}>금융거래목적확인서</h1>
        <p className={styles.recipient}>㈜하나은행 귀중</p>

        <div className={styles.infoText}>
          <p>* 금융거래의 목적과 자금출처를 확인하는 서식입니다.</p>
          <p>
            * 고객의 투자성향과 거래목적을 파악하여 적절한 상품을 추천하기 위해
            작성합니다.
          </p>
          <p>* 모든 정보는 금융거래 관련 법령에 따라 보호됩니다.</p>
        </div>

        <table className={styles.mainTable}>
          <tbody>
            <tr>
              <th className={styles.thFirst}>고객명</th>
              <td className={styles.tdContent}>
                <input
                  type="text"
                  name="customerName"
                  value={fieldValues.customerName || ""}
                  placeholder="홍길동"
                  readOnly
                  onClick={() =>
                    onFieldClick &&
                    onFieldClick("customerName", "고객명", "text")
                  }
                  style={{ cursor: "pointer", width: "200px" }}
                />
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>주민등록번호</th>
              <td className={styles.tdContent}>
                <input
                  type="text"
                  name="customerId"
                  value={fieldValues.customerId || ""}
                  placeholder="000000-0000000"
                  readOnly
                  onClick={() =>
                    onFieldClick &&
                    onFieldClick("customerId", "주민등록번호", "text")
                  }
                  style={{ cursor: "pointer", width: "200px" }}
                />
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>거래목적</th>
              <td className={styles.tdContent}>
                <select
                  name="transactionPurpose"
                  value={fieldValues.transactionPurpose || ""}
                  onClick={() =>
                    onFieldClick &&
                    onFieldClick("transactionPurpose", "거래목적", "select")
                  }
                  style={{ cursor: "pointer", width: "300px" }}
                >
                  <option value="">거래목적을 선택하세요</option>
                  <option value="자산증식">자산증식</option>
                  <option value="생활비">생활비</option>
                  <option value="교육비">교육비</option>
                  <option value="의료비">의료비</option>
                  <option value="주택구입">주택구입</option>
                  <option value="사업자금">사업자금</option>
                  <option value="기타">기타</option>
                </select>
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>예상거래금액</th>
              <td className={styles.tdContent}>
                <input
                  type="number"
                  name="expectedAmount"
                  value={fieldValues.expectedAmount || ""}
                  placeholder="10,000,000"
                  readOnly
                  onClick={() =>
                    onFieldClick &&
                    onFieldClick("expectedAmount", "예상거래금액", "number")
                  }
                  style={{ cursor: "pointer", width: "200px" }}
                />
                <span className={styles.unit}>원</span>
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>자금출처</th>
              <td className={styles.tdContent}>
                <select
                  name="fundSource"
                  value={fieldValues.fundSource || ""}
                  onClick={() =>
                    onFieldClick &&
                    onFieldClick("fundSource", "자금출처", "select")
                  }
                  style={{ cursor: "pointer", width: "300px" }}
                >
                  <option value="">자금출처를 선택하세요</option>
                  <option value="급여">급여</option>
                  <option value="사업수입">사업수입</option>
                  <option value="임대수입">임대수입</option>
                  <option value="상속">상속</option>
                  <option value="증여">증여</option>
                  <option value="기타">기타</option>
                </select>
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>위험성향</th>
              <td className={styles.tdContent}>
                <div className={styles.radioGroup}>
                  <label>
                    <input
                      type="radio"
                      name="riskTolerance"
                      value="conservative"
                    />
                    안정형 (원금 보장 우선)
                  </label>
                  <label>
                    <input type="radio" name="riskTolerance" value="moderate" />
                    중립형 (안정성과 수익성 균형)
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="riskTolerance"
                      value="aggressive"
                    />
                    공격형 (고수익 추구)
                  </label>
                </div>
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>투자기간</th>
              <td className={styles.tdContent}>
                <select
                  name="investmentPeriod"
                  value={fieldValues.investmentPeriod || ""}
                  onClick={() =>
                    onFieldClick &&
                    onFieldClick("investmentPeriod", "투자기간", "select")
                  }
                  style={{ cursor: "pointer", width: "300px" }}
                >
                  <option value="">투자기간을 선택하세요</option>
                  <option value="1년 미만">1년 미만</option>
                  <option value="1-3년">1-3년</option>
                  <option value="3-5년">3-5년</option>
                  <option value="5-10년">5-10년</option>
                  <option value="10년 이상">10년 이상</option>
                </select>
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>투자 경험</th>
              <td className={styles.tdContent}>
                <div className={styles.radioGroup}>
                  <label>
                    <input
                      type="radio"
                      name="investmentExperience"
                      value="none"
                    />
                    투자 경험 없음
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="investmentExperience"
                      value="beginner"
                    />
                    초보자 (1년 미만)
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="investmentExperience"
                      value="intermediate"
                    />
                    중급자 (1-5년)
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="investmentExperience"
                      value="expert"
                    />
                    고급자 (5년 이상)
                  </label>
                </div>
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>월 소득</th>
              <td className={styles.tdContent}>
                <select
                  name="monthlyIncome"
                  value={fieldValues.monthlyIncome || ""}
                  onClick={() =>
                    onFieldClick &&
                    onFieldClick("monthlyIncome", "월 소득", "select")
                  }
                  style={{ cursor: "pointer", width: "300px" }}
                >
                  <option value="">월 소득을 선택하세요</option>
                  <option value="200만원 미만">200만원 미만</option>
                  <option value="200-300만원">200-300만원</option>
                  <option value="300-500만원">300-500만원</option>
                  <option value="500-700만원">500-700만원</option>
                  <option value="700-1000만원">700-1000만원</option>
                  <option value="1000만원 이상">1000만원 이상</option>
                </select>
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>총 자산</th>
              <td className={styles.tdContent}>
                <select
                  name="totalAssets"
                  value={fieldValues.totalAssets || ""}
                  onClick={() =>
                    onFieldClick &&
                    onFieldClick("totalAssets", "총 자산", "select")
                  }
                  style={{ cursor: "pointer", width: "300px" }}
                >
                  <option value="">총 자산을 선택하세요</option>
                  <option value="5000만원 미만">5000만원 미만</option>
                  <option value="5000만원-1억원">5000만원-1억원</option>
                  <option value="1억원-3억원">1억원-3억원</option>
                  <option value="3억원-5억원">3억원-5억원</option>
                  <option value="5억원-10억원">5억원-10억원</option>
                  <option value="10억원 이상">10억원 이상</option>
                </select>
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>투자 목표</th>
              <td className={styles.tdContent}>
                <textarea
                  name="investmentGoal"
                  value={fieldValues.investmentGoal || ""}
                  placeholder="투자 목표를 자유롭게 작성해주세요"
                  rows="3"
                  readOnly
                  onClick={() =>
                    onFieldClick &&
                    onFieldClick("investmentGoal", "투자 목표", "textarea")
                  }
                  style={{
                    cursor: "pointer",
                    width: "100%",
                    resize: "vertical",
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div className={styles.disclaimer}>
          <h4>※ 중요 안내사항</h4>
          <ul>
            <li>
              위 정보는 고객님께 적합한 금융상품을 추천하기 위한 목적으로만
              사용됩니다.
            </li>
            <li>
              제공하신 정보는 관련 법령에 따라 보호되며, 동의 없이 제3자에게
              제공되지 않습니다.
            </li>
            <li>
              투자상품은 원금손실의 위험이 있으니 신중히 결정하시기 바랍니다.
            </li>
            <li>위험성향 평가는 투자상품 가입 시 재평가될 수 있습니다.</li>
          </ul>
        </div>

        <div className={styles.signatureSection}>
          <div className={styles.date}>
            <input
              type="text"
              style={{ width: "40px", cursor: "pointer" }}
              value={fieldValues.year || ""}
              readOnly
              onClick={() =>
                onFieldClick && onFieldClick("year", "년도", "text")
              }
            />{" "}
            년
            <input
              type="text"
              style={{ width: "30px", cursor: "pointer" }}
              value={fieldValues.month || ""}
              readOnly
              onClick={() =>
                onFieldClick && onFieldClick("month", "월", "text")
              }
            />{" "}
            월
            <input
              type="text"
              style={{ width: "30px", cursor: "pointer" }}
              value={fieldValues.day || ""}
              readOnly
              onClick={() => onFieldClick && onFieldClick("day", "일", "text")}
            />{" "}
            일
          </div>
          <div className={styles.signer}>
            <span>
              고객 성명 :{" "}
              <input
                type="text"
                style={{ width: "100px", cursor: "pointer" }}
                value={fieldValues.customerName || ""}
                readOnly
                onClick={() =>
                  onFieldClick &&
                  onFieldClick("customerName", "고객 성명", "text")
                }
              />
            </span>
            <span>
              {" "}
              {fieldValues.signature ? (
                <img
                  src={fieldValues.signature}
                  alt="서명"
                  style={{
                    width: "100px",
                    height: "40px",
                    border: "1px solid #ccc",
                    cursor: "pointer",
                    objectFit: "contain",
                  }}
                  onClick={() =>
                    onFieldClick &&
                    onFieldClick("signature", "서명", "signature")
                  }
                />
              ) : (
                <div
                  style={{
                    width: "100px",
                    height: "40px",
                    border: "1px dashed #ccc",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    color: "#666",
                  }}
                  onClick={() =>
                    onFieldClick &&
                    onFieldClick("signature", "서명", "signature")
                  }
                >
                  서명하기
                </div>
              )}
            </span>
          </div>
        </div>

        <footer className={styles.footer}>
          <span>3-08-0222 (2025.01 개정)</span>
          <span className={styles.bankLogo}>
            <img src="https://i.imgur.com/2Yh4P3G.png" alt="Hana Bank Logo" />
          </span>
          <span>(보존년한 금융거래종료일로부터 5년)</span>
        </footer>
      </div>
    </div>
  );
};

export default FinancialPurposeForm;
