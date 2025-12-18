import * as Yup from "yup";
import { IFormValues } from "./types";

const allowedDocTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];

export const validationSchema = Yup.object<IFormValues>().shape({
  empId: Yup.string()
    .matches(/^[A-Z0-9]+$/,
      "Employee ID must contain only uppercase letters and numbers")
    .nullable(),
  name: Yup.string()
    .matches(/^[A-Z][a-zA-Z\s]*$/,
      "Name must start with a capital letter")
    .nullable(),
  fatherName: Yup.string()
    .matches(/^[A-Z][a-zA-Z\s]*$/,
      "Father's name must start with a capital letter")
    .nullable(),
  dateOfBirth: Yup.string().nullable(),
  joiningDate: Yup.string().nullable(),
  team: Yup.string().nullable(),
  category: Yup.string().nullable(),
  subCategory: Yup.string().nullable(),
  department: Yup.string().nullable(),

  phoneNumber: Yup.string()
    .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
    .nullable(),
  mailId: Yup.string().email("Invalid email").nullable(),

  accountNumber: Yup.string()
    .matches(/^[0-9]{9,18}$/, "Account number must be between 9-18 digits")
    .nullable(),
  ifscCode: Yup.string()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code (e.g., SBIN0001234)")
    .nullable(),

  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),

  employmentType: Yup.mixed<"Fresher" | "Experienced">()
    .oneOf(["Fresher", "Experienced"])
    .nullable(),

  photo: Yup.mixed<File>()
    .nullable()
    .test("fileFormat", "Only PNG, JPEG, JPG allowed", (value) => {
      if (!value) return true;
      return ["image/png", "image/jpeg", "image/jpg"].includes(value.type);
    }),

  aadharFile: Yup.mixed<File>()
    .nullable()
    .test("fileFormat", "Only PDF / PNG / JPG allowed", (value) => {
      if (!value) return true;
      return allowedDocTypes.includes(value.type);
    }),

  panFile: Yup.mixed<File>()
    .nullable()
    .test("fileFormat", "Only PDF / PNG / JPG allowed", (value) => {
      if (!value) return true;
      return allowedDocTypes.includes(value.type);
    }),

  tenthMarksheet: Yup.mixed<File>()
    .nullable()
    .test("fileFormat", "Only PDF / PNG / JPG allowed", (value) => {
      if (!value) return true;
      return allowedDocTypes.includes(value.type);
    }),

  twelfthMarksheet: Yup.mixed<File>()
    .nullable()
    .test("fileFormat", "Only PDF / PNG / JPG allowed", (value) => {
      if (!value) return true;
      return allowedDocTypes.includes(value.type);
    }),

  provisionalCertificate: Yup.mixed<File>()
    .nullable()
    .test("provisionalRequired", "Provisional certificate is required for fresher", function (value) {
      const { employmentType } = this.parent as IFormValues;
      if (employmentType === "Fresher" && !value) {
        return this.createError({ message: "Provisional certificate is required for fresher" });
      }
      return true;
    })
    .test("fileFormat", "Only PDF / PNG / JPG allowed", (value) => {
      if (!value) return true;
      return allowedDocTypes.includes(value.type);
    }),

  experienceCertificate: Yup.mixed<File>()
    .nullable()
    .test("experienceRequired", "Experience certificate is required for experienced candidates", function (value) {
      const { employmentType } = this.parent as IFormValues;
      if (employmentType === "Experienced" && !value) {
        return this.createError({ message: "Experience certificate is required for experienced candidates" });
      }
      return true;
    })
    .test("fileFormat", "Only PDF / PNG / JPG allowed", (value) => {
      if (!value) return true;
      return allowedDocTypes.includes(value.type);
    }),
});