import pandas as pd
import numpy as np
import re

from pandas.api.types import CategoricalDtype

_PLACEHOLDERS = {
    "Text": "",
    "Integer": 0,
    "Float": 0.0,
    "Boolean": False,
    "Date": "",
    "Category": "",
    "Complex Number": 0j,
    "Unknown": "",
}

_BOOL_TRUE = {"true", "yes", "1", "y", "t"}
_BOOL_FALSE = {"false", "no", "0", "n", "f"}

def map_data_types(pandas_dtype):
    """Map a pandas dtype to a more user-friendly type name."""
    mapping = {
        "object": "Text",
        "int64": "Integer",
        "Int64": "Integer",
        "float64": "Float",
        "bool": "Boolean",
        "datetime64[ns]": "Date",
        "category": "Category",
        "complex": "Complex Number",
    }
    return mapping.get(str(pandas_dtype), "Unknown")

def reverse_map_data_types():
    """Reverse the mapping from user-friendly type names to pandas dtypes."""
    mapping = {
        "object": "Text",
        "int64": "Integer",
        "Int64": "Integer",
        "float64": "Float",
        "bool": "Boolean",
        "datetime64[ns]": "Date",
        "category": "Category",
        "complex": "Complex Number",
    }
    return {v: k for k, v in mapping.items()}

def _convert_single_value(val, target_type):
    """Safely cast a single cell value to *target_type* following the business rules."""
    if pd.isna(val) or val is None:
        return _PLACEHOLDERS.get(target_type, "")

    try:
        if target_type == "Integer":
            if isinstance(val, str):
                val = float(val.strip()) if re.match(r"^-?\d+(?:\.\d+)?$", val.strip()) else 0.0
            return int(round(float(val)))

        if target_type == "Float":
            if isinstance(val, str):
                val = float(val.strip()) if re.match(r"^-?\d+(?:\.\d+)?$", val.strip()) else 0.0
            return float(val)

        if target_type == "Boolean":
            if isinstance(val, (int, float)):
                return bool(val)
            if isinstance(val, str):
                v = val.strip().lower()
                if v in _BOOL_TRUE:
                    return True
                if v in _BOOL_FALSE:
                    return False
            return True

        if target_type == "Date":
            ts = pd.to_datetime(val, errors="coerce")
            if pd.isna(ts):
                return _PLACEHOLDERS["Date"]
            return ts.isoformat()

        if target_type in ("Text", "Category"):
            return str(val)

        return val
    except Exception:
        return _PLACEHOLDERS.get(target_type, "")

def convert_preview_rows(rows, column_type_map):
    """Return a *new* list of dict rows with each value converted per *column_type_map*."""
    out = []
    for row in rows:
        new_row = {
            col: _convert_single_value(val, column_type_map.get(col, "Unknown"))
            for col, val in row.items()
        }
        out.append(new_row)
    return out

def convert_dataframe(df, column_type_map):
    """Return a *new* DataFrame fully converted per column_type_map (no mutation)."""
    df_conv = pd.DataFrame()
    for col in df.columns:
        tgt = column_type_map.get(col, "Unknown")
        df_conv[col] = df[col].apply(_convert_single_value, args=(tgt,))
    return df_conv

def infer_and_convert_data_types(df):
    """Infer & *convert* dtypes on a DataFrame copy, returning the copy."""
    df = df.copy()
    for col in df.columns:
        series = df[col]

        if series.isna().all():
            df[col] = series.astype("object")
            continue

        if pd.api.types.is_numeric_dtype(series) or \
           pd.api.types.is_datetime64_any_dtype(series) or \
           pd.api.types.is_bool_dtype(series) or \
           isinstance(series.dtype, CategoricalDtype):
            continue

        lowered = series.dropna().astype(str).str.lower().str.replace(r"[^a-z0-9]", "", regex=True)
        if set(lowered.unique()).issubset(_BOOL_TRUE.union(_BOOL_FALSE)):
            df[col] = lowered.map(lambda x: x in _BOOL_TRUE)
            continue

        sample = series.dropna().astype(str)
        date_like = sample.str.contains(r"\d{4}|\d{1,2}[/-]\d{1,2}", regex=True).mean()
        if date_like > 0.4:
            parsed = pd.to_datetime(series, errors="coerce")
            if parsed.notna().sum() > 0:
                df[col] = parsed
                continue

        if not sample.str.contains(r"[a-zA-Z]", regex=True).any():
            numeric = pd.to_numeric(series, errors="coerce")
            if numeric.notna().sum() > 0:
                if np.all(np.floor(numeric.dropna()) == numeric.dropna()):
                    df[col] = numeric.astype("Int64")
                else:
                    df[col] = numeric
                continue

        cleaned = series.dropna().astype(str).str.strip()
        if len(series) > 0 and (cleaned.nunique() / len(series)) <= 0.5:
            df[col] = series.astype("category")
            continue

    return df