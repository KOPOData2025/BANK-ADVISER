import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import styled from "styled-components";

import EmployeeLogin from "./components/employee/EmployeeLogin";
import EmployeeDashboard from "./components/employee/EmployeeDashboard";
import CustomerInterface from "./components/customer/CustomerInterface";
import CustomerTablet from "./components/customer/CustomerTablet";
import ProductComparison from "./components/product/ProductComparison";
import NotFound from "./components/common/NotFound";
import ToastManager from "./components/common/Toast";

const AppContainer = styled.div`
  height: 100vh;
  background-color: var(--hana-bg-gray);
  font-family: var(--hana-font-family);

  /* 태블릿에서는 스케일링 비활성화 */
  @media (min-width: 768px) {
    transform: none;
    width: 100%;
    height: 100vh;
    overflow: auto; /* 직원 화면에서 스크롤 허용 */
  }

  /* 모바일에서는 기존 스케일링 유지 */
  @media (max-width: 767px) {
    transform: scale(0.67);
    transform-origin: top left;
    width: 149.25%; /* 100 / 0.67 = 149.25% */
    height: 149.25vh; /* 100vh / 0.67 = 149.25vh */
    overflow: hidden; /* 스크롤 방지 */
  }
`;

function App() {
  return (
    <Router>
      <AppContainer>
        <Routes>
          <Route path="/" element={<Navigate to="/employee/login" replace />} />
          <Route path="/employee/login" element={<EmployeeLogin />} />
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route
            path="/employee"
            element={<Navigate to="/employee/dashboard" replace />}
          />
          <Route path="/products/compare" element={<ProductComparison />} />
          <Route path="/customer/:sessionId" element={<CustomerInterface />} />
          <Route path="/customer" element={<CustomerTablet />} />
          <Route path="/tablet" element={<CustomerTablet />} />
          <Route
            path="/api/*"
            element={<Navigate to="/employee/login" replace />}
          />
          <Route
            path="/service/*"
            element={<Navigate to="/employee/login" replace />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ToastManager />
      </AppContainer>
    </Router>
  );
}

export default App;
