/**
 * 최적화된 폼 뷰어 훅
 * PDF 로딩, 스키마 컴파일, 필드 매핑을 최적화
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import formSchemaCompiler from "../utils/FormSchemaCompiler";

const useOptimizedFormViewer = (formUrl, formSchema, formData = {}) => {
  // 상태 관리
  const [isLoading, setIsLoading] = useState(true);
  const [pdfError, setPdfError] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // 캐시된 데이터
  const [cachedPdf, setCachedPdf] = useState(null);
  const [compiledSchema, setCompiledSchema] = useState(null);

  // 참조
  const containerRef = useRef(null);
  const pdfCacheRef = useRef(new Map());
  const fieldPositionCacheRef = useRef(new Map());

  /**
   * PDF 캐싱 및 지연 로딩
   */
  const loadPDFWithCache = useCallback(async (url) => {
    if (!url) return null;

    // 캐시 확인
    if (pdfCacheRef.current.has(url)) {
      console.log(`✅ PDF 캐시 히트: ${url}`);
      return pdfCacheRef.current.get(url);
    }

    console.log(`📥 PDF 로딩 시작: ${url}`);
    setIsLoading(true);
    setPdfError(null);

    try {
      // 실제 PDF 로딩 로직 (여기서는 시뮬레이션)
      const pdfData = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            url,
            loadedAt: Date.now(),
            size: Math.random() * 1000000, // 예시 크기
          });
        }, 500); // 로딩 시뮬레이션
      });

      // 캐시에 저장
      pdfCacheRef.current.set(url, pdfData);
      console.log(`✅ PDF 로딩 완료: ${url}`);

      return pdfData;
    } catch (error) {
      console.error(`❌ PDF 로딩 실패: ${url}`, error);
      setPdfError("PDF 파일을 불러올 수 없습니다.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 스키마 컴파일
   */
  const compileSchema = useCallback((schema) => {
    if (!schema) return null;

    const compiled = formSchemaCompiler.compile(schema);
    setCompiledSchema(compiled);
    return compiled;
  }, []);

  /**
   * 필드 위치 사전 계산
   */
  const precomputeFieldPositions = useCallback(
    (fields, containerWidth, containerHeight) => {
      if (!fields || !containerWidth || !containerHeight) return [];

      const cacheKey = `${fields.length}_${containerWidth}_${containerHeight}`;

      // 캐시 확인
      if (fieldPositionCacheRef.current.has(cacheKey)) {
        return fieldPositionCacheRef.current.get(cacheKey);
      }

      console.log(`🔧 필드 위치 사전 계산: ${fields.length}개 필드`);

      const precomputedFields = fields.map((field) => {
        const scaleX = containerWidth / 595.28; // A4 너비 기준
        const scaleY = containerHeight / 841.89; // A4 높이 기준

        return {
          ...field,
          screenPosition: {
            x: field.x * scaleX,
            y: field.y * scaleY,
            width: field.width * scaleX,
            height: field.height * scaleY,
            scaleX,
            scaleY,
          },
        };
      });

      // 캐시에 저장
      fieldPositionCacheRef.current.set(cacheKey, precomputedFields);
      console.log(`✅ 필드 위치 계산 완료: ${precomputedFields.length}개`);

      return precomputedFields;
    },
    []
  );

  /**
   * 컨테이너 크기 업데이트
   */
  const updateContainerSize = useCallback(() => {
    if (containerRef.current) {
      const { offsetWidth, offsetHeight } = containerRef.current;
      setContainerSize({ width: offsetWidth, height: offsetHeight });
    }
  }, []);

  /**
   * 최적화된 필드 검색
   */
  const findField = useCallback(
    (searchTerm) => {
      if (!compiledSchema) return null;
      return formSchemaCompiler.findField(compiledSchema, searchTerm);
    },
    [compiledSchema]
  );

  /**
   * 페이지별 필드 조회
   */
  const getFieldsByPage = useCallback(
    (pageNumber) => {
      if (!compiledSchema) return [];
      return formSchemaCompiler.getFieldsByPage(compiledSchema, pageNumber);
    },
    [compiledSchema]
  );

  /**
   * 타입별 필드 조회
   */
  const getFieldsByType = useCallback(
    (type) => {
      if (!compiledSchema) return [];
      return formSchemaCompiler.getFieldsByType(compiledSchema, type);
    },
    [compiledSchema]
  );

  /**
   * 필드 유효성 검사
   */
  const validateField = useCallback(
    (fieldId, value) => {
      if (!compiledSchema) return { isValid: true, errors: [] };

      const field = findField(fieldId);
      if (!field || !field.validationRules) {
        return { isValid: true, errors: [] };
      }

      const errors = [];
      field.validationRules.forEach((rule) => {
        const validator = compiledSchema.validators[rule.type];
        if (validator && validator.compiled && !validator.compiled(value)) {
          errors.push(rule.message);
        }
      });

      return {
        isValid: errors.length === 0,
        errors,
      };
    },
    [compiledSchema, findField]
  );

  /**
   * 자동완성 필드 찾기
   */
  const findAutoCompleteFields = useCallback(
    (fieldId, value) => {
      if (!compiledSchema) return [];

      const sourceField = findField(fieldId);
      if (!sourceField || !sourceField.autoCompletePatterns) return [];

      const autoCompleteFields = [];
      const patterns = sourceField.autoCompletePatterns;

      compiledSchema.fields.forEach((field) => {
        if (field.id === fieldId) return; // 자기 자신 제외

        const fieldLabel = (field.label || field.id).toLowerCase();
        const hasMatchingPattern = patterns.some((pattern) =>
          fieldLabel.includes(pattern.toLowerCase())
        );

        if (hasMatchingPattern) {
          autoCompleteFields.push({
            ...field,
            currentValue: formData[field.id] || field.defaultValue,
          });
        }
      });

      return autoCompleteFields;
    },
    [compiledSchema, findField, formData]
  );

  /**
   * 성능 통계
   */
  const getPerformanceStats = useCallback(() => {
    return {
      pdfCache: {
        size: pdfCacheRef.current.size,
        urls: Array.from(pdfCacheRef.current.keys()),
      },
      fieldPositionCache: {
        size: fieldPositionCacheRef.current.size,
      },
      schemaCompiler: formSchemaCompiler.getCacheStats(),
      containerSize,
      isLoading,
      hasError: !!pdfError,
    };
  }, [containerSize, isLoading, pdfError]);

  // 초기화
  useEffect(() => {
    if (formUrl) {
      loadPDFWithCache(formUrl);
    }
  }, [formUrl, loadPDFWithCache]);

  useEffect(() => {
    if (formSchema) {
      compileSchema(formSchema);
    }
  }, [formSchema, compileSchema]);

  useEffect(() => {
    updateContainerSize();

    const handleResize = () => {
      updateContainerSize();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateContainerSize]);

  // 메모이제이션된 값들
  const optimizedFields = useMemo(() => {
    if (!compiledSchema || !containerSize.width || !containerSize.height) {
      return [];
    }
    return precomputeFieldPositions(
      compiledSchema.fields,
      containerSize.width,
      containerSize.height
    );
  }, [compiledSchema, containerSize, precomputeFieldPositions]);

  const fieldsByPage = useMemo(() => {
    if (!compiledSchema) return new Map();

    const pageMap = new Map();
    compiledSchema.fields.forEach((field) => {
      const page = field.page || 1;
      if (!pageMap.has(page)) {
        pageMap.set(page, []);
      }
      pageMap.get(page).push(field);
    });

    return pageMap;
  }, [compiledSchema]);

  return {
    // 상태
    isLoading,
    pdfError,
    numPages,
    containerSize,
    cachedPdf,
    compiledSchema,

    // 최적화된 데이터
    optimizedFields,
    fieldsByPage,

    // 참조
    containerRef,

    // 메서드
    findField,
    getFieldsByPage,
    getFieldsByType,
    validateField,
    findAutoCompleteFields,
    getPerformanceStats,

    // 유틸리티
    updateContainerSize,
    clearCaches: () => {
      pdfCacheRef.current.clear();
      fieldPositionCacheRef.current.clear();
      formSchemaCompiler.clearCache();
    },
  };
};

export default useOptimizedFormViewer;

