"use client";

import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ChevronRight, Check } from "lucide-react";

type DepartmentMap = string[];
type SubCategoryMap = { [key: string]: DepartmentMap };
type CategoryMap = { [key: string]: DepartmentMap | SubCategoryMap };
type Structure = { [team: string]: CategoryMap };

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
  password?: string;
  confirmPassword?: string;

  // 🔹 NEW FIELDS
  employmentType: "Fresher" | "Experienced" | "";
  aadharNumber: string;
  panNumber: string;

  aadharFile: File | null;
  panFile: File | null;
  tenthMarksheet: File | null;
  twelfthMarksheet: File | null;
  provisionalCertificate: File | null;
  experienceCertificate: File | null;
}

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

// 🔧 Team → Category → SubCategory/Department structure
const structure: Structure = {
  Founders: {
    Founders: ["Founder", "Co-Founder"],
  },
  Manager: {
    Manager: ["Manager"],
  },
  "TL-Reporting Manager": {
    "TL-Reporting Manager": ["Team Lead", "Reporting Manager"],
  },
  HR: {
    HR: ["HR Executive", "HR Manager"],
  },
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
    DevOps: ["Product Manager"],
    Tester: ["QA Engineer – Manual & Automation"],
    Designer: ["UI/UX Designer"],
    "Team Leads": ["Project Manager"],
  },
  "IT Admin": {
    "IT Admin": ["IT Administrator"],
  },
  Accounts: {
    Accountant: ["Accountant", "Senior Accountant"],
  },
  "Admin & Operations": {
    "Admin & Operations": ["Admin & Operations"],
  },
};

