"use client";

import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import { ChevronRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
// Ensure these paths match your project structure
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
    { title: "Personal Info", fields: ["empId", "name", "fatherName", "dateOfBirth"] },
    { title: "Employment", fields: ["joiningDate", "team", "category", "subCategory", "department"] },
    { title: "Contact", fields: ["phoneNumber", "mailId"] },
    { title: "Banking", fields: ["accountNumber", "ifscCode"] },
    {
      title: "Security & Documents",
      fields: [
        "password", "confirmPassword", "employmentType", "photo", "aadharFile", 
        "panFile", "tenthMarksheet", "twelfthMarksheet", "provisionalCertificate", "experienceCertificate"
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
        if (value instanceof File) {
          data.append(key, value);
        } else {
          data.append(key, String(value));
        }
      });

      try {
        const res = await fetch("/api/employees/add", { method: "POST", body: data });
        const result = await res.json();
        if (result.success) {
          toast.success("✅ Employee Added Successfully!"); 
          formik.resetForm();
          setCurrentStep(0);
        } else {
          toast.error(`❌ ${result.message}`);
        }
      } catch (error) {
        toast.error("Network or server error. Please try again.");
      }
    },
  });

  // Handle Dynamic Dropdowns
  useEffect(() => {
    const { team } = formik.values;
    formik.setFieldValue("category", "");
    if (team && (structure as any)[team]) {
      setCategoryOptions(Object.keys((structure as any)[team]));
    } else {
      setCategoryOptions([]);
    }
  }, [formik.values.team]);

  useEffect(() => {
    const { team, category } = formik.values;
    formik.setFieldValue("subCategory", "");
    if (team && category && (structure as any)[team]) {
      const categoryData = (structure as any)[team][category];
      if (team === "Tech" && category === "Developer") {
        setSubCategoryOptions(Object.keys(categoryData as SubCategoryMap));
      } else {
        setSubCategoryOptions([]);
        formik.setFieldValue("subCategory", "N/A");
        setDepartmentOptions(Array.isArray(categoryData) ? categoryData : []);
      }
    }
  }, [formik.values.category]);

  const getInputClass = (field: keyof IFormValues) =>
    `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-400 text-gray-900 ${
      formik.touched[field] && formik.errors[field] ? "border-red-500" : "border-gray-300"
    }`;

  const validateStep = async (step: number) => {
    const fieldsToValidate = steps[step].fields;
    const errors = await formik.validateForm();
    const stepErrors = fieldsToValidate.filter((field) => (errors as any)[field]);
    fieldsToValidate.forEach((field) => formik.setFieldTouched(field, true));
    return stepErrors.length === 0;
  };

  const handleNext = async () => {
    if (await validateStep(currentStep)) setCurrentStep(prev => prev + 1);
  };

  const renderStepContent = () => {
    // Note: String() conversion on 'value' prevents the TypeScript 'string | number' error
    switch (currentStep) {
      case 0:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Employee ID" name="empId" type="text" value={String(formik.values.empId)} onChange={(e: any) => formik.setFieldValue("empId", e.target.value.toUpperCase())} error={formik.errors.empId} touched={formik.touched.empId} getInputClass={getInputClass} />
            <InputField label="Full Name" name="name" type="text" value={String(formik.values.name)} onChange={formik.handleChange} error={formik.errors.name} touched={formik.touched.name} getInputClass={getInputClass} />
            <InputField label="Father's Name" name="fatherName" type="text" value={String(formik.values.fatherName)} onChange={formik.handleChange} error={formik.errors.fatherName} touched={formik.touched.fatherName} getInputClass={getInputClass} />
            <InputField label="Date of Birth" name="dateOfBirth" type="date" value={String(formik.values.dateOfBirth)} onChange={formik.handleChange} error={formik.errors.dateOfBirth} touched={formik.touched.dateOfBirth} getInputClass={getInputClass} />
          </div>
        );
      case 1:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Joining Date" name="joiningDate" type="date" value={String(formik.values.joiningDate)} onChange={formik.handleChange} error={formik.errors.joiningDate} touched={formik.touched.joiningDate} getInputClass={getInputClass} />
            <SelectField label="Team" name="team" options={Object.keys(structure)} value={String(formik.values.team)} onChange={formik.handleChange} error={formik.errors.team} touched={formik.touched.team} getInputClass={getInputClass} />
            {categoryOptions.length > 0 && <SelectField label="Category" name="category" options={categoryOptions} value={String(formik.values.category)} onChange={formik.handleChange} error={formik.errors.category} touched={formik.touched.category} getInputClass={getInputClass} />}
            {departmentOptions.length > 0 && <SelectField label="Department" name="department" options={departmentOptions} value={String(formik.values.department)} onChange={formik.handleChange} error={formik.errors.department} touched={formik.touched.department} getInputClass={getInputClass} />}
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Phone Number" name="phoneNumber" type="tel" value={String(formik.values.phoneNumber)} onChange={formik.handleChange} error={formik.errors.phoneNumber} touched={formik.touched.phoneNumber} getInputClass={getInputClass} />
            <InputField label="Email" name="mailId" type="email" value={String(formik.values.mailId)} onChange={formik.handleChange} error={formik.errors.mailId} touched={formik.touched.mailId} getInputClass={getInputClass} />
          </div>
        );
      case 3:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Account Number" name="accountNumber" type="text" value={String(formik.values.accountNumber)} onChange={formik.handleChange} error={formik.errors.accountNumber} touched={formik.touched.accountNumber} getInputClass={getInputClass} />
            <InputField label="IFSC Code" name="ifscCode" type="text" value={String(formik.values.ifscCode)} onChange={(e: any) => formik.setFieldValue("ifscCode", e.target.value.toUpperCase())} error={formik.errors.ifscCode} touched={formik.touched.ifscCode} getInputClass={getInputClass} />
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Password *" name="password" type="password" value={String(formik.values.password || "")} onChange={formik.handleChange} error={formik.errors.password} touched={formik.touched.password} getInputClass={getInputClass} />
            <InputField label="Confirm Password *" name="confirmPassword" type="password" value={String(formik.values.confirmPassword || "")} onChange={formik.handleChange} error={formik.errors.confirmPassword} touched={formik.touched.confirmPassword} getInputClass={getInputClass} />
            <SelectField label="Employment Type" name="employmentType" options={["Fresher", "Experienced"]} value={String(formik.values.employmentType)} onChange={formik.handleChange} error={formik.errors.employmentType} touched={formik.touched.employmentType} getInputClass={getInputClass} />
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gray-800 px-8 py-6 text-white flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Add New Employee</h2>
              <p className="text-xs text-gray-400">Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}</p>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">HR Management</span>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="px-8 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      index < currentStep ? "bg-green-500 text-white" : index === currentStep ? "bg-gray-800 text-white ring-4 ring-gray-200" : "bg-gray-200 text-gray-400"
                  }`}>
                    {index < currentStep ? <Check size={14} /> : index + 1}
                  </div>
                </div>
                {index < steps.length - 1 && <div className={`flex-1 h-1 mx-2 rounded ${index < currentStep ? "bg-green-500" : "bg-gray-200"}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Form Body */}
          <div className="p-8">
            <div className="min-h-[320px]">{renderStepContent()}</div>

            {/* Navigation Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button type="button" onClick={() => setCurrentStep(currentStep - 1)} className="px-6 py-2 border-2 border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50 transition-all">
                    Back
                  </button>
                )}
                <button type="button" onClick={() => { formik.resetForm(); setCurrentStep(0); }} className="px-6 py-2 border-2 border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50">
                  Reset
                </button>
              </div>

              {currentStep < steps.length - 1 ? (
                <button type="button" onClick={handleNext} className="flex-1 bg-gray-800 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700 transition-all flex items-center justify-center gap-2 shadow-lg">
                  Continue <ChevronRight size={18} />
                </button>
              ) : (
                <button type="button" onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting} className="flex-1 bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-all shadow-lg disabled:bg-gray-400">
                  {formik.isSubmitting ? "Registering..." : "Complete Registration"}
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