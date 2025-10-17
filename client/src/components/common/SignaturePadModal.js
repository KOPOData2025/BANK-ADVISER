import React from "react";
import SignaturePad from "./SignaturePad";

const SignaturePadModal = ({
  isOpen,
  onClose,
  onSave,
  fieldLabel = "서명",
}) => {
  if (!isOpen) return null;

  // SignaturePad 자체가 오버레이/모달 UI를 포함하고 있으므로 그대로 위임
  return (
    <SignaturePad
      fieldLabel={fieldLabel}
      onCancel={onClose}
      onSave={(dataUrl) => {
        onSave({ signature: dataUrl });
        onClose();
      }}
    />
  );
};

export default SignaturePadModal;
