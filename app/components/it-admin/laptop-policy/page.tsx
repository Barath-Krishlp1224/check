"use client";
import React, { useState, useEffect } from "react";
import AssetListTable from "./AllocatedAssetsTable";

const Structure = {
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

interface Asset {
  _id: string;
  name: string;
  empId: string;
  selectedTeamCategory: string;
  team: string;
  designation: string;
  deviceType: string;
  laptopModel?: string;
  serialNumber?: string;
  processor?: string;
  storage?: string;
  ram?: string;
  os?: string;
  antivirus?: string;
  purchaseDate?: string;
  allAccessories: string[];
}

export default function AssetAllocationForm() {
  const [form, setForm] = useState({
    name: "",
    empId: "",
    team: "",
    designation: "",
    selectedTeamCategory: "",
    deviceType: "",
    laptopModel: "",
    serialNumber: "",
    yearOfMake: "",
    macAddress: "",
    processor: "",
    storage: "",
    ram: "",
    os: "",
    antivirus: "",
    purchaseDate: "",
    standardAccessories: [] as string[],
    otherAccessoriesText: "",
  });
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/assets/list");
      const json = await res.json();
      if (res.ok && json.success) {
        setAssets(json.assets);
      } else {
        console.error("Fetch failed:", json);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "selectedTeamCategory") {
      setForm((prev) => ({
        ...prev,
        [name]: value,
        team: "",
        designation: "",
      }));
    } else if (name === "team") {
      setForm((prev) => ({
        ...prev,
        [name]: value,
        designation: "",
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleAccessory = (value: string) => {
    setForm((prev) => {
      const exists = prev.standardAccessories.includes(value);
      return {
        ...prev,
        standardAccessories: exists
          ? prev.standardAccessories.filter((a) => a !== value)
          : [...prev.standardAccessories, value],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const typedAccessories = form.otherAccessoriesText
        .split(",")
        .map((acc) => acc.trim())
        .filter(Boolean);
      const payload = {
        name: form.name,
        empId: form.empId,
        selectedTeamCategory: form.selectedTeamCategory,
        team: form.team,
        designation: form.designation,
        deviceType: form.deviceType,
        laptopModel: form.laptopModel,
        serialNumber: form.serialNumber,
        yearOfMake: form.yearOfMake,
        macAddress: form.macAddress,
        processor: form.processor,
        storage: form.storage,
        ram: form.ram,
        os: form.os,
        antivirus: form.antivirus,
        purchaseDate: form.purchaseDate,
        standardAccessories: form.standardAccessories,
        otherAccessoriesText: form.otherAccessoriesText,
        allAccessories: [...form.standardAccessories, ...typedAccessories],
      };
      const res = await fetch("/api/assets/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        alert("Asset saved successfully.");
        setForm({
          name: "",
          empId: "",
          team: "",
          designation: "",
          selectedTeamCategory: "",
          deviceType: "",
          laptopModel: "",
          serialNumber: "",
          yearOfMake: "",
          macAddress: "",
          processor: "",
          storage: "",
          ram: "",
          os: "",
          antivirus: "",
          purchaseDate: "",
          standardAccessories: [],
          otherAccessoriesText: "",
        });
        fetchAssets();
      } else {
        console.error("Save failed:", json);
        alert("Failed to save asset: " + (json?.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Server error while saving asset. Check console.");
    }
  };

  const getTeams = (): string[] => {
    const category = Structure[form.selectedTeamCategory as keyof typeof Structure];
    if (category) {
      return Object.keys(category) as string[];
    }
    return [];
  };

  const getDesignations = (): string[] => {
    const category = Structure[form.selectedTeamCategory as keyof typeof Structure];
    if (category && form.team) {
      let designations = category[form.team as keyof typeof category];
      if (Array.isArray(designations)) {
        return designations;
      }
      if (typeof designations === 'object' && designations !== null) {
        return Object.values(designations).flat() as string[];
      }
    }
    return [];
  };

  const standardLaptopAccessories = ["Monitor", "Keyboard", "Mouse", "Charger", "Bag", "Pouch"];
  const standardPCAccessories = ["Monitor", "Keyboard", "Mouse", "UPS"];

  // ⭐️ CENTERING ADJUSTMENT: Added flex, items-center, and justify-center to the outer container.
  // The 'p-6' padding remains, but 'items-center' will center the content vertically.
  // We use `min-h-screen` to ensure it takes up the full viewport height.
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100"> 
      <div className="max-w-7xl w-full"> {/* Added w-full */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-gray-200 shadow-lg p-8 rounded-3xl">
            <h2 className="text-2xl font-bold text-black mb-6 pb-3 border-b border-gray-200">
              Employee Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                  Employee Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black placeholder-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                  Employee ID
                </label>
                <input
                  name="empId"
                  value={form.empId}
                  onChange={handleChange}
                  placeholder="Enter employee ID"
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black placeholder-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                  Team Category
                </label>
                <select
                  name="selectedTeamCategory"
                  value={form.selectedTeamCategory}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Select Team Category</option>
                  {Object.keys(Structure).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                  Team / Department
                </label>
                <select
                  name="team"
                  value={form.team}
                  onChange={handleChange}
                  disabled={!form.selectedTeamCategory}
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200"
                  required
                >
                  <option value="">Select Team / Department</option>
                  {getTeams().map((teamName) => (
                    <option key={teamName} value={teamName}>
                      {teamName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                  Designation / Role
                </label>
                <select
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  disabled={!form.team}
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200"
                  required
                >
                  <option value="">Select Designation</option>
                  {getDesignations().map((designationName) => (
                    <option key={designationName} value={designationName}>
                      {designationName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                  Select Device Type
                </label>
                <select
                  name="deviceType"
                  value={form.deviceType}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Select Device</option>
                  <option value="Laptop">Laptop</option>
                  <option value="PC">PC</option>
                </select>
              </div>
            </div>
          </div>
          {form.deviceType === "Laptop" && (
            <div className="bg-white border border-gray-200 shadow-lg p-8 rounded-3xl">
              <h2 className="text-2xl font-bold text-black mb-6 pb-3 border-b border-gray-200">
                Laptop Specifications
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div>
                  <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                    Laptop Model
                  </label>
                  <input
                    name="laptopModel"
                    placeholder="e.g., Dell XPS 15"
                    value={form.laptopModel}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black placeholder-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                    Serial Number
                  </label>
                  <input
                    name="serialNumber"
                    placeholder="Enter serial number"
                    value={form.serialNumber}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black placeholder-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                    Year of Make
                  </label>
                  <input
                    name="yearOfMake"
                    placeholder="e.g., 2024"
                    value={form.yearOfMake}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black placeholder-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                    MAC Address
                  </label>
                  <input
                    name="macAddress"
                    placeholder="00:00:00:00:00:00"
                    value={form.macAddress}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black placeholder-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                    Processor
                  </label>
                  <input
                    name="processor"
                    placeholder="e.g., Intel Core i7"
                    value={form.processor}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black placeholder-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                    Storage
                  </label>
                  <input
                    name="storage"
                    placeholder="e.g., 512GB SSD"
                    value={form.storage}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black placeholder-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                    RAM
                  </label>
                  <input
                    name="ram"
                    placeholder="e.g., 16GB"
                    value={form.ram}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black placeholder-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                    Operating System
                  </label>
                  <input
                    name="os"
                    placeholder="e.g., Windows 11"
                    value={form.os}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                    Antivirus
                  </label>
                  <input
                    name="antivirus"
                    placeholder="e.g., Norton"
                    value={form.antivirus}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black placeholder-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={form.purchaseDate}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-xl font-semibold text-black mb-4">Standard Accessories</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  {standardLaptopAccessories.map((item) => (
                    <label key={item} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100 border border-gray-200 transition-all">
                      <input
                        type="checkbox"
                        checked={form.standardAccessories.includes(item)}
                        onChange={() => toggleAccessory(item)}
                        className="w-5 h-5 rounded accent-blue-500"
                      />
                      <span className="text-black font-medium">{item}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                    Other Accessories (Optional)
                  </label>
                  <input
                    name="otherAccessoriesText"
                    placeholder="e.g., Typing Box, Stand, Adapter (comma-separated)"
                    value={form.otherAccessoriesText}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black placeholder-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          )}
          {form.deviceType === "PC" && (
            <div className="bg-white border border-gray-200 shadow-lg p-8 rounded-3xl">
              <h2 className="text-2xl font-bold text-black mb-6 pb-3 border-b border-gray-200">
                PC Specifications
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div>
                  <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                    Processor
                  </label>
                  <input
                    name="processor"
                    placeholder="e.g., Intel Core i5"
                    value={form.processor}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black placeholder-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                    Storage
                  </label>
                  <input
                    name="storage"
                    placeholder="e.g., 1TB HDD"
                    value={form.storage}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black placeholder-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                    RAM
                  </label>
                  <input
                    name="ram"
                    placeholder="e.g., 8GB"
                    value={form.ram}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black placeholder-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                    Operating System
                  </label>
                  <input
                    name="os"
                    placeholder="e.g., Windows 10"
                    value={form.os}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                    Antivirus
                  </label>
                  <input
                    name="antivirus"
                    placeholder="e.g., McAfee"
                    value={form.antivirus}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black placeholder-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={form.purchaseDate}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-xl font-semibold text-black mb-4">Standard Accessories</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {standardPCAccessories.map((item) => (
                    <label key={item} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100 border border-gray-200 transition-all">
                      <input
                        type="checkbox"
                        checked={form.standardAccessories.includes(item)}
                        onChange={() => toggleAccessory(item)}
                        className="w-5 h-5 rounded accent-blue-500"
                      />
                      <span className="text-black font-medium">{item}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <label className="block text-black font-semibold mb-2 text-sm uppercase tracking-wide">
                    Other Accessories (Optional)
                  </label>
                  <input
                    name="otherAccessoriesText"
                    placeholder="e.g., Headset, WebCam, Extra Monitor (comma-separated)"
                    value={form.otherAccessoriesText}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-black placeholder-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          )}
          <div className="bg-white border border-gray-200 shadow-lg p-6 rounded-3xl">
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              Submit Asset Allocation Form
            </button>
          </div>
        </form>
        <AssetListTable assets={assets} isLoading={isLoading} />
      </div>
    </div>
  );
}