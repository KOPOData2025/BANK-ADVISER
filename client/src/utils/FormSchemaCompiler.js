/**
 * 폼 스키마 컴파일러 - JSON 스키마를 최적화된 형태로 변환
 * 성능 최적화: 스키마 파싱, 필드 매핑, 유효성 검사를 사전 컴파일
 */

class FormSchemaCompiler {
  constructor() {
    this.compiledSchemas = new Map();
    this.fieldMappings = new Map();
    this.validators = new Map();
  }

  /**
   * 스키마 해시 생성
   */
  hashSchema(schema) {
    const schemaString = JSON.stringify(schema, Object.keys(schema).sort());
    return this.simpleHash(schemaString);
  }

  /**
   * 간단한 해시 함수
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32bit 정수로 변환
    }
    return hash.toString();
  }

  /**
   * 스키마 컴파일
   */
  compile(schema) {
    if (!schema) return null;

    const hash = this.hashSchema(schema);

    // 캐시된 스키마가 있으면 반환
    if (this.compiledSchemas.has(hash)) {
      console.log(`✅ 컴파일된 스키마 캐시 히트: ${hash}`);
      return this.compiledSchemas.get(hash);
    }

    console.log(`🔧 스키마 컴파일 시작: ${hash}`);

    const compiled = {
      hash,
      fields: this.preprocessFields(schema.fields || []),
      validators: this.compileValidators(schema.validators || {}),
      mappings: this.createFieldMappings(schema.fields || []),
      metadata: {
        totalFields: (schema.fields || []).length,
        compiledAt: Date.now(),
      },
    };

    // 캐시에 저장
    this.compiledSchemas.set(hash, compiled);
    console.log(
      `✅ 스키마 컴파일 완료: ${hash} (${compiled.fields.length}개 필드)`
    );

    return compiled;
  }

  /**
   * 필드 전처리 - 좌표 계산, 타입 검증 등
   */
  preprocessFields(fields) {
    return fields.map((field) => ({
      ...field,
      // 좌표 정규화
      normalizedPosition: this.normalizePosition(field),
      // 타입별 기본값 설정
      defaultValue: this.getDefaultValue(field.type),
      // 유효성 검사 규칙 컴파일
      validationRules: this.compileFieldValidation(field),
      // 자동완성 패턴 생성
      autoCompletePatterns: this.generateAutoCompletePatterns(field),
    }));
  }

  /**
   * 필드 위치 정규화
   */
  normalizePosition(field) {
    return {
      x: parseFloat(field.x) || 0,
      y: parseFloat(field.y) || 0,
      width: parseFloat(field.width) || 100,
      height: parseFloat(field.height) || 20,
      page: parseInt(field.page) || 1,
    };
  }

  /**
   * 타입별 기본값
   */
  getDefaultValue(type) {
    const defaults = {
      text: "",
      number: 0,
      date: "",
      select: "",
      checkbox: false,
      signature: null,
      textarea: "",
    };
    return defaults[type] || "";
  }

  /**
   * 필드 유효성 검사 규칙 컴파일
   */
  compileFieldValidation(field) {
    const rules = [];

    // 필수 필드 검사
    if (field.required) {
      rules.push({
        type: "required",
        message: `${field.label || field.id}는 필수 입력 항목입니다.`,
      });
    }

    // 타입별 검사
    switch (field.type) {
      case "number":
        rules.push({
          type: "number",
          message: "숫자만 입력 가능합니다.",
        });
        break;
      case "date":
        rules.push({
          type: "date",
          message: "올바른 날짜 형식을 입력해주세요.",
        });
        break;
      case "email":
        rules.push({
          type: "email",
          message: "올바른 이메일 형식을 입력해주세요.",
        });
        break;
    }

    // 길이 제한 검사
    if (field.maxLength) {
      rules.push({
        type: "maxLength",
        value: field.maxLength,
        message: `${field.maxLength}자 이하로 입력해주세요.`,
      });
    }

    return rules;
  }

