import { getApiUrl } from "../config/api";

export async function fetchCustomerDetail(customerId) {
  const res = await fetch(getApiUrl(`/api/employee/customers/${customerId}`));
  if (!res.ok) throw new Error(`customer ${res.status}`);
  return res.json();
}

export async function fetchCustomerProducts(customerId) {
  // returns { success, data: { products: [], summary: {} } }
  const res = await fetch(
    getApiUrl(`/api/employee/customers/${customerId}/products`)
  );
  if (!res.ok) throw new Error(`products ${res.status}`);
  return res.json();
}

export async function fetchPortfolioAnalysis(customerId) {
  // Backend doesn't have a dedicated portfolio route; reuse products and return summary
  const json = await fetchCustomerProducts(customerId);
  const summary = json?.data?.summary || {};
  return { success: true, data: summary };
}

export async function fetchConsultationHistory(customerId) {
  // Align with ConsultationController mapping
  const res = await fetch(
    getApiUrl(`/api/consultation/customers/${customerId}/sessions`)
  );
  if (!res.ok) throw new Error(`consultations ${res.status}`);
  return res.json();
}
