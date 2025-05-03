import pandas as pd
import pytest
import time

from ..utils import infer_and_convert_data_types
from pandas.api.types import CategoricalDtype

# ---------- Test 1: Boolean Inference ----------
def test_boolean_column(tmp_path):
    file = tmp_path / "test_data_bool.csv"
    file.write_text("flag\nTrue\nFalse\ntrue\nfalse\nYes\nNo\n1\n0")

    df = pd.read_csv(file)
    df = infer_and_convert_data_types(df)

    assert pd.api.types.is_bool_dtype(df["flag"]), f"Expected bool, got {df['flag'].dtype}"

# ---------- Test 2: Integer and Float Inference ----------
def test_numeric_column(tmp_path):
    file = tmp_path / "test_data_numbers.csv"
    file.write_text("id,score\n1,98.5\n2,87.2\n3,76.0\n4,NaN\n5,64")

    df = pd.read_csv(file)
    df = infer_and_convert_data_types(df)

    assert pd.api.types.is_integer_dtype(df["id"]) or str(df["id"].dtype) == "Int64"
    assert pd.api.types.is_float_dtype(df["score"])

# ---------- Test 3: Datetime Parsing ----------
def test_datetime_column(tmp_path):
    file = tmp_path / "test_data_dates.csv"
    file.write_text('timestamp\n2023-01-01\n01/02/2024\n"March 3, 2022"\nNaN')

    df = pd.read_csv(file)
    df = infer_and_convert_data_types(df)

    assert pd.api.types.is_datetime64_any_dtype(df["timestamp"])

# ---------- Test 4: Categorical Detection ----------
def test_categorical_column(tmp_path):
    file = tmp_path / "test_data_category.csv"
    file.write_text("color\nred\nblue\nred\ngreen\nblue\nred\n")

    df = pd.read_csv(file)
    df = infer_and_convert_data_types(df)

    assert isinstance(df["color"].dtype, CategoricalDtype)

# ---------- Test 5: Mixed Column Remains Object ----------
def test_mixed_column(tmp_path):
    file = tmp_path / "test_data_mixed.csv"
    file.write_text("info\nhello\n123\n2023-01-01\nTrue\n$50")

    df = pd.read_csv(file)
    df = infer_and_convert_data_types(df)

    assert df["info"].dtype == "object"

# # ---------- Test 6: Large File Performance ----------
def test_large_file_inference(tmp_path):
    df = pd.DataFrame({
        "num": range(10**6),
        "bool_str": ["True"] * (10**6),
        "date": ["2022-01-01"] * (10**6)
    })

    file_path = tmp_path / "test_large.csv"
    df.to_csv(file_path, index=False)

    df_loaded = pd.read_csv(file_path)

    start = time.time()
    df_converted = infer_and_convert_data_types(df_loaded)
    end = time.time()

    assert pd.api.types.is_bool_dtype(df_converted["bool_str"])
    assert pd.api.types.is_datetime64_any_dtype(df_converted["date"])
    assert (end - start) < 5, f"Inference took too long: {end - start} seconds"

# ---------- Test 7: Empty DataFrame ----------
def test_empty_dataframe():
    df = pd.DataFrame()
    df = infer_and_convert_data_types(df)

    assert df.empty, "Expected the DataFrame to remain empty"

# ---------- Test 8: All NaN Column ----------
def test_all_nan_column():
    df = pd.DataFrame({"col": [float('nan'), float('nan'), float('nan')]})
    df = infer_and_convert_data_types(df)

    assert df["col"].dtype == "object", f"Expected object dtype, got {df['col'].dtype}"

# ---------- Test 9: Mixed Numeric and String Column ----------
def test_mixed_numeric_string_column():
    df = pd.DataFrame({"col": ["123", "abc", "456", "NaN"]})
    df = infer_and_convert_data_types(df)

    assert df["col"].dtype == "object", f"Expected object dtype, got {df['col'].dtype}"

# ---------- Test 10: Single Value Column ----------
def test_single_value_column():
    df = pd.DataFrame({"col": ["only_value"] * 10})
    df = infer_and_convert_data_types(df)

    assert isinstance(df["col"].dtype, CategoricalDtype), \
        f"Expected categorical dtype, got {df['col'].dtype}"

# ---------- Test 11: Column with Special Characters ----------
def test_special_characters_column():
    df = pd.DataFrame({"col": ["@#$%", "!&*", "NaN", "123"]})
    df = infer_and_convert_data_types(df)

    assert df["col"].dtype == "object", f"Expected object dtype, got {df['col'].dtype}"

# ---------- Test 12: Boolean-Like Strings with Noise ----------
def test_boolean_like_strings_with_noise():
    df = pd.DataFrame({"col": ["True!", "false?", "YES", "no", "1", "0"]})
    df = infer_and_convert_data_types(df)

    assert pd.api.types.is_bool_dtype(df["col"]), f"Expected bool dtype, got {df['col'].dtype}"

# ---------- Test 13: Large Unique Text Column ----------
def test_large_unique_text_column():
    df = pd.DataFrame({"col": [f"text_{i}" for i in range(1000)]})
    df = infer_and_convert_data_types(df)

    assert df["col"].dtype == "object", f"Expected object dtype, got {df['col'].dtype}"