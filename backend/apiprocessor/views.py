import json
import io
import pandas as pd
import numpy as np

from django.shortcuts import render
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser

from django.conf import settings
from .models import UploadedFile
from .utils import (
    infer_and_convert_data_types,
    map_data_types,
    convert_preview_rows,
    convert_dataframe,
)

class FileListView(APIView):
    """
    Handles listing all uploaded files along with their metadata and processing results.

    Methods:
    --------
    get(request, format=None):
        Retrieves a list of all uploaded files, including their ID, file name, upload timestamp, 
        processing status, and the latest result bundle.
    """

    def get(self, request, format=None):
        files_qs = UploadedFile.objects.all()
        payload = []
        for f in files_qs:
            payload.append(
                {
                    "id": f.id,
                    "file_name": f.file_name,
                    "uploaded_at": f.uploaded_at,
                    "processed": f.processed,
                    "result": f.result or {},
                }
            )
        return Response({"files": payload})

class FileUploadView(APIView):
    """
    Handles uploading of files (CSV or Excel), inferring data types, generating previews, 
    and saving metadata.

    Methods:
    --------
    post(request, format=None):
        Accepts a file upload, processes it to infer data types, generates a preview, 
        and stores the file metadata in the database.
    """
    parser_classes = [MultiPartParser]

    def post(self, request, format=None):
        file_obj = request.FILES["file"]

        if file_obj.name.endswith(".csv"):
            raw_df = pd.read_csv(file_obj)
        elif file_obj.name.endswith((".xls", ".xlsx")):
            raw_df = pd.read_excel(file_obj)
        else:
            return Response({"error": "Unsupported file format"}, status=400)

        typed_df = infer_and_convert_data_types(raw_df.copy())
        types = [map_data_types(dtype) for dtype in typed_df.dtypes]
        column_type_map = dict(zip(raw_df.columns, types))

        preview_raw = (
            raw_df.head(10)
            .replace([np.inf, -np.inf, np.nan], None)
            .to_dict(orient="records")
        )
        preview_converted = convert_preview_rows(preview_raw, column_type_map)

        result = {
            "columns": list(raw_df.columns),
            "types": types,
            "preview_raw": preview_raw,
            "preview": preview_converted,
        }

        uploaded_file = UploadedFile(
            file_path=file_obj,
            file_name=file_obj.name,
            processed=True,
            result=result,
            overrides={},
        )
        uploaded_file.save()

        return Response(
            {
                "id": uploaded_file.id,
                "file_name": uploaded_file.file_name,
                "result": result,
            }
        )

class OverrideDataTypesView(APIView):
    """
    Allows overriding inferred data types for specific columns and optionally applies the changes.

    Methods:
    --------
    post(request, file_id, format=None):
        Accepts overrides for column data types, generates a preview with the new types, 
        and optionally applies the changes to the file metadata.
    """
    def post(self, request, file_id, format=None):
        try:
            uploaded_file = UploadedFile.objects.get(id=file_id)
        except UploadedFile.DoesNotExist:
            return Response({"error": "File not found"}, status=404)

        overrides = request.data.get("overrides", {})
        apply = str(request.data.get("apply", "true")).lower() != "false"

        if not isinstance(overrides, dict):
            return Response({"error": "Invalid overrides format"}, status=400)

        result = uploaded_file.result or {}
        columns = result.get("columns", [])
        current_types = result.get("types", [])
        type_map = dict(zip(columns, current_types))

        for col, new_t in overrides.items():
            if col not in type_map:
                return Response({"error": f"Unknown column '{col}'"}, status=400)
            type_map[col] = new_t

        preview_converted = convert_preview_rows(result["preview_raw"], type_map)

        payload = {
            "columns": columns,
            "types": [type_map[c] for c in columns],
            "preview": preview_converted,
        }

        if apply:
            result.update(payload)
            uploaded_file.result = result
            uploaded_file.overrides = overrides
            uploaded_file.save()
            payload["message"] = "Overrides applied successfully."
        else:
            payload["message"] = "Preview generated – overrides not applied."

        return Response(payload)

class DownloadFileView(APIView):
    """
    Handles downloading of the processed version of an uploaded file with applied data type conversions.

    Methods:
    --------
    get(request, file_id, format=None):
        Retrieves the processed file, applies the data type conversions, and returns it as a downloadable CSV.
    """
    def get(self, request, file_id, format=None):
        try:
            uploaded_file = UploadedFile.objects.get(id=file_id)
        except UploadedFile.DoesNotExist:
            return Response({"error": "File not found"}, status=404)

        # Load the ORIGINAL dataset from storage
        file_field = uploaded_file.file_path
        if uploaded_file.file_name.endswith(".csv"):
            raw_df = pd.read_csv(file_field.path)
        elif uploaded_file.file_name.endswith((".xls", ".xlsx")):
            raw_df = pd.read_excel(file_field.path)
        else:
            return Response({"error": "Unsupported file format"}, status=400)

        # Load the type metadata from the database
        result = uploaded_file.result or {}
        columns = result.get("columns", [])
        types = result.get("types", [])
        if not columns or not types:
            return Response({"error": "Type metadata missing"}, status=500)
        column_type_map = dict(zip(columns, types))

        # Convert the entire DataFrame *now*
        full_converted_df = convert_dataframe(raw_df, column_type_map)

        buffer = io.StringIO()
        full_converted_df.to_csv(buffer, index=False)
        buffer.seek(0)

        response = HttpResponse(buffer, content_type="text/csv")
        filename_base = uploaded_file.file_name.rsplit(".", 1)[0]
        response["Content-Disposition"] = (
            f'attachment; filename="{filename_base}_converted.csv"'
        )
        return response

class DeleteFileView(APIView):
    """
    Handles deletion of an uploaded file and its associated metadata.

    Methods:
    --------
    delete(request, file_id, format=None):
        Deletes the specified file and its metadata from the database.
    """
    def delete(self, request, file_id, format=None):
        try:
            uploaded_file = UploadedFile.objects.get(id=file_id)
            uploaded_file.delete()
            return Response(
                {"message": f"File with ID {file_id} deleted successfully."}, status=200
            )
        except UploadedFile.DoesNotExist:
            return Response(
                {"error": f"File with ID {file_id} not found."}, status=404
            )