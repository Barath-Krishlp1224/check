import React from "react";
import { InputFieldProps, SelectFieldProps } from "./types";

export const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type,
  placeholder,
  value,
  onChange,
  error,
  touched,
  getInputClass,
}) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      {label}
    </label>
    <input
      type={type}
      name={String(name)}
      placeholder={placeholder}
      value={value || ""}
      onChange={onChange}
      className={getInputClass(name)}
    />
    {touched && error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  options,
  value,
  onChange,
  error,
  touched,
  getInputClass,
  disabled,
}) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      {label}
    </label>
    <select
      name={String(name)}
      value={value || ""}
      onChange={onChange}
      className={getInputClass(name)}
      disabled={disabled}
    >
      <option value="">Select {label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
    {touched && error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);