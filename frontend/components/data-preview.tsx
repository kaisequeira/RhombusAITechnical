"use client";

import type React from "react";
import type { FileData } from "@/app/page";

import { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Download, RotateCcw, Save, ShieldAlert, Upload } from "lucide-react";
import { Badge } from "@heroui/badge";
import { Alert } from "@heroui/alert";

interface DataPreviewProps {
  data: FileData;
  onReset: () => void;
  onChangeOverrides: (
    fileId: string,
    overrides: Record<string, string>,
    type: "preview" | "apply",
  ) => void;
  onDownload: () => void;
  overrides: Record<string, string>;
  setOverrides: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

/**
 * DataPreview
 * Component that displays a preview of the uploaded data file.
 * It allows users to change data types, reset overrides, and download the file.
 * @param data - The file data to be previewed.
 * @param onReset - Callback function to reset/clear the file.
 * @param onChangeOverrides - Callback function to handle changes in data type overrides.
 * @param onDownload - Callback function to handle file download.
 * @param overrides - The current data type overrides.
 * @param setOverrides - Function to update the data type overrides.
 * @returns {JSX.Element} - The rendered data preview component.
 */
export function DataPreview({
  data,
  onReset,
  onChangeOverrides,
  onDownload,
  overrides,
  setOverrides,
}: DataPreviewProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const dataTypes = [
    { value: "Text", label: "Text" },
    { value: "Integer", label: "Integer" },
    { value: "Float", label: "Float" },
    { value: "Boolean", label: "Boolean" },
    { value: "Date", label: "Date" },
    { value: "Category", label: "Category" },
  ];

  /**
   * resetOverrides
   * Resets the data type overrides to their original types.
   * @returns {void}
   */
  const resetOverrides = () => {
    const initialOverrides = data.result.columns.reduce(
      (acc, column, index) => {
        acc[column] = data.result.types[index];

        return acc;
      },
      {} as Record<string, string>,
    );

    setOverrides(initialOverrides);
    onChangeOverrides(data.id, initialOverrides, "preview");
  };

  /**
   * handleTypeChange
   * Handles the change in data type for a specific column.
   * It updates the overrides state and calls the onChangeOverrides callback to view a preview.
   * @param column
   * @param newType
   * @returns {void}
   */
  const handleTypeChange = (column: string, newType: string) => {
    const originalType = data.result.types[data.result.columns.indexOf(column)];

    setOverrides((prevOverrides) => {
      const updatedOverrides = {
        ...prevOverrides,
        [column]: newType === "" ? originalType : newType,
      };

      onChangeOverrides(data.id, updatedOverrides, "preview");

      return updatedOverrides;
    });
  };

  /**
   * handleApplyOverrides
   * Applies the changed data type overrides to the file.
   * It updates the overrides state and calls the onChangeOverrides callback to apply changes.
   * @returns {void}
   */
  const handleApplyOverrides = async () => {
    const changedOverrides = Object.entries(overrides).reduce(
      (acc, [column, newType]) => {
        const originalType =
          data.result.types[data.result.columns.indexOf(column)];

        if (newType !== originalType) {
          acc[column] = newType;
        }

        return acc;
      },
      {} as Record<string, string>,
    );

    if (Object.keys(changedOverrides).length === 0) return;

    setIsSaving(true);

    try {
      await onChangeOverrides(data.id, changedOverrides, "apply");
      setOverrides((prevOverrides) => {
        return Object.entries(prevOverrides).reduce(
          (acc, [column, newType]) => {
            const originalType =
              data.result.types[data.result.columns.indexOf(column)];

            acc[column] = newType !== originalType ? newType : originalType;

            return acc;
          },
          {} as Record<string, string>,
        );
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * handleDownload
   * Handles the download of the file.
   * It sets the downloading state to true, calls the onDownload callback, and resets the state after a delay.
   * @returns {void}
   */
  const handleDownload = async () => {
    setIsDownloading(true);
    await onDownload();
    setTimeout(() => setIsDownloading(false), 1000);
  };

  /**
   * hasChangedOverrides
   * Checks if there are any changes in the data type overrides compared to the original types.
   * @returns {boolean} - True if there are changes, false otherwise.
   */
  const hasChangedOverrides = Object.entries(overrides).some(
    ([column, newType]: [string, string]) => {
      const originalType =
        data.result.types[data.result.columns.indexOf(column)];

      return newType !== originalType;
    },
  );

  return (
    <div className="flex flex-col h-full w-full gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold ">
          Data Preview:{" "}
          <span className="tracking-tight inline font-bold from-[#0FB7CB] to-[#4986f8] bg-clip-text text-transparent bg-gradient-to-b">
            {data.file_name}
          </span>
        </h2>
        <div className="flex gap-2">
          {hasChangedOverrides && (
            <>
              <Button
                color="danger"
                startContent={<RotateCcw size={18} />}
                variant="flat"
                onClick={resetOverrides}
              >
                Reset
              </Button>
              <Button
                color="secondary"
                isLoading={isSaving}
                startContent={<Save size={18} />}
                variant="flat"
                onClick={handleApplyOverrides}
              >
                Apply Changes
              </Button>
            </>
          )}

          <Button
            color="primary"
            startContent={<Upload size={18} />}
            variant="flat"
            onClick={onReset}
          >
            Upload New
          </Button>

          {data.id && (
            <Button
              className="disabled:cursor-not-allowed"
              color="success"
              disabled={hasChangedOverrides}
              isLoading={isDownloading}
              startContent={<Download size={18} />}
              variant="flat"
              onClick={handleDownload}
            >
              Download
            </Button>
          )}
        </div>
      </div>

      <Table aria-label="Data preview table" className="w-full h-full">
        <TableHeader>
          {data.result.columns.map((column, index) => (
            <TableColumn key={column}>
              <div className="flex flex-row gap-3 items-center">
                <p className="font-medium">{column}</p>
                <Badge
                  isOneChar
                  color="secondary"
                  content={<ShieldAlert size={12} />}
                  isInvisible={overrides[column] === data.result.types[index]}
                  showOutline={false}
                >
                  <Select
                    aria-label={`Select data type for ${column}`}
                    className="min-w-[150px]"
                    selectedKeys={[
                      overrides[column] || data.result.types[index],
                    ]}
                    size="sm"
                    onChange={(e) => handleTypeChange(column, e.target.value)}
                  >
                    {dataTypes.map((type) => (
                      <SelectItem key={type.value} className="min-w-fit">
                        {type.label}
                      </SelectItem>
                    ))}
                  </Select>
                </Badge>
              </div>
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {data.result.preview.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {data.result.columns.map((column) => (
                <TableCell key={`${rowIndex}-${column}`}>
                  {row[column] !== null && String(row[column]) !== "" ? (
                    String(row[column])
                  ) : (
                    <span className="text-danger-400">Empty</span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {hasChangedOverrides && (
        <div className="w-full flex items-center my-3">
          <Alert
            color="secondary"
            icon={<ShieldAlert size={12} />}
            title={`Type overrides are marked. You may not download the file until you apply changes.`}
          />
        </div>
      )}
    </div>
  );
}
