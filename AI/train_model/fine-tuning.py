#!/usr/bin/env python3
"""
Train employee/customer classifier from AI-Hub JSON data.
This script reads AI-Hub JSON files and trains a speaker role classifier.
"""
import argparse
import glob
import json
import os
import sys
from typing import Dict, List, Tuple, Iterator

import numpy as np
import soundfile as sf
import torch
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.pipeline import Pipeline as SkPipeline
from sklearn.preprocessing import StandardScaler
import joblib

from pyannote.audio import Model

def resolve_role_by_speaker_id(json_obj: dict) -> Dict[str, str]:
role_by_id: Dict[str, str] = {}
type_info = json_obj.get("dataSet", {}).get("typeInfo", {})
for speaker in type_info.get("speakers", []):
    speaker_id = speaker.get("id", "")
    speaker_type = speaker.get("type", "")

    if speaker_type in ["상담원", "직원", "employee"]:
        role_by_id[speaker_id] = "employee"
    elif speaker_type in ["고객", "customer"]:
        role_by_id[speaker_id] = "customer"
    else:
        role_by_id[speaker_id] = "customer"

return role_by_id

def iter_utterances(json_path: str, data_root: str) -> Iterator[Tuple[str, str]]:
try:
with open(json_path, 'r', encoding='utf-8-sig') as f:
data = json.load(f)
except Exception as e:
# print(f"오류: {json_path} 파일 로드 중 오류: {e}", file=sys.stderr)
return
role_by_id = resolve_role_by_speaker_id(data)
json_dir = os.path.dirname(json_path)

for dialog in data.get("dataSet", {}).get("dialogs", []):
    audio_path_in_json = dialog.get("audioPath", "")
    speaker_id = dialog.get("speaker", "")

    if not audio_path_in_json or not speaker_id:
        continue

    final_path = None
    attempt1_path = os.path.join(json_dir, os.path.basename(audio_path_in_json))
    attempt2_path = os.path.join(data_root, audio_path_in_json)

    if os.path.exists(attempt1_path):
        final_path = attempt1_path
    elif os.path.exists(attempt2_path):
        final_path = attempt2_path
    else:
        continue

    role = role_by_id.get(speaker_id, "customer")
    yield final_path, role

def build_from_list(json_list: List[str], data_root: str, model: Model, label_map: Dict[str, int], device: str):
X: List[np.ndarray] = []
y: List[int] = []
for jf in json_list:
    samples = list(iter_utterances(jf, data_root))

    for wav_path, role in samples:
        try:
            audio, sr = sf.read(wav_path)

            # ⭐️⭐️⭐️ 최종 수정: 1초 미만의 매우 짧은 오디오는 건너뛰도록 기준 강화 ⭐️⭐️⭐️
            if len(audio) < sr:
                continue

            if audio.ndim > 1:
                audio = np.mean(audio, axis=1)

            waveform = torch.tensor(audio, dtype=torch.float32).unsqueeze(0)
            waveform = waveform.to(device)

            with torch.no_grad():
                emb = model(waveform).squeeze(0).cpu().numpy()
            X.append(emb)
            y.append(label_map[role])
        except Exception as e:
            # 너무 짧아서 발생하는 오류는 이제 무시해도 되므로, 상세 오류 메시지 출력은 주석 처리
            # print(f"오류: {wav_path} 처리 중 예외 발생: {e}", file=sys.stderr)
            continue

if not X:
    raise RuntimeError(f"오류: {len(json_list)}개의 JSON 파일로부터 샘플을 만들지 못했습니다. 파일 경로와 JSON 내부 키를 다시 확인하세요.")

return np.stack(X), np.array(y)

def main():
parser = argparse.ArgumentParser(description="AI-Hub JSON 데이터로 직원/고객 분류기 학습")
parser.add_argument("--data_root", type=str, required=True, help="JSON의 audioPath를 해석하기 위한 기준 디렉토리")
parser.add_argument("--sessions_root", type=str, required=True, help="학습할 JSON 파일들이 있는 최상위 디렉토리")
parser.add_argument("--json_pattern", type=str, default="**/*.json", help="JSON 파일을 찾기 위한 Glob 패턴")
parser.add_argument("--val_ratio", type=float, default=0.1, help="자동 분할 시 사용할 검증 세트 비율")
parser.add_argument("--output_dir", type=str, required=True, help="모델 결과물을 저장할 디렉토리")
parser.add_argument("--embedding_model", type=str, default="pyannote/embedding", help="사전 학습된 임베딩 모델 ID")
parser.add_argument("--device", type=str, default="cuda" if torch.cuda.is_available() else "cpu")
args = parser.parse_args()
os.makedirs(args.output_dir, exist_ok=True)
label_map = {"employee": 0, "customer": 1}

print(f"임베딩 모델 로딩: {args.embedding_model}")
try:
    model = Model.from_pretrained(args.embedding_model, use_auth_token=os.getenv("HUGGINGFACE_TOKEN"))
    model = model.to(args.device)
    print(f"모델 로딩 성공 ({args.device})")
except Exception as e:
    print(f"모델 로딩 실패: {e}", file=sys.stderr)
    sys.exit(1)

all_jsons = sorted(glob.glob(os.path.join(args.sessions_root, args.json_pattern), recursive=True))
if not all_jsons:
    raise RuntimeError(f"{args.sessions_root}와 {args.json_pattern} 패턴으로 JSON 파일을 찾지 못했습니다.")

rng = np.random.default_rng(42)
rng.shuffle(all_jsons)
val_count = max(1, int(len(all_jsons) * args.val_ratio))
val_jsons = set(all_jsons[:val_count])
train_jsons = set(all_jsons[val_count:])

print(f"총 {len(all_jsons)}개 JSON 발견 -> 학습: {len(train_jsons)}개, 검증: {len(val_jsons)}개")

print("\\n[학습 데이터셋 빌드 시작]")
X_train, y_train = build_from_list(list(train_jsons), args.data_root, model, label_map, args.device)
print("[학습 데이터셋 빌드 완료]")

print("\\n[검증 데이터셋 빌드 시작]")
X_val, y_val = build_from_list(list(val_jsons), args.data_root, model, label_map, args.device)
print("[검증 데이터셋 빌드 완료]")

print(f"\\n학습 세트: {X_train.shape[0]}개 샘플")
print(f"검증 세트: {X_val.shape[0]}개 샘플")

print("\\n분류기 학습 시작...")
clf = SkPipeline([
    ('scaler', StandardScaler()),
    ('classifier', LogisticRegression(random_state=42, max_iter=1000, class_weight='balanced'))
])
clf.fit(X_train, y_train)
print("분류기 학습 완료.")

print("\\n평가 중...")
y_pred = clf.predict(X_val)
report = classification_report(y_val, y_pred, target_names=['employee', 'customer'])
print("--- 평가 결과 ---")
print(report)

model_path = os.path.join(args.output_dir, "speaker_role_classifier.joblib")
joblib.dump(clf, model_path)
print(f"\\n모델 저장 완료: {model_path}")

label_path = os.path.join(args.output_dir, "label_mapping.json")
with open(label_path, 'w') as f:
    json.dump(label_map, f, indent=2)
print(f"라벨 맵 저장 완료: {label_path}")

if **name** == "**main**":
main()