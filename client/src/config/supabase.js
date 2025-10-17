import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jhfjigeuxrxxbbsoflcd.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZmppZ2V1eHJ4eGJic29mbGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMDA1OTksImV4cCI6MjA3MTY3NjU5OX0.aCXzQYf1P1B2lVHUfDlLdjB-iq-ItlPRh6oWRTElRUQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage 관련 유틸리티 함수들
export const uploadToStorage = async (file, bucketName, fileName) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file);

    if (error) {
      throw error;
    }

    // 공개 URL 생성
    const { data: publicUrl } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return {
      success: true,
      url: publicUrl.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error("Storage 업로드 실패:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const uploadJsonToStorage = async (jsonData, bucketName, fileName) => {
  try {
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, blob);

    if (error) {
      throw error;
    }

    // 공개 URL 생성
    const { data: publicUrl } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return {
      success: true,
      url: publicUrl.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error("JSON Storage 업로드 실패:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const deleteFromStorage = async (bucketName, fileName) => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([fileName]);

    if (error) {
      throw error;
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Storage 삭제 실패:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
