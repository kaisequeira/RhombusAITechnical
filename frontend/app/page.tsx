"use client";

import { useState, useCallback, useEffect } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import Image from "next/image";

import { FileUploader } from "@/components/file-uploader";
import { DataPreview } from "@/components/data-preview";
import { FileHistory } from "@/components/file-history";
import { API_ENDPOINTS } from "@/lib/constants";
import { http } from "@/lib/http-client";

interface Result {
  columns: string[];
  types: string[];
  preview: Record<string, any>[];
  preview_raw: Record<string, any>[];
}

export interface FileData {
  id: string;
  file_name: string;
  result: Result;
  processed?: boolean;
  uploaded_at?: string;
}

interface OverrideResponse {
  columns: string[];
  types: string[];
  preview: Record<string, any>[];
  message?: string;
}

/**
 * Home
 * Main component that serves as the entry point for the application.
 * It manages the state and handles file upload, preview, and history.
 * It also provides functions to apply type overrides and download files.
 * @returns {JSX.Element} - The rendered home component.
 */
export default function Home() {
  const [activeTab, setActiveTab] = useState("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [files, setFiles] = useState<FileData[]>([]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [isFilesLoading, setIsFilesLoading] = useState(true);

  /**
   * handleFileUpload
   * Handles the file upload process.
   * It validates the file type, uploads the file, and updates the state accordingly.
   * @param file - The file to be uploaded.
   * @returns {Promise<void>} - A promise that resolves when the upload is complete.
   */
  const handleFileUpload = useCallback(async (file: File) => {
    if (
      !file.name.endsWith(".csv") &&
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls")
    ) {
      addToast({
        title: "Error",
        description: "Please upload a CSV or Excel file",
        color: "danger",
      });

      return;
    }

    setIsLoading(true);

    const formData = new FormData();

    formData.append("file", file);

    try {
      const data = await http.postFormData<FileData>(
        API_ENDPOINTS.UPLOAD,
        formData,
        {
          showErrorToast: false,
        },
      );

      setFileData(data);
      fetchFiles();
      addToast({
        title: "Success",
        description: "File uploaded successfully",
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: "Error occurred whilst uploading: " + error,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * fetchFiles
   * Fetches the list of uploaded files from the server.
   * It updates the state with the fetched files and handles loading state.
   * @returns {Promise<void>} - A promise that resolves when the fetch is complete.
   */
  const fetchFiles = useCallback(async () => {
    setIsFilesLoading(true);
    try {
      const data = await http.get<{ files: FileData[] }>(API_ENDPOINTS.FILES);

      setFiles(data.files || []);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setIsFilesLoading(false);
    }
  }, []);

  /**
   * handleChangeOverrides
   * Handles the type overrides for the file data.
   * It sends the overrides to the backend and updates the state accordingly.
   * @param fileId - The ID of the file to apply overrides to.
   * @param overrides - The overrides to be applied.
   * @param type - The type of operation ("preview" or "apply").
   * @returns {Promise<OverrideResponse | null>} - A promise that resolves to the response from the server.
   */
  const handleChangeOverrides = useCallback(
    async (
      fileId: string,
      overrides: Record<string, string>,
      type: "preview" | "apply",
    ) => {
      if (!fileId || Object.keys(overrides).length === 0) return null;

      try {
        const result = await http.post<OverrideResponse>(
          API_ENDPOINTS.OVERRIDE(fileId),
          { overrides, apply: type === "apply" },
        );

        if (fileData && result.preview)
          setFileData((prev) => {
            if (!prev) return prev;

            return {
              ...prev,
              result: {
                ...prev.result,
                preview: result.preview,
                types:
                  type === "preview"
                    ? prev.result.types
                    : result.types || prev.result.types,
              },
            };
          });

        if (type === "apply")
          addToast({
            title: "Success",
            description: "Type overrides applied successfully",
            color: "success",
          });

        fetchFiles();

        return result;
      } catch (error) {
        console.error(
          `Error ${type === "apply" ? "applying" : "previewing"} overrides:`,
          error,
        );

        if (type === "apply")
          addToast({
            title: "Error",
            description: "Failed to apply type overrides",
            color: "danger",
          });

        return null;
      }
    },
    [fileData],
  );

  /**
   * downloadFile
   * Initiates the download of a file by redirecting to the download URL.
   * @param fileId - The ID of the file to be downloaded.
   * @returns {Promise<void>} - A promise that resolves when the download is initiated.
   */
  const downloadFile = useCallback(async (fileId: string) => {
    if (!fileId) return;

    try {
      window.location.href = API_ENDPOINTS.DOWNLOAD(fileId);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  }, []);

  /**
   * deleteFile
   * Deletes a file from the server and updates the state accordingly.
   * @param fileId - The ID of the file to be deleted.
   * @returns {Promise<boolean>} - A promise that resolves to true if the deletion was successful, false otherwise.
   */
  const deleteFile = useCallback(async (fileId: string) => {
    try {
      await http.delete(API_ENDPOINTS.DELETE(fileId));
      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
      if (fileData && fileData.id === fileId) setFileData(null);

      return true;
    } catch (error) {
      console.error("Error deleting file:", error);

      return false;
    }
  }, []);

  /**
   * useEffect
   * Sets the initial overrides based on the file data when the component mounts or when the file data changes.
   */
  useEffect(() => {
    if (!fileData) return;

    const initialOverrides = fileData.result.columns.reduce(
      (acc, column, index) => {
        acc[column] = fileData.result.types[index];

        return acc;
      },
      {} as Record<string, string>,
    );

    setOverrides(initialOverrides);
  }, [fileData?.id]);

  /**
   * useEffect
   * Fetches the list of files when the component mounts.
   */
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return (
    <main className="flex flex-col justify-center items-center h-full w-full mx-auto py-4 px-4">
      <div className="leading-8 text-center p-10">
        <h1 className="tracking-tight inline font-bold text-6xl">
          Data Transformation -{" "}
        </h1>
        <div className="inline-block">
          <h1 className="tracking-tight inline font-bold from-[#0FB7CB] to-[#4986f8] text-6xl bg-clip-text text-transparent bg-gradient-to-b">
            Technical&nbsp;
          </h1>
        </div>
      </div>

      <Image
        alt="Pattern"
        className="absolute inset-0 w-full h-full object-cover opacity-50"
        src="/looper-pattern.svg"
      />

      <Card className="w-8/12 h-2/3 p-5 opacity-75 mb-16">
        <CardBody>
          <Tabs
            aria-label="Options"
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(String(key))}
          >
            <Tab key="upload" className="h-full p-3" title="Upload & Transform">
              <div className="py-4 h-full w-full">
                {!fileData && !isLoading && (
                  <FileUploader
                    onError={(message) => {
                      addToast({
                        title: "Error",
                        description: message,
                        color: "danger",
                      });
                      setIsLoading(false);
                    }}
                    onFileUpload={handleFileUpload}
                    onProcessed={setFileData}
                    onUploadStart={() => setIsLoading(true)}
                  />
                )}

                {isLoading && (
                  <div className="flex justify-center items-center py-12 h-full">
                    <Spinner label="Processing file..." size="lg" />
                  </div>
                )}

                {fileData && !isLoading && (
                  <DataPreview
                    data={fileData}
                    overrides={overrides}
                    setOverrides={setOverrides}
                    onChangeOverrides={handleChangeOverrides}
                    onDownload={() => downloadFile(fileData.id)}
                    onReset={() => setFileData(null)}
                  />
                )}
              </div>
            </Tab>
            <Tab key="history" className="h-full p-3" title="File History">
              <FileHistory
                files={files}
                isLoading={isFilesLoading}
                onDelete={deleteFile}
                onDownload={downloadFile}
                onFetchFiles={fetchFiles}
                onPreview={(file) => {
                  if (file.id !== fileData?.id) setFileData(file);
                  setActiveTab("upload");
                }}
              />
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </main>
  );
}