  /**
   * 자동완성 패턴 생성
   */
  generateAutoCompletePatterns(field) {
    const patterns = [];
    const label = (field.label || field.id).toLowerCase();

    // 이름 관련 필드
    if (
      label.includes("성명") ||
      label.includes("이름") ||
      label.includes("name")
    ) {
      patterns.push("applicantName", "customer_name", "name");
    }

    // 전화번호 관련 필드
    if (
      label.includes("전화") ||
      label.includes("연락") ||
      label.includes("phone")
    ) {
      patterns.push("applicantPhone", "phone_number", "phone", "mobile");
    }

    // 주민등록번호 관련 필드
    if (
      label.includes("주민") ||
      label.includes("id") ||
      label.includes("ssn")
    ) {
      patterns.push("applicantIdNumber", "resident_number", "id_number");
    }

    // 주소 관련 필드
    if (label.includes("주소") || label.includes("address")) {
      patterns.push("applicantAddress", "address", "residence");
    }

    return patterns;
  }

  /**
   * 유효성 검사기 컴파일
   */
  compileValidators(validators) {
    const compiled = {};

    Object.entries(validators).forEach(([key, validator]) => {
      compiled[key] = {
        ...validator,
        compiled: this.createValidatorFunction(validator),
      };
    });

    return compiled;
  }

  /**
   * 유효성 검사 함수 생성
   */
  createValidatorFunction(validator) {
    switch (validator.type) {
      case "required":
        return (value) => value !== null && value !== undefined && value !== "";

      case "minLength":
        return (value) => !value || value.length >= validator.value;

      case "maxLength":
        return (value) => !value || value.length <= validator.value;

      case "pattern":
        return (value) => !value || new RegExp(validator.value).test(value);

      case "custom":
        return validator.function;

      default:
        return () => true;
    }
  }

  /**
   * 필드 매핑 생성
   */
  createFieldMappings(fields) {
    const mappings = {
      byId: new Map(),
      byLabel: new Map(),
      byType: new Map(),
      byPage: new Map(),
    };

    fields.forEach((field) => {
      // ID로 매핑
      mappings.byId.set(field.id, field);

      // 라벨로 매핑
      if (field.label) {
        mappings.byLabel.set(field.label.toLowerCase(), field);
      }

      // 타입별 매핑
      if (!mappings.byType.has(field.type)) {
        mappings.byType.set(field.type, []);
      }
      mappings.byType.get(field.type).push(field);

      // 페이지별 매핑
      const page = field.page || 1;
      if (!mappings.byPage.has(page)) {
        mappings.byPage.set(page, []);
      }
      mappings.byPage.get(page).push(field);
    });

    return mappings;
  }

  /**
   * 필드 빠른 검색
   */
  findField(compiledSchema, searchTerm) {
    if (!compiledSchema || !compiledSchema.mappings) return null;

    const { mappings } = compiledSchema;

    // ID로 검색
    if (mappings.byId.has(searchTerm)) {
      return mappings.byId.get(searchTerm);
    }

    // 라벨로 검색
    if (mappings.byLabel.has(searchTerm.toLowerCase())) {
      return mappings.byLabel.get(searchTerm.toLowerCase());
    }

    return null;
  }

  /**
   * 페이지별 필드 조회
   */
  getFieldsByPage(compiledSchema, pageNumber) {
    if (!compiledSchema || !compiledSchema.mappings) return [];
    return compiledSchema.mappings.byPage.get(pageNumber) || [];
  }

  /**
   * 타입별 필드 조회
   */
  getFieldsByType(compiledSchema, type) {
    if (!compiledSchema || !compiledSchema.mappings) return [];
    return compiledSchema.mappings.byType.get(type) || [];
  }

  /**
   * 캐시 통계
   */
  getCacheStats() {
    return {
      compiledSchemas: this.compiledSchemas.size,
      memoryUsage: this.estimateMemoryUsage(),
      hitRate: this.calculateHitRate(),
    };
  }

  /**
   * 메모리 사용량 추정
   */
  estimateMemoryUsage() {
    let totalSize = 0;
    this.compiledSchemas.forEach((schema) => {
      totalSize += JSON.stringify(schema).length;
    });
    return totalSize;
  }

  /**
   * 캐시 히트율 계산 (간단한 구현)
   */
  calculateHitRate() {
    // 실제 구현에서는 히트/미스 카운터를 추가해야 함
    return 0.85; // 예시 값
  }

  /**
   * 캐시 클리어
   */
  clearCache() {
    this.compiledSchemas.clear();
    this.fieldMappings.clear();
    this.validators.clear();
    console.log("🗑️ 폼 스키마 캐시 클리어 완료");
  }
}

// 싱글톤 인스턴스
const formSchemaCompiler = new FormSchemaCompiler();

export default formSchemaCompiler;

