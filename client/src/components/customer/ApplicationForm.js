import React from "react";
import styles from "./ApplicationForm.module.css";

const Checkbox = ({ label, checked = false }) => (
  <label className={styles.checkboxLabel}>
    <input type="checkbox" defaultChecked={checked} />
    {label}
  </label>
);
const Td = ({ children, colSpan, rowSpan, className }) => (
  <td
    colSpan={colSpan}
    rowSpan={rowSpan}
    className={`${styles.td} ${className || ""}`}
  >
    {children}
  </td>
);
const Th = ({ children, colSpan, rowSpan, className }) => (
  <th
    colSpan={colSpan}
    rowSpan={rowSpan}
    className={`${styles.th} ${className || ""}`}
  >
    {children}
  </th>
);

const ApplicationForm = ({ fieldValues = {}, onFieldClick }) => {
  return (
    <>
      {/* PAGE 1 */}
      <div className="page-container">
        <div className={styles.formContainer}>
          <header className={styles.header}>
            <div className={styles.approvalBox}>
              <table>
                <tbody>
                  <tr>
                    <th>실명확인자</th>
                    <th>담당자</th>
                    <th>책임자</th>
                  </tr>
                  <tr>
                    <td style={{ height: "40px" }}></td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </header>
          <h1 className={styles.title}>은행거래신청서</h1>
          <p className={styles.subtitle}>
            본인은 하나은행의 예금(외화/신탁)거래기본약관 및 예금(신탁)상품별
            해당 약관이 적용됨을 승낙하고 다음과 같이 신청합니다.
          </p>
          <p className={styles.infoText}>
            ※ 기존거래가 있는 고객님의 경우 아래 기재사항에 의거 고객님의 정보가
            자동으로 변경됩니다.
          </p>

          {/* 고객정보 */}
          <table className={styles.mainTable}>
            <tbody>
              <tr>
                <Th rowSpan={6} className={styles.verticalText}>
                  고객정보
                </Th>
                <Th>
                  성명
                  <br />
                  (업체명)
                </Th>
                <Td>
                  <input
                    type="text"
                    value={fieldValues.customer_name || ""}
                    readOnly
                    onClick={() =>
                      onFieldClick &&
                      onFieldClick("customer_name", "성명(업체명)", "text")
                    }
                    style={{ cursor: "pointer" }}
                  />
                </Td>
                <Th>
                  생년월일
                  <br />
                  (사업자번호)
                </Th>
                <Td>
                  <input
                    type="text"
                    value={fieldValues.resident_number || ""}
                    readOnly
                    onClick={() =>
                      onFieldClick &&
                      onFieldClick(
                        "resident_number",
                        "생년월일(사업자번호)",
                        "text"
                      )
                    }
                    style={{ cursor: "pointer" }}
                  />
                </Td>
                <Td rowSpan={4} className={styles.stampArea}>
                  <p>총장인감</p>
                  <div className={styles.stampBox}></div>
                </Td>
                <Td rowSpan={4} className={styles.stampArea}>
                  <p>서명</p>
                  <div className={styles.stampBox}></div>
                </Td>
              </tr>
              <tr>
                <Th>영문명</Th>
                <Td colSpan={3}>
                  <input
                    type="text"
                    style={{ width: "95%" }}
                    value={fieldValues.english_name || ""}
                    readOnly
                  />
                </Td>
              </tr>
              <tr>
                <Th>휴대폰</Th>
                <Td colSpan={3}>
                  (
                  <input
                    type="text"
                    style={{ width: "30px" }}
                    value={fieldValues.phone_area || ""}
                    readOnly
                  />
                  ){" "}
                  <input
                    type="text"
                    style={{ width: "240px" }}
                    value={fieldValues.phone_number || ""}
                    readOnly
                  />
                  <div className={styles.phoneOptions}>
                    <Checkbox label="스마트폰" />
                    <Checkbox label="일반폰" />
                    <Checkbox label="알뜰폰" /> |
                    <Checkbox label="SKT" />
                    <Checkbox label="LGU+" />
                    <Checkbox label="KT" />
                    <Checkbox label="기타" />
                  </div>
                </Td>
              </tr>
              <tr>
                <Th>이메일</Th>
                <Td colSpan={3}>
                  <input
                    type="text"
                    style={{ width: "120px" }}
                    value={fieldValues.email_id || ""}
                    readOnly
                  />{" "}
                  @{" "}
                  <input
                    type="text"
                    style={{ width: "120px" }}
                    value={fieldValues.email_domain || ""}
                    readOnly
                  />
                </Td>
              </tr>
              <tr>
                <Th>주소</Th>
                <Td colSpan={5}>
                  <div className="d-flex justify-content-between">
                    <div>
                      <Checkbox label="자택" />{" "}
                      <input type="text" style={{ width: "85%" }} />
                    </div>
                    <div>
                      전화 (<input type="text" style={{ width: "30px" }} />){" "}
                      <input type="text" style={{ width: "80px" }} />
                    </div>
                  </div>
                  <div
                    className="d-flex justify-content-between"
                    style={{ marginTop: "5px" }}
                  >
                    <div>
                      <Checkbox label="직장" />{" "}
                      <input type="text" style={{ width: "85%" }} />
                    </div>
                    <div>
                      전화 (<input type="text" style={{ width: "30px" }} />){" "}
                      <input type="text" style={{ width: "80px" }} />
                    </div>
                  </div>
                </Td>
              </tr>
              <tr>
                <Th>우편물 수령처</Th>
                <Td colSpan={3}>
                  <Checkbox label="자택" /> <Checkbox label="직장" />{" "}
                  <Checkbox label="원치않음" />
                </Td>
                <Th>직업</Th>
                <Td colSpan={2}>
                  <Checkbox label="직장인" /> <Checkbox label="전문직" />{" "}
                  <Checkbox label="자영업" />
                  <Checkbox label="공무원" /> <Checkbox label="주부" />{" "}
                  <Checkbox label="학생" />
                </Td>
              </tr>
            </tbody>
          </table>

          {/* 신규신청 */}
          <h2 className={styles.sectionTitle}>
            입출금통장, 예·적금통장 신규 신청
          </h2>
          <table className={styles.mainTable}>
            <thead>
              <tr>
                <Th style={{ width: "25px" }}>①</Th>
                <Th>상품명</Th>
                <Th>가입금액(월부금)</Th>
                <Th>계약기간</Th>
                <Th colSpan={2}>이자(금리적용)</Th>
                <Th>비과세종합저축</Th>
                <Th>인</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td className="text-center">①</Td>
                <Td>
                  <input type="text" style={{ width: "90%" }} />
                </Td>
                <Td>
                  ₩ <input type="text" style={{ width: "80%" }} />
                </Td>
                <Td>
                  <input type="text" style={{ width: "30px" }} /> 개월
                </Td>
                <Td
                  colSpan={2}
                  style={{ fontSize: "0.8rem", padding: "2px 5px" }}
                >
                  <Checkbox label="정기" /> <Checkbox label="자유" />{" "}
                  <Checkbox label="확정형" /> <br />
                  <Checkbox label="연동형" /> (
                  <input type="text" style={{ width: "20px" }} />
                  개월)
                </Td>
                <Td>
                  한도: ₩ <input type="text" style={{ width: "60%" }} />
                </Td>
                <Td></Td>
              </tr>
              <tr>
                <Td colSpan={8} className={styles.subSection}>
                  <Checkbox label="상품설명을 듣고 충분히 이해하였으며, 상품설명서 약관 계약서를 수령함" />
                  <span style={{ marginLeft: "20px" }}>수령방법:</span>
                  <Checkbox label="E-mail" /> <Checkbox label="하나10앱" />{" "}
                  <Checkbox label="영업점" /> <Checkbox label="문자/카카오톡" />
                </Td>
              </tr>
              <tr>
                <Td colSpan={8} className={styles.subSection}>
                  만기안내 문자통지 신청:{" "}
                  <Checkbox label="통보(은행 등록정보 기준)" />{" "}
                  <Checkbox label="미통보" />
                  <span style={{ marginLeft: "20px" }}>
                    금리 변동통지(※연동형):
                  </span>
                  <Checkbox label="SMS" /> <Checkbox label="e-mail" />{" "}
                  <Checkbox label="SMS+e-mail" />
                </Td>
              </tr>
            </tbody>
          </table>

          <div className={styles.finalAgreements}>
            <div className={styles.left}>
              <Checkbox label="비과세종합저축/재형저축/주택정약상품의 계약금액/한도/중복 등을 확인하기 위하여 본인의 타행 금융정보 조화를 의뢰/동의함." />
              <br />
              <Checkbox label="본인은 금융지주회사법 제48조의2에 근거하여 하나금융그룹내 지주사 및 자회사간에는 고객정보 제공 및 이용이 가능한 것과 고객정보 취급방침에 대한 설명을 듣고, 대한 보증채무, 신용카드채무에 대하여 변제기가 도래하거나 기한이익이 상실되는 경우 본건예/부금으로 상계에 이의를 제기하지 않겠음." />
            </div>
            <div className={styles.right}>
              <div className={styles.date}>
                <input type="text" style={{ width: "40px" }} /> 년
                <input type="text" style={{ width: "30px" }} /> 월
                <input type="text" style={{ width: "30px" }} /> 일
              </div>
              <div className={styles.signer}>
                신청인: <input type="text" style={{ width: "100px" }} />
                <span style={{ marginLeft: "10px" }}>
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
                        display: "inline-block",
                        verticalAlign: "middle",
                      }}
                      onClick={() =>
                        onFieldClick &&
                        onFieldClick("signature", "신청인 서명", "signature")
                      }
                    />
                  ) : (
                    <div
                      style={{
                        width: "100px",
                        height: "40px",
                        border: "1px dashed #ccc",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        color: "#666",
                        verticalAlign: "middle",
                      }}
                      onClick={() =>
                        onFieldClick &&
                        onFieldClick("signature", "신청인 서명", "signature")
                      }
                    >
                      서명하기
                    </div>
                  )}
                </span>
              </div>
            </div>
          </div>
          <footer className={`${styles.footer} ${styles.footerGrid}`}>
            <span>최초거래일</span>
            <span>
              <input type="text" />
            </span>
            <span>과목명</span>
            <span>
              <input type="text" />
            </span>
            <span>계좌번호</span>
            <span>
              <input type="text" />
            </span>
            <span>조작일</span>
            <span>
              <input type="text" />
            </span>
            <span>입금(수탁액)</span>
            <span>
              <input type="text" />
            </span>
            <span>자동이체계좌번호</span>
            <span>
              <input type="text" />
            </span>
            <span>신규일</span>
            <span>
              <input type="text" />
            </span>
            <span>중요증서번호</span>
            <span>
              <input type="text" />
            </span>
            <span>권유직원번호</span>
            <span>
              <input type="text" />
            </span>
            <span>지급기일</span>
            <span>
              <input type="text" />
            </span>
            <span>처리시각</span>
            <span>
              <input type="text" />
            </span>
            <div
              style={{
                gridColumn: "1 / -1",
                fontSize: "0.7rem",
                marginTop: "5px",
              }}
            >
              <span>
                본 신청서는 21.3.25일 금융소비자보호법 시행에 따라 개정
              </span>
              <span style={{ margin: "0 20px" }}>
                3-08-1016(2-1) (210×297/ver21) 모조 100g/m² (2024.06 개정)
              </span>
              <span>(보존년한 해지일로부터 10년)</span>
              <span style={{ float: "right", fontWeight: "bold" }}>
                하나은행
              </span>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default ApplicationForm;
