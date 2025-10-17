// 스크린샷 저장 유틸리티 함수들

import html2canvas from "html2canvas";

/**
 * 특정 DOM 요소를 스크린샷으로 캡처하고 이미지로 저장
 * @param {HTMLElement} element - 캡처할 DOM 요소
 * @param {string} filename - 저장할 파일명
 * @param {Object} options - html2canvas 옵션
 */
export const captureElementScreenshot = async (
  element,
  filename,
  options = {}
) => {
  try {
    const defaultOptions = {
      scale: 2, // 고해상도
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      ...options,
    };

    console.log("📸 스크린샷 캡처 시작:", filename);

    const canvas = await html2canvas(element, defaultOptions);

    // Canvas를 Blob으로 변환
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Blob을 다운로드 링크로 변환
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;

            // 자동 다운로드
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // 메모리 정리
            URL.revokeObjectURL(url);

            console.log("✅ 스크린샷 저장 완료:", filename);
            resolve(blob);
          } else {
            reject(new Error("스크린샷 생성 실패"));
          }
        },
        "image/png",
        0.95
      );
    });
  } catch (error) {
    console.error("❌ 스크린샷 캡처 실패:", error);
    throw error;
  }
};

/**
 * 서식 데이터를 JSON 파일로 저장
 * @param {Object} formData - 서식 데이터
 * @param {string} filename - 저장할 파일명
 */
export const saveFormDataAsJSON = (formData, filename) => {
  try {
    const dataStr = JSON.stringify(formData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    console.log("✅ 서식 데이터 JSON 저장 완료:", filename);
  } catch (error) {
    console.error("❌ JSON 저장 실패:", error);
    throw error;
  }
};

/**
 * 서식 완성도 체크
 * @param {Object} fieldValues - 필드 값들
 * @param {string} formType - 서식 타입
 * @returns {Object} 완성도 정보
 */
export const checkFormCompletion = (fieldValues, formType) => {
  // 필드 매핑에서 필수 필드들 가져오기
  const requiredFields = Object.entries(fieldValues).filter(
    ([fieldId, value]) => {
      // 실제로는 fieldMapping에서 필수 필드 정보를 가져와야 함
      return value && value.toString().trim() !== "";
    }
  );

  const totalFields = Object.keys(fieldValues).length;
  const completedFields = requiredFields.length;
  const completionRate =
    totalFields > 0 ? (completedFields / totalFields) * 100 : 0;

  return {
    totalFields,
    completedFields,
    completionRate: Math.round(completionRate),
    isComplete: completionRate >= 80, // 80% 이상 완성되면 완료로 간주
  };
};

/**
 * 서식 스크린샷과 데이터를 함께 저장
 * @param {HTMLElement} formElement - 서식 DOM 요소
 * @param {Object} formData - 서식 데이터
 * @param {string} formName - 서식명
 * @param {string} customerName - 고객명
 */
export const saveFormWithScreenshot = async (
  formElement,
  formData,
  formName,
  customerName
) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const baseFilename = `${customerName}_${formName}_${timestamp}`;

    // 완성도 체크
    const completion = checkFormCompletion(formData, formName);

    console.log("📊 서식 완성도:", completion);

    // 스크린샷 캡처
    await captureElementScreenshot(formElement, `${baseFilename}.png`, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    // 데이터 JSON 저장
    const dataWithCompletion = {
      ...formData,
      _metadata: {
        formName,
        customerName,
        timestamp: new Date().toISOString(),
        completion,
      },
    };

    saveFormDataAsJSON(dataWithCompletion, `${baseFilename}.json`);

    return {
      success: true,
      completion,
      files: [`${baseFilename}.png`, `${baseFilename}.json`],
    };
  } catch (error) {
    console.error("❌ 서식 저장 실패:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 모든 서식을 일괄 저장
 * @param {Array} forms - 서식 배열 [{element, data, name}]
 * @param {string} customerName - 고객명
 */
export const saveAllForms = async (forms, customerName) => {
  const results = [];

  for (const form of forms) {
    try {
      const result = await saveFormWithScreenshot(
        form.element,
        form.data,
        form.name,
        customerName
      );
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        formName: form.name,
        error: error.message,
      });
    }
  }

  return results;
};
