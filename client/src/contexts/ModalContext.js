import React, { createContext, useContext, useState } from "react";

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState({});

  const openModal = (modalType, data = {}) => {
    setModals((prev) => ({
      ...prev,
      [modalType]: {
        isOpen: true,
        data: data,
      },
    }));
  };

  const closeModal = (modalType) => {
    setModals((prev) => ({
      ...prev,
      [modalType]: {
        isOpen: false,
        data: null,
      },
    }));
  };

  const isModalOpen = (modalType) => {
    return modals[modalType]?.isOpen || false;
  };

  const getModalData = (modalType) => {
    return modals[modalType]?.data || null;
  };

  const value = {
    openModal,
    closeModal,
    isModalOpen,
    getModalData,
  };

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  );
};
