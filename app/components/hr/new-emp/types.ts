export type DepartmentMap = string[];
export type SubCategoryMap = { [key: string]: DepartmentMap };
export type CategoryMap = { [key: string]: DepartmentMap | SubCategoryMap };
export type Structure = { [team: string]: CategoryMap };

export interface IFormValues {
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
  employmentType: "Fresher" | "Experienced" | "";
  aadharFile: File | null;
  panFile: File | null;
  tenthMarksheet: File | null;
  twelfthMarksheet: File | null;
  provisionalCertificate: File | null;
  experienceCertificate: File | null;
}

export interface BaseFieldProps {
  label: string;
  name: keyof Omit<IFormValues, 'aadharNumber' | 'panNumber'>;
  value: string;
  error?: string;
  touched?: boolean;
  getInputClass: (field: keyof IFormValues) => string;
}

export interface InputFieldProps extends BaseFieldProps {
  type: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface SelectFieldProps extends BaseFieldProps {
  options: string[];
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const structure: Structure = {
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
  Housekeeping: {
    Housekeeping: ["Housekeeper", "Senior Housekeeper"],
  },
  "TL Accountant": {
    "TL Accountant": ["TL Accountant"],
  },
};