const AddEmployeePage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);

  const steps = [
    {
      title: "Personal Info",
      fields: ["empId", "name", "fatherName", "dateOfBirth"],
    },
    {
      title: "Employment",
      fields: ["joiningDate", "team", "category", "subCategory", "department"],
    },
    { title: "Contact", fields: ["phoneNumber", "mailId"] },
    { title: "Banking", fields: ["accountNumber", "ifscCode"] },
    {
      title: "Security & Documents",
      fields: [
        "password",
        "confirmPassword",
        "employmentType",
        "aadharNumber",
        "panNumber",
        "photo",
        "aadharFile",
        "panFile",
        "tenthMarksheet",
        "twelfthMarksheet",
        "provisionalCertificate",
        "experienceCertificate",
      ],
    },
  ];

  const allowedDocTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
  ];

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

    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "Passwords must match")
      .required("Confirm Password is required"),

    employmentType: Yup.mixed<"Fresher" | "Experienced">()
      .oneOf(["Fresher", "Experienced"])
      .required("Employment type is required"),

    aadharNumber: Yup.string()
      .matches(/^[0-9]{12}$/, "Aadhar number must be 12 digits")
      .required("Aadhar number is required"),

    panNumber: Yup.string()
      .matches(
        /^[A-Z]{5}[0-9]{4}[A-Z]$/,
        "Invalid PAN format (e.g., ABCDE1234F)"
      )
      .required("PAN number is required"),

    photo: Yup.mixed<File>()
      .nullable()
      .test("fileFormat", "Only PNG, JPEG, JPG allowed", (value) => {
        if (!value) return true;
        return ["image/png", "image/jpeg", "image/jpg"].includes(value.type);
      }),

    aadharFile: Yup.mixed<File>()
      .nullable()
      .test("required", "Aadhar document is required", (value) => !!value)
      .test("fileFormat", "Only PDF / PNG / JPG allowed", (value) => {
        if (!value) return true;
        return allowedDocTypes.includes(value.type);
      }),

    panFile: Yup.mixed<File>()
      .nullable()
      .test("required", "PAN document is required", (value) => !!value)
      .test("fileFormat", "Only PDF / PNG / JPG allowed", (value) => {
        if (!value) return true;
        return allowedDocTypes.includes(value.type);
      }),

    tenthMarksheet: Yup.mixed<File>()
      .nullable()
      .test("required", "10th marksheet is required", (value) => !!value)
      .test("fileFormat", "Only PDF / PNG / JPG allowed", (value) => {
        if (!value) return true;
        return allowedDocTypes.includes(value.type);
      }),

    twelfthMarksheet: Yup.mixed<File>()
      .nullable()
      .test("required", "12th marksheet is required", (value) => !!value)
      .test("fileFormat", "Only PDF / PNG / JPG allowed", (value) => {
        if (!value) return true;
        return allowedDocTypes.includes(value.type);
      }),

    provisionalCertificate: Yup.mixed<File>()
      .nullable()
      .test(
        "provisionalRequired",
        "Provisional certificate is required for fresher",
        function (value) {
          const { employmentType } = this.parent as IFormValues;
          if (employmentType === "Fresher" && !value) {
            return this.createError({
              message: "Provisional certificate is required for fresher",
            });
          }
          return true;
        }
      )
      .test("fileFormat", "Only PDF / PNG / JPG allowed", (value) => {
        if (!value) return true;
        return allowedDocTypes.includes(value.type);
      }),

    experienceCertificate: Yup.mixed<File>()
      .nullable()
      .test(
        "experienceRequired",
        "Experience certificate is required for experienced candidates",
        function (value) {
          const { employmentType } = this.parent as IFormValues;
          if (employmentType === "Experienced" && !value) {
            return this.createError({
              message:
                "Experience certificate is required for experienced candidates",
            });
          }
          return true;
        }
      )
      .test("fileFormat", "Only PDF / PNG / JPG allowed", (value) => {
        if (!value) return true;
        return allowedDocTypes.includes(value.type);
      }),
  });

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
      password: "",
      confirmPassword: "",

      employmentType: "",
      aadharNumber: "",
      panNumber: "",
      aadharFile: null,
      panFile: null,
      tenthMarksheet: null,
      twelfthMarksheet: null,
      provisionalCertificate: null,
      experienceCertificate: null,
    },
    validationSchema,
    onSubmit: async (values) => {
      const data = new FormData();

      Object.entries(values).forEach(([key, value]) => {
        if (key === "confirmPassword") return;
        if (value === null || value === "") return;

        const val: any = value;
        if (val instanceof File) {
          data.append(key, val);
        } else {
          data.append(key, String(val));
        }
      });

      try {
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
          setCurrentStep(0);
        } else {
          alert(`❌ ${result.message}`);
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        alert("Network or server error. Please try again.");
      }
    },
  });

  // When TEAM changes
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

  // When CATEGORY changes
  useEffect(() => {
    const { team, category } = formik.values;
    formik.setFieldValue("subCategory", "");
    formik.setFieldValue("department", "");

    if (team && category && structure[team]) {
      const teamData = structure[team];
      const categoryData = teamData[category];

      if (team === "Tech" && category === "Developer") {
        setSubCategoryOptions(Object.keys(categoryData as SubCategoryMap));
      } else {
        setSubCategoryOptions([]);
        formik.setFieldValue("subCategory", "N/A");

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

  // When SUBCATEGORY changes
  useEffect(() => {
    const { team, category, subCategory } = formik.values;
    formik.setFieldValue("department", "");

    if (team === "Tech" && category === "Developer" && subCategory) {
      const teamData = structure[team];
      const categoryData = teamData[category] as SubCategoryMap;
      setDepartmentOptions(categoryData[subCategory] || []);
    }
  }, [formik.values.subCategory, formik.values.team, formik.values.category]);

  const inputBaseClass =
    "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-400 text-gray-900";
  const getInputClass = (field: keyof IFormValues) =>
    `${inputBaseClass} ${
      formik.touched[field] && formik.errors[field]
        ? "border-red-500"
        : "border-gray-300"
    }`;

  const validateStep = async (step: number) => {
    const fieldsToValidate = steps[step].fields;
    const errors = await formik.validateForm();
    const stepErrors = fieldsToValidate.filter(
      (field) => errors[field as keyof IFormValues]
    );

    fieldsToValidate.forEach((field) => {
      formik.setFieldTouched(field as keyof IFormValues, true);
    });

    return stepErrors.length === 0;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      formik.handleSubmit();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
        );
      case 1:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
        );
      case 3:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Passwords */}
            <InputField
              label="Password"
              name="password"
              type="password"
              placeholder="Enter password"
              value={formik.values.password || ""}
              onChange={formik.handleChange}
              error={formik.errors.password}
              touched={formik.touched.password}
              getInputClass={getInputClass}
            />

            <InputField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={formik.values.confirmPassword || ""}
              onChange={formik.handleChange}
              error={formik.errors.confirmPassword}
              touched={formik.touched.confirmPassword}
              getInputClass={getInputClass}
            />

            {/* Employment Type */}
            <SelectField
              label="Employment Type"
              name="employmentType"
              options={["Fresher", "Experienced"]}
              value={formik.values.employmentType}
              onChange={formik.handleChange}
              error={formik.errors.employmentType as string}
              touched={formik.touched.employmentType}
              getInputClass={getInputClass}
            />

            {/* Aadhar & PAN numbers */}
            <InputField
              label="Aadhar Number"
              name="aadharNumber"
              type="text"
              placeholder="12-digit Aadhar number"
              value={formik.values.aadharNumber}
              onChange={formik.handleChange}
              error={formik.errors.aadharNumber}
              touched={formik.touched.aadharNumber}
              getInputClass={getInputClass}
            />

            <InputField
              label="PAN Number"
              name="panNumber"
              type="text"
              placeholder="ABCDE1234F"
              value={formik.values.panNumber}
              onChange={(e) =>
                formik.setFieldValue("panNumber", e.target.value.toUpperCase())
              }
              error={formik.errors.panNumber}
              touched={formik.touched.panNumber}
              getInputClass={getInputClass}
            />

            {/* Photo */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Employee Photo
              </label>
              <input
                type="file"
                name="photo"
                accept=".png,.jpg,.jpeg"
                onChange={(e) =>
                  formik.setFieldValue(
                    "photo",
                    e.currentTarget.files?.[0] || null
                  )
                }
                className={getInputClass("photo")}
              />
              {formik.touched.photo && formik.errors.photo && (
                <p className="mt-1 text-sm text-red-500">
                  {formik.errors.photo as string}
                </p>
              )}
            </div>

            {/* Aadhar file */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Aadhar Document (PDF / Image)
              </label>
              <input
                type="file"
                name="aadharFile"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) =>
                  formik.setFieldValue(
                    "aadharFile",
                    e.currentTarget.files?.[0] || null
                  )
                }
                className={getInputClass("aadharFile")}
              />
              {formik.touched.aadharFile && formik.errors.aadharFile && (
                <p className="mt-1 text-sm text-red-500">
                  {formik.errors.aadharFile as string}
                </p>
              )}
            </div>

            {/* PAN file */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                PAN Document (PDF / Image)
              </label>
              <input
                type="file"
                name="panFile"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) =>
                  formik.setFieldValue(
                    "panFile",
                    e.currentTarget.files?.[0] || null
                  )
                }
                className={getInputClass("panFile")}
              />
              {formik.touched.panFile && formik.errors.panFile && (
                <p className="mt-1 text-sm text-red-500">
                  {formik.errors.panFile as string}
                </p>
              )}
            </div>

            {/* 10th & 12th marksheets */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  10th Marksheet (PDF / Image)
                </label>
                <input
                  type="file"
                  name="tenthMarksheet"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) =>
                    formik.setFieldValue(
                      "tenthMarksheet",
                      e.currentTarget.files?.[0] || null
                    )
                  }
                  className={getInputClass("tenthMarksheet")}
                />
                {formik.touched.tenthMarksheet &&
                  formik.errors.tenthMarksheet && (
                    <p className="mt-1 text-sm text-red-500">
                      {formik.errors.tenthMarksheet as string}
                    </p>
                  )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  12th Marksheet (PDF / Image)
                </label>
                <input
                  type="file"
                  name="twelfthMarksheet"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) =>
                    formik.setFieldValue(
                      "twelfthMarksheet",
                      e.currentTarget.files?.[0] || null
                    )
                  }
                  className={getInputClass("twelfthMarksheet")}
                />
                {formik.touched.twelfthMarksheet &&
                  formik.errors.twelfthMarksheet && (
                    <p className="mt-1 text-sm text-red-500">
                      {formik.errors.twelfthMarksheet as string}
                    </p>
                  )}
              </div>
            </div>

            {/* Provisional / Experience certificate */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Provisional Certificate (for Fresher)
                </label>
                <input
                  type="file"
                  name="provisionalCertificate"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) =>
                    formik.setFieldValue(
                      "provisionalCertificate",
                      e.currentTarget.files?.[0] || null
                    )
                  }
                  className={getInputClass("provisionalCertificate")}
                />
                {formik.touched.provisionalCertificate &&
                  formik.errors.provisionalCertificate && (
                    <p className="mt-1 text-sm text-red-500">
                      {formik.errors.provisionalCertificate as string}
                    </p>
                  )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Experience Certificate (for Experienced)
                </label>
                <input
                  type="file"
                  name="experienceCertificate"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) =>
                    formik.setFieldValue(
                      "experienceCertificate",
                      e.currentTarget.files?.[0] || null
                    )
                  }
                  className={getInputClass("experienceCertificate")}
                />
                {formik.touched.experienceCertificate &&
                  formik.errors.experienceCertificate && (
                    <p className="mt-1 text-sm text-red-500">
                      {formik.errors.experienceCertificate as string}
                    </p>
                  )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 mt-[5%]">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gray-800 px-8 py-6 text-white">
            <h2 className="text-3xl font-bold">Add New Employee</h2>
            <p className="text-sm opacity-90">
              Fill in the details to register a new employee
            </p>
          </div>

          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <React.Fragment key={index}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                        index < currentStep
                          ? "bg-gray-800 text-white"
                          : index === currentStep
                          ? "bg-gray-800 text-white ring-4 ring-gray-300"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {index < currentStep ? <Check size={20} /> : index + 1}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium ${
                        index <= currentStep ? "text-gray-800" : "text-gray-400"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded ${
                        index < currentStep ? "bg-gray-800" : "bg-gray-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="p-8">
            <div className="min-h-[300px]">{renderStepContent()}</div>

            <div className="mt-8 flex gap-4">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  formik.resetForm();
                  setCategoryOptions([]);
                  setSubCategoryOptions([]);
                  setDepartmentOptions([]);
                  setCurrentStep(0);
                }}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  Next
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={formik.isSubmitting}
                  className="flex-1 bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formik.isSubmitting ? "Adding Employee..." : "Add Employee"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeePage;
