import React from "react";
import styles from "./ElectronicFinanceForm.module.css";

const ElectronicFinanceForm = ({ fieldValues = {}, onFieldClick }) => {
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

        <h1 className={styles.title}>개인 전자금융서비스 신청서</h1>
        <p className={styles.recipient}>㈜하나은행 귀중</p>

        <div className={styles.infoText}>
          <p>
            * 전자금융서비스 이용을 위한 신청서입니다. 스마트폰뱅킹, 인터넷뱅킹
            등 서비스를 신청할 수 있습니다.
          </p>
          <p>* 신청하신 서비스는 본인 확인 후 활성화됩니다.</p>
        </div>

        <table className={styles.mainTable}>
          <tbody>
            <tr>
              <th className={styles.thFirst}>신청구분</th>
              <td className={styles.tdContent}>
                <div className={styles.radioGroup}>
                  <label>
                    <input type="radio" name="applicationType" value="new" />
                    신규
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="applicationType"
                      value="account_add"
                    />
                    계좌추가/매체
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="applicationType"
                      value="password_reset"
                    />
                    비밀번호(재등록/오류매체)
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="applicationType"
                      value="security_media"
                    />
                    보안매체(발급/재발급)
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="applicationType"
                      value="limit_change"
                    />
                    이체한도 변경
                  </label>
                  <label>
                    <input type="radio" name="applicationType" value="other" />
                    기타
                  </label>
                </div>
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>서비스 유형</th>
              <td className={styles.tdContent}>
                <div className={styles.checkboxGroup}>
                  <label>
                    <input
                      type="checkbox"
                      name="serviceType"
                      value="smartphone_internet"
                    />
                    스마트폰+인터넷뱅킹
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="serviceType"
                      value="transfer_member"
                    />
                    이체회원
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="serviceType"
                      value="inquiry_member"
                    />
                    조회회원
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="serviceType"
                      value="smartphone_banking"
                    />
                    스마트폰뱅킹
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="serviceType"
                      value="phone_banking"
                    />
                    폰뱅킹
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="serviceType"
                      value="other_service"
                    />
                    기타
                  </label>
                </div>
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>성명</th>
              <td className={styles.tdContent}>
                <input
                  type="text"
                  name="customerName"
                  value={fieldValues.customerName || ""}
                  placeholder="홍길동"
                  readOnly
                  onClick={() =>
                    onFieldClick && onFieldClick("customerName", "성명", "text")
                  }
                  style={{ cursor: "pointer", width: "200px" }}
                />
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>주소</th>
              <td className={styles.tdContent}>
                <input
                  type="text"
                  name="customerAddress"
                  value={fieldValues.customerAddress || ""}
                  placeholder="서울시 강남구 테헤란로 123"
                  readOnly
                  onClick={() =>
                    onFieldClick &&
                    onFieldClick("customerAddress", "주소", "text")
                  }
                  style={{ cursor: "pointer", width: "400px" }}
                />
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>E-Mail주소</th>
              <td className={styles.tdContent}>
                <input
                  type="email"
                  name="customerEmail"
                  value={fieldValues.customerEmail || ""}
                  placeholder="example@email.com"
                  readOnly
                  onClick={() =>
                    onFieldClick &&
                    onFieldClick("customerEmail", "E-Mail주소", "email")
                  }
                  style={{ cursor: "pointer", width: "300px" }}
                />
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>이용자 ID</th>
              <td className={styles.tdContent}>
                <input
                  type="text"
                  name="userId"
                  value={fieldValues.userId || ""}
                  placeholder="사용자ID"
                  readOnly
                  onClick={() =>
                    onFieldClick && onFieldClick("userId", "이용자 ID", "text")
                  }
                  style={{ cursor: "pointer", width: "200px" }}
                />
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>OTP발급수수료 인출 동의</th>
              <td className={styles.tdContent}>
                <label>
                  <input type="checkbox" name="otpAgreement" />
                  다음 계좌에서 OTP발급수수료를 인출함에 동의합니다
                </label>
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>OTP 수수료 인출 계좌</th>
              <td className={styles.tdContent}>
                <input
                  type="text"
                  name="otpAccount"
                  value={fieldValues.otpAccount || ""}
                  placeholder="계좌번호를 입력하세요"
                  readOnly
                  onClick={() =>
                    onFieldClick &&
                    onFieldClick("otpAccount", "OTP 수수료 인출 계좌", "text")
                  }
                  style={{ cursor: "pointer", width: "300px" }}
                />
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>1일이체한도</th>
              <td className={styles.tdContent}>
                <input
                  type="text"
                  name="dailyTransferLimit"
                  value={fieldValues.dailyTransferLimit || ""}
                  placeholder="삼백만원"
                  readOnly
                  onClick={() =>
                    onFieldClick &&
                    onFieldClick("dailyTransferLimit", "1일이체한도", "text")
                  }
                  style={{ cursor: "pointer", width: "200px" }}
                />
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>1회이체한도</th>
              <td className={styles.tdContent}>
                <input
                  type="text"
                  name="singleTransferLimit"
                  value={fieldValues.singleTransferLimit || ""}
                  placeholder="일백만원"
                  readOnly
                  onClick={() =>
                    onFieldClick &&
                    onFieldClick("singleTransferLimit", "1회이체한도", "text")
                  }
                  style={{ cursor: "pointer", width: "200px" }}
                />
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>출금계좌지정</th>
              <td className={styles.tdContent}>
                <input
                  type="text"
                  name="withdrawalAccount"
                  value={fieldValues.withdrawalAccount || ""}
                  placeholder="출금계좌번호"
                  readOnly
                  onClick={() =>
                    onFieldClick &&
                    onFieldClick("withdrawalAccount", "출금계좌지정", "text")
                  }
                  style={{ cursor: "pointer", width: "300px" }}
                />
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>입금계좌지정</th>
              <td className={styles.tdContent}>
                <input
                  type="text"
                  name="depositAccount"
                  value={fieldValues.depositAccount || ""}
                  placeholder="입금계좌번호"
                  readOnly
                  onClick={() =>
                    onFieldClick &&
                    onFieldClick("depositAccount", "입금계좌지정", "text")
                  }
                  style={{ cursor: "pointer", width: "300px" }}
                />
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>폰뱅킹단축번호</th>
              <td className={styles.tdContent}>
                <input
                  type="text"
                  name="phoneBankingShortcut"
                  value={fieldValues.phoneBankingShortcut || ""}
                  placeholder="2자리 숫자"
                  readOnly
                  onClick={() =>
                    onFieldClick &&
                    onFieldClick(
                      "phoneBankingShortcut",
                      "폰뱅킹단축번호",
                      "text"
                    )
                  }
                  style={{ cursor: "pointer", width: "100px" }}
                />
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>폰뱅킹 지정전화번호</th>
              <td className={styles.tdContent}>
                <div className={styles.phoneNumbers}>
                  <input
                    type="tel"
                    name="phoneBankingNumber1"
                    value={fieldValues.phoneBankingNumber1 || ""}
                    placeholder="010-1234-5678"
                    readOnly
                    onClick={() =>
                      onFieldClick &&
                      onFieldClick(
                        "phoneBankingNumber1",
                        "폰뱅킹 지정전화번호 1",
                        "tel"
                      )
                    }
                    style={{
                      cursor: "pointer",
                      width: "150px",
                      marginRight: "10px",
                    }}
                  />
                  <input
                    type="tel"
                    name="phoneBankingNumber2"
                    value={fieldValues.phoneBankingNumber2 || ""}
                    placeholder="010-1234-5678"
                    readOnly
                    onClick={() =>
                      onFieldClick &&
                      onFieldClick(
                        "phoneBankingNumber2",
                        "폰뱅킹 지정전화번호 2",
                        "tel"
                      )
                    }
                    style={{
                      cursor: "pointer",
                      width: "150px",
                      marginRight: "10px",
                    }}
                  />
                  <br />
                  <input
                    type="tel"
                    name="phoneBankingNumber3"
                    value={fieldValues.phoneBankingNumber3 || ""}
                    placeholder="010-1234-5678"
                    readOnly
                    onClick={() =>
                      onFieldClick &&
                      onFieldClick(
                        "phoneBankingNumber3",
                        "폰뱅킹 지정전화번호 3",
                        "tel"
                      )
                    }
                    style={{
                      cursor: "pointer",
                      width: "150px",
                      marginRight: "10px",
                    }}
                  />
                  <input
                    type="tel"
                    name="phoneBankingNumber4"
                    value={fieldValues.phoneBankingNumber4 || ""}
                    placeholder="010-1234-5678"
                    readOnly
                    onClick={() =>
                      onFieldClick &&
                      onFieldClick(
                        "phoneBankingNumber4",
                        "폰뱅킹 지정전화번호 4",
                        "tel"
                      )
                    }
                    style={{ cursor: "pointer", width: "150px" }}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <th className={styles.thFirst}>기타 신청사항</th>
              <td className={styles.tdContent}>
                <div className={styles.additionalServices}>
                  <label>
                    <input type="checkbox" name="oneTimeAuthNumber" />
                    1회용 인증번호 발급 (개) - 최대 5개까지 발급가능
                  </label>
                  <div className={styles.delayedTransfer}>
                    <label>지연이체 서비스:</label>
                    <label>
                      <input
                        type="radio"
                        name="delayedTransferService"
                        value="3hour"
                      />
                      3시간지연
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="delayedTransferService"
                        value="4hour"
                      />
                      4시간지연
                    </label>
                  </div>
                  <label>
                    <input type="checkbox" name="overseasIpBlock" />
                    해외IP차단서비스 신청
                  </label>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

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
              신청인 성명 :{" "}
              <input
                type="text"
                style={{ width: "100px", cursor: "pointer" }}
                value={fieldValues.customerName || ""}
                readOnly
                onClick={() =>
                  onFieldClick &&
                  onFieldClick("customerName", "신청인 성명", "text")
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
          <span>3-08-0221 (2025.01 개정)</span>
          <span className={styles.bankLogo}>
            <img src="https://i.imgur.com/2Yh4P3G.png" alt="Hana Bank Logo" />
          </span>
          <span>(보존년한 금융거래종료일로부터 5년)</span>
        </footer>
      </div>
    </div>
  );
};

export default ElectronicFinanceForm;
