"use client";

import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import { ChevronRight, Check, List } from "lucide-react";
import { useRouter } from "next/navigation";
import { InputField, SelectField } from "./FormFields";
import { IFormValues, SubCategoryMap, structure } from "./types";
import { validationSchema } from "./validation";

const AddEmployeePage: React.FC = () => {
  const router = useRouter();

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

  useEffect(() => {
    const { team } = formik.values;
    formik.setFieldValue("category", "");
    formik.setFieldValue("subCategory", "");
    formik.setFieldValue("department", "");

    if (team && (structure as any)[team]) {
      setCategoryOptions(Object.keys((structure as any)[team]));
    } else {
      setCategoryOptions([]);
    }
    setSubCategoryOptions([]);
    setDepartmentOptions([]);
  }, [formik.values.team]);

  useEffect(() => {
    const { team, category } = formik.values;
    formik.setFieldValue("subCategory", "");
    formik.setFieldValue("department", "");

    if (team && category && (structure as any)[team]) {
      const teamData = (structure as any)[team];
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

  useEffect(() => {
    const { team, category, subCategory } = formik.values;
    formik.setFieldValue("department", "");

    if (team === "Tech" && category === "Developer" && subCategory) {
      const teamData = (structure as any)[team];
      const categoryData = teamData[category] as SubCategoryMap;
      setDepartmentOptions(categoryData[subCategory] || []);
    }
  }, [formik.values.subCategory, formik.values.team, formik.values.category]);

  const inputBaseClass =
    "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-400 text-gray-900";
  const getInputClass = (field: keyof IFormValues) =>
    `${inputBaseClass} ${
      formik.touched[field] && (formik.errors as any)[field]
        ? "border-red-500"
        : "border-gray-300"
    }`;

  const validateStep = async (step: number) => {
    const fieldsToValidate = steps[step].fields;
    const errors = await formik.validateForm();
    const stepErrors = fieldsToValidate.filter(
      (field) => (errors as any)[field as keyof IFormValues]
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

  const handleViewAll = () => {
    router.push("/components/it-admin");
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
              error={formik.errors.empId as string}
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
              error={formik.errors.name as string}
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
              error={formik.errors.fatherName as string}
              touched={formik.touched.fatherName}
              getInputClass={getInputClass}
            />

            <InputField
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              value={formik.values.dateOfBirth}
              onChange={formik.handleChange}
              error={formik.errors.dateOfBirth as string}
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
              error={formik.errors.joiningDate as string}
              touched={formik.touched.joiningDate}
              getInputClass={getInputClass}
            />

            <SelectField
              label="Team"
              name="team"
              options={Object.keys(structure)}
              value={formik.values.team as string}
              onChange={formik.handleChange}
              error={formik.errors.team as string}
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
                error={formik.errors.category as string}
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
                  error={formik.errors.subCategory as string}
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
                error={formik.errors.department as string}
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
              error={formik.errors.phoneNumber as string}
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
              error={formik.errors.mailId as string}
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
              error={formik.errors.accountNumber as string}
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
              error={formik.errors.ifscCode as string}
              touched={formik.touched.ifscCode}
              getInputClass={getInputClass}
            />
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Password *"
              name="password"
              type="password"
              placeholder="Enter password"
              value={formik.values.password || ""}
              onChange={formik.handleChange}
              error={formik.errors.password as string}
              touched={formik.touched.password}
              getInputClass={getInputClass}
            />

            <InputField
              label="Confirm Password *"
              name="confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={formik.values.confirmPassword || ""}
              onChange={formik.handleChange}
              error={formik.errors.confirmPassword as string}
              touched={formik.touched.confirmPassword}
              getInputClass={getInputClass}
            />

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

            <div className="hidden md:block"></div>

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
                <p className="mt-1 text-sm text-red-500">{formik.errors.photo as string}</p>
              )}
            </div>

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
                <p className="mt-1 text-sm text-red-500">{formik.errors.aadharFile as string}</p>
              )}
            </div>

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
                <p className="mt-1 text-sm text-red-500">{formik.errors.panFile as string}</p>
              )}
            </div>

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
                {formik.touched.tenthMarksheet && formik.errors.tenthMarksheet && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.tenthMarksheet as string}</p>
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
                {formik.touched.twelfthMarksheet && formik.errors.twelfthMarksheet && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.twelfthMarksheet as string}</p>
                )}
              </div>
            </div>

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
                {formik.touched.provisionalCertificate && formik.errors.provisionalCertificate && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.provisionalCertificate as string}</p>
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
                {formik.touched.experienceCertificate && formik.errors.experienceCertificate && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.experienceCertificate as string}</p>
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
    <div className="min-h-screen bg-white py-12 px-4 mt-[5%]">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleViewAll}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-800 text-base font-semibold border-2 border-gray-300 rounded-lg shadow-md hover:bg-gray-100 transition-colors"
          >
            <List size={20} />
            Home
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gray-800 px-8 py-6 text-white flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold">Add New Employee</h2>
              <p className="text-sm opacity-90">Fill in the details to register a new employee</p>
            </div>
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
                    <span className={`mt-2 text-xs font-medium ${index <= currentStep ? "text-gray-800" : "text-gray-400"}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded ${index < currentStep ? "bg-gray-800" : "bg-gray-200"}`} />
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