import { apiRequest } from "./queryClient";

export { apiRequest };

// Tax query API functions
export const submitTaxQuery = async (query: string) => {
  const response = await apiRequest("POST", "/api/taxentia/query", { query });
  return response.json();
};

export const getQueryHistory = async () => {
  const response = await apiRequest("GET", "/api/queries");
  return response.json();
};

export const getQuery = async (id: string) => {
  const response = await apiRequest("GET", `/api/queries/${id}`);
  return response.json();
};
