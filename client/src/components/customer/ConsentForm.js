import React, { useEffect } from "react";
import styles from "./ConsentForm.module.css";
import { autoFillEmployeeAndCustomerInfo } from "../../data/fieldMapping";

const Checkbox = ({ label, fieldId, fieldValues, onFieldClick }) => (
  <label className={styles.checkboxLabel}>
    <input
      type="checkbox"
      checked={fieldValues[fieldId] || false}
      readOnly
      onClick={() => onFieldClick && onFieldClick(fieldId, label, "checkbox")}
      style={{ cursor: "pointer" }}
    />{" "}
    {label}
  </label>
);

const ConsentForm = ({ fieldValues = {}, onFieldClick }) => {
  console.log("🔍 [ConsentForm] 렌더링됨");
  console.log("🔍 [ConsentForm] fieldValues:", fieldValues);
  console.log("🔍 [ConsentForm] onFieldClick:", !!onFieldClick);

  // 고객 기본정보 자동 채우기
  useEffect(() => {
    if (
      Object.keys(fieldValues).length === 0 ||
      Object.values(fieldValues).every((value) => !value)
    ) {
      console.log("🔄 [ConsentForm] 고객 기본정보 자동 채우기 시작");
      const autoFilledData = autoFillEmployeeAndCustomerInfo(fieldValues);
      console.log("✅ [ConsentForm] 자동 채우기 완료:", autoFilledData);

      // 자동 채우기된 데이터로 필드 업데이트
      if (onFieldClick) {
        Object.entries(autoFilledData).forEach(([fieldId, value]) => {
          if (value && value !== fieldValues[fieldId]) {
            console.log(`📝 [ConsentForm] 자동 채우기: ${fieldId} = ${value}`);
            onFieldClick(fieldId, value, "auto-fill"); // 빈 문자열 대신 실제 값 전달
          }
        });
      }
    }
  }, [fieldValues, onFieldClick]);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        padding: "20px",
        backgroundColor: "#ffffff",
        fontFamily: "Arial, sans-serif",
        border: "2px solid #007bff",
        borderRadius: "8px",
        margin: "10px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        zIndex: 1000,
        position: "relative",
      }}
    >
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

        <h1 className={styles.title}>
          [필수] 개인(신용)정보 수집·이용 동의서 [비여신 금융거래]
        </h1>
        <p className={styles.recipient}>㈜하나은행 귀중</p>

        <div className={styles.infoText}>
          <p>
            * 당행과의 비여신 (금융)거래와 관련하여 당행이 개인(신용)정보를
            수집·이용하고자 하는 경우에는 '신용정보의 이용 및 보호에 관한
            법률」, 개인정보보호법」 등 관계 법령에 따라 본인의 동의가
            필요합니다.
          </p>
          <p>
            * 본 동의서는 비여신(금융) 거래(수신, 내·외국환, 전자금융, 현금카드,
            신탁, 퇴직연금, 펀드, 방카슈랑스, 파생상품, 대여금고, 보호예수, 각종
            대행업무 등)와 관련하여 본인의 개인(신용)정보를 수집·이용하기 위하여
            1회만 작성하는 동의서로, 본 동의 이후 비여신(금융)거래 시 별도의
            동의가 필요하지 않습니다.
          </p>
        </div>

        <table className={styles.mainTable}>
          <tbody>
            <tr>
              <th className={styles.thFirst}>수집·이용 목적</th>
              <td className={styles.tdContent}>
                - (금융)거래관계의 설정 유지ㆍ이행ㆍ관리 <br />
                - 온·오프라인 (금융)거래 연계 및 본인식별 <br />- 금융사고 조사,
                분쟁 해결, 민원 처리
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>보유 및 이용기간</th>
              <td className={styles.tdContent}>
                - (금융)거래 종료일로부터 5년까지 보유·이용
                <div className={styles.subText}>
                  * 위 보유 기간에서의 (금융)거래 종료일이란 "당 행과 거래중인
                  모든 계약(여·수신, 내·외국환, 카드 및 제3자 담보 제공 등) 해지
                  및 서비스(대여금고, 보호예수, 외국환거래지정, 인터넷뱅킹 포함
                  전자금융거래 등)가 종료된 날"을 말합니다. <br />* (금융)거래
                  종료일 후에는 금융사고 조사, 분쟁 해결, 민원 처리, 법령상
                  의무이행을 위한 목적으로만 보유·이용됩니다.
                </div>
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst} style={{ lineHeight: "1.2" }}>
                거부 권리 및<br />
                불이익
              </th>
              <td className={styles.tdContent}>
                귀하는 동의를 거부하실 수 있습니다. 다만, 위 개인(신용)정보
                수집·이용에 관한 동의는 "(금융)거래 계약의 체결 및 이행을 위한
                필수적 사항이므로, 위 사항에 동의하셔야만 (금융)거래관계의 설정
                및 유지가 가능합니다.
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>수집·이용 항목</th>
              <td className={styles.tdContent}>
                <div className={styles.itemSection}>
                  <p className={styles.itemTitle}>■ 고유식별정보</p>
                  <p>주민등록번호, 외국인등록번호, 여권번호, 운전면허 번호</p>
                  <div className={styles.consentCheck}>
                    <span>위 고유식별정보 수집·이용에 동의하십니까?</span>
                    <span>
                      <Checkbox
                        label="동의함"
                        fieldId="unique_info_consent_yes"
                        fieldValues={fieldValues}
                        onFieldClick={onFieldClick}
                      />{" "}
                      <Checkbox
                        label="동의하지 않음"
                        fieldId="unique_info_consent_no"
                        fieldValues={fieldValues}
                        onFieldClick={onFieldClick}
                      />
                    </span>
                  </div>
                </div>
                <div className={styles.itemSection}>
                  <p className={styles.itemTitle}>■ 개인(신용)정보</p>
                  <div className={styles.subItem}>
                    <p>
                      <b>■일반개인정보:</b> 성명, CI, 실명증표,
                      국내거소신고번호, 주소, 연락처, 직업군, 국적
                    </p>
                    <p>
                      (전자금융거래에 한함) 고객ID, 접속일시, IP주소,
                      이용전화번호 등 전자금융거래법에 따른 수집정보
                    </p>
                  </div>
                  <div className={styles.subItem}>
                    <p>
                      <b>■신용거래정보:</b> 상품종류, 거래조건(이자율, 만기 등),
                      거래일시, 금액 등 거래 설정내역정보 및 (금융)거래의 설정,
                      유지 이행, 관리를 위한 상담을 통해 생성되는 정보
                    </p>
                  </div>
                  <div className={styles.consentCheck}>
                    <span>위 개인(신용)정보 수집·이용에 동의하십니까?</span>
                    <span>
                      <Checkbox
                        label="동의함"
                        fieldId="personal_info_consent_yes"
                        fieldValues={fieldValues}
                        onFieldClick={onFieldClick}
                      />{" "}
                      <Checkbox
                        label="동의하지 않음"
                        fieldId="personal_info_consent_no"
                        fieldValues={fieldValues}
                        onFieldClick={onFieldClick}
                      />
                    </span>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className={styles.notice}>
          ※ 본 동의 이전에 발생한 개인(신용)정보도 수집·이용 대상에 포함됩니다.{" "}
          <br />※ 은행의 고의 또는 과실 등 귀책사유로 인한 개인정보 유출로
          고객님에게 발생한 손해에 대해 관계 법령 등에 따라 보상 받으실 수
          있습니다.
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
              본인 성명 :{" "}
              <input
                type="text"
                style={{ width: "100px", cursor: "pointer" }}
                value={fieldValues.customer_name || ""}
                readOnly
                onClick={() =>
                  onFieldClick &&
                  onFieldClick("customer_name", "본인 성명", "text")
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
                    zIndex: 9999,
                    position: "relative",
                    pointerEvents: "auto",
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("🖱️ [ConsentForm] 서명 이미지 클릭됨!");
                    onFieldClick &&
                      onFieldClick("signature", "본인 서명", "signature");
                  }}
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
                    zIndex: 9999,
                    position: "relative",
                    backgroundColor: "#fff",
                    pointerEvents: "auto",
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("🖱️ [ConsentForm] 서명 필드 클릭됨!");
                    onFieldClick &&
                      onFieldClick("signature", "본인 서명", "signature");
                  }}
                >
                  서명하기
                </div>
              )}
            </span>
          </div>
          <div className={styles.signer}>
            <span>
              대리인 성명:{" "}
              <input
                type="text"
                style={{ width: "100px", cursor: "pointer" }}
                value={fieldValues.agent_name || ""}
                readOnly
                onClick={() =>
                  onFieldClick &&
                  onFieldClick("agent_name", "대리인 성명", "text")
                }
              />
            </span>
            <span>
              {" "}
              {fieldValues.agent_signature ? (
                <img
                  src={fieldValues.agent_signature}
                  alt="대리인 서명"
                  style={{
                    width: "100px",
                    height: "40px",
                    border: "1px solid #ccc",
                    cursor: "pointer",
                    objectFit: "contain",
                  }}
                  onClick={() =>
                    onFieldClick &&
                    onFieldClick("agent_signature", "대리인 서명", "signature")
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
                    onFieldClick("agent_signature", "대리인 서명", "signature")
                  }
                >
                  서명하기
                </div>
              )}
            </span>
          </div>
          <div className={styles.legalRep}>
            <p>
              (미성년자인 경우) 법정대리인 부:{" "}
              <input
                type="text"
                style={{ width: "80px", cursor: "pointer" }}
                value={fieldValues.father_name || ""}
                readOnly
                onClick={() =>
                  onFieldClick && onFieldClick("father_name", "부 성명", "text")
                }
              />
              모:{" "}
              <input
                type="text"
                style={{ width: "80px", cursor: "pointer" }}
                value={fieldValues.mother_name || ""}
                readOnly
                onClick={() =>
                  onFieldClick && onFieldClick("mother_name", "모 성명", "text")
                }
              />
              는 위 본인의 법정대리인으로 위 본인의 개인(신용)정보
              수집·이용하는것에 동의합니다.
            </p>
            <div className={styles.signer}>
              <span>
                법정대리인 성명:{" "}
                <input
                  type="text"
                  style={{ width: "100px", cursor: "pointer" }}
                  value={fieldValues.legal_guardian_name || ""}
                  readOnly
                  onClick={() =>
                    onFieldClick &&
                    onFieldClick(
                      "legal_guardian_name",
                      "법정대리인 성명",
                      "text"
                    )
                  }
                />
              </span>
              <span>
                (서명){" "}
                {fieldValues.legal_guardian_signature ? (
                  <img
                    src={fieldValues.legal_guardian_signature}
                    alt="법정대리인 서명"
                    style={{
                      width: "100px",
                      height: "40px",
                      border: "1px solid #ccc",
                      cursor: "pointer",
                      objectFit: "contain",
                    }}
                    onClick={() =>
                      onFieldClick &&
                      onFieldClick(
                        "legal_guardian_signature",
                        "법정대리인 서명",
                        "signature"
                      )
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
                      onFieldClick(
                        "legal_guardian_signature",
                        "법정대리인 서명",
                        "signature"
                      )
                    }
                  >
                    서명하기
                  </div>
                )}
              </span>
            </div>
            <p className={styles.subText}>
              * 만 14세미만인 경우 법정대리인 동의는 필수사항입니다.
            </p>
          </div>
        </div>

        <footer className={styles.footer}>
          <span>3-08-1294(1-1) (2025.08 개정)</span>
          <span className={styles.bankLogo}>
            <img src="https://i.imgur.com/2Yh4P3G.png" alt="Hana Bank Logo" />
          </span>
          <span>(보존년한 금융거래종료일로부터 5년)</span>
        </footer>
      </div>
    </div>
  );
};

export default ConsentForm;
