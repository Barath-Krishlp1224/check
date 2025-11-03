"use client";

import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";

// --- Hierarchical Data Structure Type ---
type DepartmentMap = string[];
type SubCategoryMap = { [key: string]: DepartmentMap };
type CategoryMap = { [key: string]: DepartmentMap | SubCategoryMap };
type Structure = { [team: string]: CategoryMap };

// --- Formik Values Interface ---
interface IFormValues {
  empId: string;
  name: string;
  fatherName: string;
  dateOfBirth: string;
  joiningDate: string;
  team: keyof Structure | "";
  category: string;
  subCategory: string;
  department: string;
  photo: File | null;
  phoneNumber: string;
  mailId: string;
  accountNumber: string;
  ifscCode: string;
}

// --- Base Field Props ---
interface BaseFieldProps {
  label: string;
  name: keyof IFormValues;
  value: string;
  error?: string;
  touched?: boolean;
  getInputClass: (field: keyof IFormValues) => string;
}

interface InputFieldProps extends BaseFieldProps {
  type: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface SelectFieldProps extends BaseFieldProps {
  options: string[];
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

// --- Reusable Input Component ---
const InputField: React.FC<InputFieldProps> = ({
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
      {label} *
    </label>
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value || ""}
      onChange={onChange}
      className={getInputClass(name)}
    />
    {touched && error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

// --- Reusable Select Component ---
const SelectField: React.FC<SelectFieldProps> = ({
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
      {label} *
    </label>
    <select
      name={name}
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

// --- Main Component ---
const AddEmployeePage: React.FC = () => {
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);

  // --- Hierarchical Data Structure (UPDATED) ---
  const structure: Structure = {
    Tech: {
      Developer: {
        Frontend: ["Junior Frontend Developer", "Senior Frontend Developer"],
        Backend: ["Junior Backend Developer", "Senior Backend Developer"],
        "Full Stack": [
          "Junior Full Stack Developer",
          "Senior Full Stack Developer",
        ],
        "UI/UX Developer": ["UI/UX Developer"],
      },
      // ✅ NEW: IT Admin category with Department array
      "IT Admin": ["IT Administrator"],
      // ⚠️ UPDATED: DevOps list (removed IT Administrator)
      DevOps: ["Product Manager"], 
      Tester: ["QA Engineer – Manual & Automation"],
      Designer: ["UI/UX Designer"],
      "Team Leads": ["Project Manager"],
    },
    Accounts: {
      Accountant: ["Accountant", "Senior Accountant"],
    },
    "Admin & Operations": {
      "Admin & Operations": ["Admin & Operations"],
    },
    HR: {
      HR: ["HR Executive", "HR Manager"],
    },
  };

  // --- Validation Schema ---
  const validationSchema = Yup.object({
    empId: Yup.string()
      .matches(
        /^[A-Z0-9]+$/,
        "Employee ID must contain only uppercase letters and numbers"
      )
      .required("Employee ID is required"),
    name: Yup.string()
      .matches(/^[A-Z][a-zA-Z\s]*$/, "Name must start with a capital letter")
      .required("Name is required"),
    fatherName: Yup.string()
      .matches(
        /^[A-Z][a-zA-Z\s]*$/,
        "Father's name must start with a capital letter"
      )
      .required("Father's name is required"),
    dateOfBirth: Yup.string().required("Date of birth is required"),
    joiningDate: Yup.string().required("Joining date is required"),
    team: Yup.string().required("Team is required"),
    category: Yup.string().required("Category is required"),
    subCategory: Yup.string().required("Sub-category is required"),
    department: Yup.string().required("Department is required"),
    phoneNumber: Yup.string()
      .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
      .required("Phone number is required"),
    mailId: Yup.string().email("Invalid email").required("Email is required"),
    accountNumber: Yup.string()
      .matches(/^[0-9]{9,18}$/, "Account number must be between 9-18 digits")
      .required("Account number is required"),
    ifscCode: Yup.string()
      .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code (e.g., SBIN0001234)")
      .required("IFSC code is required"),
    photo: Yup.mixed<File>()
      .nullable()
      .test("fileFormat", "Only PNG, JPEG, JPG allowed", (value) => {
        if (!value) return true;
        return ["image/png", "image/jpeg", "image/jpg"].includes(value.type);
      }),
  });

  // --- Formik Setup ---
  const formik = useFormik<IFormValues>({
    initialValues: {
      empId: "",
      name: "",
      fatherName: "",
      dateOfBirth: "",
      joiningDate: "",
      team: "",
      category: "",
      subCategory: "",
      department: "",
      photo: null,
      phoneNumber: "",
      mailId: "",
      accountNumber: "",
      ifscCode: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      const data = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          if (key === "photo" && value instanceof File) {
            data.append(key, value);
          } else {
            data.append(key, value.toString());
          }
        }
      });

      try {
        // NOTE: This API endpoint is assumed. Ensure your backend route is correct.
        const res = await fetch("/api/employees/add", {
          method: "POST",
          body: data,
        });
        const result = await res.json();

        if (result.success) {
          alert("✅ Employee Added Successfully!");
          formik.resetForm();
          setCategoryOptions([]);
          setSubCategoryOptions([]);
          setDepartmentOptions([]);
        } else {
          alert(`❌ ${result.message}`);
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        alert("Network or server error. Please try again.");
      }
    },
  });

  // --- Cascading Dropdown Logic (Handles Team selection) ---
  useEffect(() => {
    const { team } = formik.values;
    formik.setFieldValue("category", "");
    formik.setFieldValue("subCategory", "");
    formik.setFieldValue("department", "");

    if (team && structure[team]) {
      setCategoryOptions(Object.keys(structure[team]));
    } else {
      setCategoryOptions([]);
    }
    setSubCategoryOptions([]);
    setDepartmentOptions([]);
  }, [formik.values.team]);

  // --- Cascading Dropdown Logic (Handles Category selection) ---
  useEffect(() => {
    const { team, category } = formik.values;
    formik.setFieldValue("subCategory", "");
    formik.setFieldValue("department", "");

    if (team && category && structure[team]) {
      const teamData = structure[team];
      const categoryData = teamData[category];

      // Handle sub-categories (currently only Tech -> Developer)
      if (team === "Tech" && category === "Developer") {
        setSubCategoryOptions(Object.keys(categoryData as SubCategoryMap));
      } else {
        setSubCategoryOptions([]);
        // Set a non-empty value for validation when subCategory is not applicable
        formik.setFieldValue("subCategory", "N/A"); 

        // For categories without sub-categories (e.g., IT Admin, DevOps, Accounts)
        if (Array.isArray(categoryData)) {
          setDepartmentOptions(categoryData);
        } else {
          setDepartmentOptions([]);
        }
      }
    } else {
      setSubCategoryOptions([]);
      setDepartmentOptions([]);
    }
  }, [formik.values.category, formik.values.team]);

  // --- Cascading Dropdown Logic (Handles Sub-Category selection) ---
  useEffect(() => {
    const { team, category, subCategory } = formik.values;
    formik.setFieldValue("department", "");

    // Only runs for the nested structure (Tech -> Developer -> SubCategory)
    if (team === "Tech" && category === "Developer" && subCategory) {
      const teamData = structure[team];
      const categoryData = teamData[category] as SubCategoryMap;
      setDepartmentOptions(categoryData[subCategory] || []);
    }
  }, [formik.values.subCategory]);

  // --- Input Styles ---
  const inputBaseClass =
    "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900";
  const getInputClass = (field: keyof IFormValues) =>
    `${inputBaseClass} ${
      formik.touched[field] && formik.errors[field]
        ? "border-red-500"
        : "border-gray-300"
    }`;

  // --- UI ---
  return (
    <div className="min-h-screen py-12 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
            <h2 className="text-3xl font-bold">Add New Employee</h2>
            <p className="text-sm opacity-90">
              Fill in the details to register a new employee
            </p>
          </div>

          <form
            className="p-8"
            onSubmit={formik.handleSubmit}
            encType="multipart/form-data"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <InputField
                label="Employee ID"
                name="empId"
                type="text"
                placeholder="e.g., LP012"
                value={formik.values.empId}
                onChange={(e) =>
                  formik.setFieldValue("empId", e.target.value.toUpperCase())
                }
                error={formik.errors.empId}
                touched={formik.touched.empId}
                getInputClass={getInputClass}
              />

              <InputField
                label="Full Name"
                name="name"
                type="text"
                placeholder="e.g., John Doe"
                value={formik.values.name}
                onChange={formik.handleChange}
                error={formik.errors.name}
                touched={formik.touched.name}
                getInputClass={getInputClass}
              />

              <InputField
                label="Father's Name"
                name="fatherName"
                type="text"
                placeholder="e.g., Michael Doe"
                value={formik.values.fatherName}
                onChange={formik.handleChange}
                error={formik.errors.fatherName}
                touched={formik.touched.fatherName}
                getInputClass={getInputClass}
              />

              <InputField
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formik.values.dateOfBirth}
                onChange={formik.handleChange}
                error={formik.errors.dateOfBirth}
                touched={formik.touched.dateOfBirth}
                getInputClass={getInputClass}
              />

              <InputField
                label="Joining Date"
                name="joiningDate"
                type="date"
                value={formik.values.joiningDate}
                onChange={formik.handleChange}
                error={formik.errors.joiningDate}
                touched={formik.touched.joiningDate}
                getInputClass={getInputClass}
              />

              {/* Dropdowns */}
              <SelectField
                label="Team"
                name="team"
                options={Object.keys(structure)}
                value={formik.values.team as string}
                onChange={formik.handleChange}
                error={formik.errors.team}
                touched={formik.touched.team}
                getInputClass={getInputClass}
              />

              {categoryOptions.length > 0 && (
                <SelectField
                  label="Category"
                  name="category"
                  options={categoryOptions}
                  value={formik.values.category}
                  onChange={formik.handleChange}
                  error={formik.errors.category}
                  touched={formik.touched.category}
                  getInputClass={getInputClass}
                />
              )}

              {/* Show SubCategory only for Tech → Developer */}
              {formik.values.team === "Tech" &&
                formik.values.category === "Developer" &&
                subCategoryOptions.length > 0 && (
                  <SelectField
                    label="Sub-Category"
                    name="subCategory"
                    options={subCategoryOptions}
                    value={formik.values.subCategory}
                    onChange={formik.handleChange}
                    error={formik.errors.subCategory}
                    touched={formik.touched.subCategory}
                    getInputClass={getInputClass}
                  />
                )}

              {departmentOptions.length > 0 && (
                <SelectField
                  label="Department"
                  name="department"
                  options={departmentOptions}
                  value={formik.values.department}
                  onChange={formik.handleChange}
                  error={formik.errors.department}
                  touched={formik.touched.department}
                  getInputClass={getInputClass}
                />
              )}

              {/* Contact Info */}
              <InputField
                label="Phone Number"
                name="phoneNumber"
                type="tel"
                placeholder="9876543210"
                value={formik.values.phoneNumber}
                onChange={formik.handleChange}
                error={formik.errors.phoneNumber}
                touched={formik.touched.phoneNumber}
                getInputClass={getInputClass}
              />

              <InputField
                label="Email"
                name="mailId"
                type="email"
                placeholder="john.doe@example.com"
                value={formik.values.mailId}
                onChange={formik.handleChange}
                error={formik.errors.mailId}
                touched={formik.touched.mailId}
                getInputClass={getInputClass}
              />

              <InputField
                label="Account Number"
                name="accountNumber"
                type="text"
                placeholder="123456789012"
                value={formik.values.accountNumber}
                onChange={formik.handleChange}
                error={formik.errors.accountNumber}
                touched={formik.touched.accountNumber}
                getInputClass={getInputClass}
              />

              <InputField
                label="IFSC Code"
                name="ifscCode"
                type="text"
                placeholder="SBIN0001234"
                value={formik.values.ifscCode}
                onChange={(e) =>
                  formik.setFieldValue("ifscCode", e.target.value.toUpperCase())
                }
                error={formik.errors.ifscCode}
                touched={formik.touched.ifscCode}
                getInputClass={getInputClass}
              />

              {/* Photo Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Employee Photo
                </label>
                <input
                  type="file"
                  name="photo"
                  accept=".png,.jpg,.jpeg"
                  onChange={(e) =>
                    formik.setFieldValue("photo", e.currentTarget.files?.[0] || null)
                  }
                  className={getInputClass("photo")}
                />
                {formik.touched.photo && formik.errors.photo && (
                  <p className="mt-1 text-sm text-red-500">
                    {formik.errors.photo}
                  </p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex gap-4">
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg"
              >
                {formik.isSubmitting ? "Adding Employee..." : "Add Employee"}
              </button>
              <button
                type="button"
                onClick={() => {
                  formik.resetForm();
                  setCategoryOptions([]);
                  setSubCategoryOptions([]);
                  setDepartmentOptions([]);
                }}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg"
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeePage;