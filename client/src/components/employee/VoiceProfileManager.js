import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { supabase } from "../../config/supabase";

const ProfileContainer = styled.div`
  position: fixed;
  top: 20px;
  left: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 20px;
  z-index: 1000;
  min-width: 400px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
`;

const ProfileTitle = styled.h3`
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
`;

const ProfileForm = styled.div`
  margin-bottom: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;

  &:disabled {
    background-color: #f8f9fa;
    color: #6c757d;
    cursor: not-allowed;
  }
`;

const RecordButton = styled.button`
  background: ${(props) => (props.isRecording ? "#ff4757" : "#2ed573")};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  margin-bottom: 10px;

  &:hover {
    background: ${(props) => (props.isRecording ? "#ff3742" : "#26d065")};
    transform: translateY(-1px);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
  }
`;

const SaveButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;

  &:hover {
    background: #0056b3;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 6px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props) => {
    if (props.isRecording) return "#ff4757";
    if (props.isProcessing) return "#ffa502";
    return "#2ed573";
  }};
  animation: ${(props) => (props.isRecording ? "pulse 1.5s infinite" : "none")};

  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
`;

const StatusText = styled.span`
  font-size: 14px;
  color: #666;
`;

const ProfileList = styled.div`
  margin-top: 20px;
`;

const ProfileItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-bottom: 8px;
  background: #f8f9fa;
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const ProfileName = styled.div`
  font-weight: 600;
  color: #333;
  font-size: 14px;
`;

const ProfileDetails = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 2px;
`;

const DeleteButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: #c82333;
  }
`;

const ErrorMessage = styled.div`
  background: #ffe6e6;
  color: #d63031;
  padding: 10px;
  border-radius: 6px;
  font-size: 13px;
  margin-top: 10px;
`;

const SuccessMessage = styled.div`
  background: #e8f5e8;
  color: #2d5a2d;
  padding: 10px;
  border-radius: 6px;
  font-size: 13px;
  margin-top: 10px;
`;

const VoiceProfileManager = ({ employee, onProfileSaved }) => {
  const [employeeId, setEmployeeId] = useState(employee?.id || "");
  const [employeeName, setEmployeeName] = useState(employee?.name || "");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("voice_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("프로필 로드 실패:", error);
        return;
      }

      setProfiles(data || []);
    } catch (err) {
      console.error("프로필 로드 실패:", err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        setRecordedAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError("마이크 접근 권한이 필요합니다.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveProfile = async () => {
    if (!employeeId || !employeeName || !recordedAudio) {
      setError("모든 필드를 입력하고 음성을 녹음해주세요.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. 오디오 파일을 Supabase Storage에 업로드
      const fileName = `${employeeId}_${Date.now()}.wav`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("voice-profiles")
        .upload(fileName, recordedAudio, {
          contentType: "audio/wav",
        });

      if (uploadError) {
        throw new Error(`오디오 업로드 실패: ${uploadError.message}`);
      }

      // 2. 공개 URL 생성
      const { data: publicUrlData } = supabase.storage
        .from("voice-profiles")
        .getPublicUrl(fileName);

      // 3. 음성 프로필 데이터를 Supabase에 저장
      const { data, error } = await supabase.from("voice_profiles").upsert({
        employee_id: employeeId,
        employee_name: employeeName,
        audio_file_url: publicUrlData.publicUrl,
        confidence_score: 0.9,
      });

      if (error) {
        throw new Error(`프로필 저장 실패: ${error.message}`);
      }

      setSuccess("음성 프로필이 성공적으로 저장되었습니다!");
      setEmployeeId("");
      setEmployeeName("");
      setRecordedAudio(null);
      loadProfiles();

      // 프로필 저장 완료 콜백 호출
      if (onProfileSaved) {
        onProfileSaved();
      }
    } catch (err) {
      setError(err.message || "프로필 저장에 실패했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteProfile = async (employeeId) => {
    try {
      // 1. 프로필 조회하여 오디오 파일 URL 가져오기
      const { data: profile, error: fetchError } = await supabase
        .from("voice_profiles")
        .select("audio_file_url")
        .eq("employee_id", employeeId)
        .single();

      if (fetchError) {
        throw new Error(`프로필 조회 실패: ${fetchError.message}`);
      }

      // 2. Storage에서 오디오 파일 삭제
      if (profile.audio_file_url) {
        const fileName = profile.audio_file_url.split("/").pop();
        const { error: deleteError } = await supabase.storage
          .from("voice-profiles")
          .remove([fileName]);

        if (deleteError) {
          console.warn("오디오 파일 삭제 실패:", deleteError);
        }
      }

      // 3. 데이터베이스에서 프로필 삭제
      const { error: dbError } = await supabase
        .from("voice_profiles")
        .delete()
        .eq("employee_id", employeeId);

      if (dbError) {
        throw new Error(`프로필 삭제 실패: ${dbError.message}`);
      }

      setSuccess("프로필이 삭제되었습니다.");
      loadProfiles();
    } catch (err) {
      setError(err.message || "프로필 삭제에 실패했습니다.");
    }
  };

  return (
    <ProfileContainer>
      <ProfileTitle>🎤 음성 프로필 관리</ProfileTitle>

      <ProfileForm>
        <FormGroup>
          <FormLabel>행원 ID</FormLabel>
          <FormInput
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="예: E001"
            disabled={!!employee?.id}
          />
        </FormGroup>

        <FormGroup>
          <FormLabel>행원 이름</FormLabel>
          <FormInput
            type="text"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            placeholder="예: 김행원"
            disabled={!!employee?.name}
          />
        </FormGroup>

        <StatusIndicator>
          <StatusDot isRecording={isRecording} isProcessing={isProcessing} />
          <StatusText>
            {isProcessing
              ? "처리 중..."
              : isRecording
              ? "녹음 중... (10초간 말씀해주세요)"
              : recordedAudio
              ? "녹음 완료"
              : "녹음 준비"}
          </StatusText>
        </StatusIndicator>

        <RecordButton
          onClick={isRecording ? stopRecording : startRecording}
          isRecording={isRecording}
          disabled={isProcessing}
        >
          {isRecording ? "녹음 중지" : "음성 녹음 시작"}
        </RecordButton>

        <SaveButton
          onClick={saveProfile}
          disabled={
            !employeeId || !employeeName || !recordedAudio || isProcessing
          }
        >
          {isProcessing ? "저장 중..." : "음성 프로필 저장"}
        </SaveButton>
      </ProfileForm>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <ProfileList>
        <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>
          저장된 음성 프로필
        </h4>
        {profiles.length === 0 ? (
          <div
            style={{ textAlign: "center", color: "#666", fontStyle: "italic" }}
          >
            저장된 프로필이 없습니다.
          </div>
        ) : (
          profiles.map((profile) => (
            <ProfileItem key={profile.employee_id}>
              <ProfileInfo>
                <ProfileName>{profile.employee_name}</ProfileName>
                <ProfileDetails>
                  ID: {profile.employee_id} | 신뢰도:{" "}
                  {(profile.confidence_score * 100).toFixed(1)}% | 생성일:{" "}
                  {new Date(profile.created_at).toLocaleDateString()}
                </ProfileDetails>
              </ProfileInfo>
              <DeleteButton onClick={() => deleteProfile(profile.employee_id)}>
                삭제
              </DeleteButton>
            </ProfileItem>
          ))
        )}
      </ProfileList>
    </ProfileContainer>
  );
};

export default VoiceProfileManager;
