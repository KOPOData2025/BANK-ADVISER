// 디버그 로그 스위치
export const DEBUG = false; // 필요할 때만 true로 변경

export const debugLog = (...args) => {
  if (DEBUG) {
    console.log(...args);
  }
};

export const debugWarn = (...args) => {
  if (DEBUG) {
    console.warn(...args);
  }
};

export const debugError = (...args) => {
  if (DEBUG) {
    console.error(...args);
  }
};
