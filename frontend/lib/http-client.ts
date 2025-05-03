import { addToast } from "@heroui/toast";

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  isFormData?: boolean;
  showErrorToast?: boolean;
}

/**
 * httpRequest
 * A generic HTTP request function that handles GET, POST, PUT, DELETE requests.
 * It supports JSON and FormData requests, and can show error toasts.
 * @param url - The URL to send the request to.
 * @param options - The options for the request, including method, headers, body, and error handling.
 * @returns {Promise<T>} - A promise that resolves to the response data.
 */
export async function httpRequest<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    headers = {},
    body,
    isFormData = false,
    showErrorToast = true,
  } = options;
  const requestHeaders: Record<string, string> = { ...headers };

  if (!isFormData && body && typeof body !== "string") {
    requestHeaders["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error occurred" }));

      throw new Error(
        errorData.error || `Request failed with status ${response.status}`,
      );
    }

    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      return await response.json();
    } else if (contentType?.includes("text/")) {
      const text = await response.text();

      return text as unknown as T;
    }

    return response as unknown as T;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    if (showErrorToast) {
      addToast({
        title: "Error",
        description: errorMessage,
        color: "danger",
      });
    }

    throw error;
  }
}

/**
 * http
 * A collection of HTTP methods (GET, POST, PUT, DELETE) for making requests.
 * Each method can be customized with options like headers, body, and error handling.
 * @param url - The URL to send the request to.
 * @param options - The options for the request, including method, headers, body, and error handling.
 * @returns {Promise<T>} - A promise that resolves to the response data.
 */
export const http = {
  get: <T>(url: string, options?: Omit<RequestOptions, "method" | "body">) =>
    httpRequest<T>(url, { ...options, method: "GET" }),

  post: <T>(
    url: string,
    body?: any,
    options?: Omit<RequestOptions, "method">,
  ) => httpRequest<T>(url, { ...options, method: "POST", body }),

  put: <T>(url: string, body?: any, options?: Omit<RequestOptions, "method">) =>
    httpRequest<T>(url, { ...options, method: "PUT", body }),

  delete: <T>(url: string, options?: Omit<RequestOptions, "method">) =>
    httpRequest<T>(url, { ...options, method: "DELETE" }),

  postFormData: <T>(
    url: string,
    formData: FormData,
    options?: Omit<RequestOptions, "method" | "body" | "isFormData">,
  ) =>
    httpRequest<T>(url, {
      ...options,
      method: "POST",
      body: formData,
      isFormData: true,
    }),
};
