"use client";
import React, { useEffect, useState } from "react";
// 1. Import ToastContainer and toast
import { ToastContainer, toast } from 'react-toastify';
// 2. Import the CSS (Assuming this file is at the root or correctly linked in your project's main layout)
import 'react-toastify/dist/ReactToastify.css';

interface Asset {
  _id: string;
  name: string;
  empId: string;
  selectedTeamCategory?: string;
  team?: string;
  designation?: string;
  deviceType?: string;
  laptopModel?: string;
  serialNumber?: string;
  yearOfMake?: string;
  macAddress?: string;
  processor?: string;
  storage?: string;
  ram?: string;
  os?: string;
  antivirus?: string;
  purchaseDate?: string;
  standardAccessories?: string[];
  otherAccessoriesText?: string;
  allAccessories?: string[];
}

const Structure = {
  Founders: { Founders: ["Founder", "Co-Founder"] },
  Manager: { Manager: ["Manager"] },
  "TL-Reporting Manager": { "TL-Reporting Manager": ["Team Lead", "Reporting Manager"] },
  HR: { HR: ["HR Executive", "HR Manager"] },
  Tech: {
    Developer: {
      Frontend: ["Junior Frontend Developer", "Senior Frontend Developer"],
      Backend: ["Junior Backend Developer", "Senior Backend Developer"],
      "Full Stack": ["Junior Full Stack Developer", "Senior Full Stack Developer"],
      "UI/UX Developer": ["UI/UX Developer"],
    },
    DevOps: ["Product Manager"],
    Tester: ["QA Engineer – Manual & Automation"],
    Designer: ["UI/UX Designer"],
    "Team Leads": ["Project Manager"],
  },
  "IT Admin": { "IT Admin": ["IT Administrator"] },
  Accounts: { Accountant: ["Accountant", "Senior Accountant"] },
  "Admin & Operations": { "Admin & Operations": ["Admin & Operations"] },
} as const;

const standardLaptopAccessories = ["Monitor", "Keyboard", "Mouse", "Charger", "Bag", "Pouch"];
const standardPCAccessories = ["Monitor", "Keyboard", "Mouse", "UPS"];

interface Props {
  assets: Asset[];
  isLoading: boolean;
  onUpdated?: (asset: Asset) => void;
}

export default function AssetSearch({ assets, isLoading, onUpdated }: Props) {
  const [localAssets, setLocalAssets] = useState<Asset[]>([]);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [found, setFound] = useState<Asset | null>(null);
  const [searching, setSearching] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<number | null>(null);

  useEffect(() => {
    setLocalAssets(assets ?? []);
  }, [assets]);

  const getTeamOptions = (category?: string) => {
    if (!category) return [];
    const cat = (Structure as any)[category];
    if (!cat) return [];
    return Object.keys(cat);
  };

  const getDesignationOptions = (category?: string, team?: string) => {
    if (!category || !team) return [];
    const cat = (Structure as any)[category];
    if (!cat) return [];
    const designations = cat[team];
    if (!designations) return [];
    if (Array.isArray(designations)) return designations;
    if (typeof designations === "object") return Object.values(designations).flat();
    return [];
  };

  const fetchAllAssets = async () => {
    try {
      const res = await fetch("/api/assets/list");
      const json = await res.json();
      if (res.ok && json?.success) {
        setLocalAssets(json.assets || []);
        setLastRefreshed(Date.now());
        return json.assets || [];
      } else {
        console.error("Failed to fetch assets list:", json);
        // 3. Replaced alert with toast.error
        toast.error("Failed to fetch assets list.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      // 4. Replaced alert with toast.error
      toast.error("Server error while fetching assets.");
    }
    return [];
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      setFound(null);
      return;
    }

    setSearching(true);
    let asset = localAssets.find((a) => String(a.empId).toLowerCase() === q.toLowerCase());
    if (asset) {
      setFound(asset);
      setSearching(false);
      return;
    }

    const refreshedRecently = lastRefreshed && Date.now() - lastRefreshed < 30000;
    if (!refreshedRecently) {
      const fresh = await fetchAllAssets();
      asset = (fresh || []).find((a: Asset) => String(a.empId).toLowerCase() === q.toLowerCase());
      if (asset) {
        setFound(asset);
        setSearching(false);
        return;
      }
    }

    setFound(null);
    setSearching(false);
    // 5. Added toast for "Asset Not Found"
    toast.info(`No asset found for Employee ID: ${q}`);
  };

  const openEdit = (asset: Asset) => {
    const clone: Asset = {
      ...asset,
      standardAccessories: asset.standardAccessories ?? [],
      allAccessories: asset.allAccessories ?? [],
      otherAccessoriesText: asset.otherAccessoriesText ?? "",
    };
    setEditing(clone);
  };

  const toggleModalAccessory = (value: string) => {
    if (!editing) return;
    const currentStd = editing.standardAccessories ?? [];
    const exists = currentStd.includes(value);
    const newStd = exists ? currentStd.filter((a) => a !== value) : [...currentStd, value];
    const typed = (editing.otherAccessoriesText ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const newAll = [...newStd, ...typed];
    setEditing({ ...editing, standardAccessories: newStd, allAccessories: newAll });
  };

  const modalChange = (key: keyof Asset, value: any) => {
    if (!editing) return;
    if (key === "otherAccessoriesText") {
      const typed = String(value)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const std = editing.standardAccessories ?? [];
      setEditing({ ...editing, otherAccessoriesText: String(value), allAccessories: [...std, ...typed] });
      return;
    }
    if (key === "selectedTeamCategory") {
      setEditing({ ...editing, selectedTeamCategory: value, team: "", designation: "" });
      return;
    }
    if (key === "team") {
      setEditing({ ...editing, team: value, designation: "" });
      return;
    }
    setEditing({ ...editing, [key]: value });
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editing.name?.trim() || !editing.empId?.trim()) {
      // 6. Replaced alert with toast.error
      toast.error("Employee name and Employee ID are required.");
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Asset> = {
        name: editing.name,
        empId: editing.empId,
        selectedTeamCategory: editing.selectedTeamCategory,
        team: editing.team,
        designation: editing.designation,
        deviceType: editing.deviceType,
        laptopModel: editing.laptopModel,
        serialNumber: editing.serialNumber,
        yearOfMake: editing.yearOfMake,
        macAddress: editing.macAddress,
        processor: editing.processor,
        storage: editing.storage,
        ram: editing.ram,
        os: editing.os,
        antivirus: editing.antivirus,
        purchaseDate: editing.purchaseDate,
        standardAccessories: editing.standardAccessories ?? [],
        otherAccessoriesText: editing.otherAccessoriesText ?? "",
        allAccessories: editing.allAccessories ?? [],
      };

      const res = await fetch(`/api/assets/${encodeURIComponent(editing._id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        console.error("Update failed:", json);
        // 7. Replaced alert with toast.error
        toast.error("Failed to update asset: " + (json?.error || "Unknown error"));
        return;
      }

      const updated: Asset = json.asset;
      setLocalAssets((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
      if (found && found._id === updated._id) setFound(updated);
      onUpdated?.(updated);
      setEditing(null);
      // 8. Added toast.success on successful update
      toast.success("Asset updated successfully!");
    } catch (err) {
      console.error("Update error:", err);
      // 9. Replaced alert with toast.error
      toast.error("Server error while updating asset. Check console.");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
      {/* 10. Add ToastContainer as the first element in the main return */}
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />

      <div className="min-h-screen flex items-center justify-center p-4 ">
        <div className="w-full max-w-3xl bg-white border border-gray-200 shadow-2xl p-8 rounded-3xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Search Asset by Employee ID</h2>

          <div className="flex gap-3 items-center">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter Employee ID and press Enter or Search"
              className="flex-1 p-3 rounded-xl border border-gray-300 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
            />
            <button
              onClick={() => handleSearch()}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              disabled={searching}
            >
              {searching ? "Searching..." : "Search"}
            </button>
            <button
              onClick={() => {
                setSearchQuery("");
                setFound(null);
              }}
              className="px-6 py-3 rounded-xl border border-gray-300 bg-white text-sm text-black hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="mt-8">
            {isLoading ? (
              <p className="text-sm text-gray-600 text-center">Initial assets are loading...</p>
            ) : found === null && searchQuery.trim() !== "" && !searching ? (
              <div >
                
                
              </div>
            ) : found ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-2xl shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{found.name}</div>
                    <div className="text-sm text-gray-600 mt-1">ID: {found.empId}</div>
                    <div className="text-sm text-blue-700 font-medium mt-2">{found.designation} ({found.team})</div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(found)}
                      className="px-4 py-2 rounded-xl border border-blue-500 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                  <div><strong className="text-gray-800">Device:</strong> {found.deviceType || "—"}</div>
                  <div><strong className="text-gray-800">Model:</strong> {found.laptopModel || "—"}</div>
                  <div><strong className="text-gray-800">Serial:</strong> {found.serialNumber || "—"}</div>
                  <div><strong className="text-gray-800">CPU / RAM / Storage:</strong> {found.processor || "—"} / {found.ram || "—"} / {found.storage || "—"}</div>
                  <div><strong className="text-gray-800">OS / Antivirus:</strong> {found.os || "—"} / {found.antivirus || "—"}</div>
                  <div><strong className="text-gray-800">Purchase Date:</strong> {found.purchaseDate || "—"}</div>
                  <div className="md:col-span-2"><strong className="text-gray-800">Accessories:</strong> {(found.allAccessories ?? []).join(", ") || "None"}</div>
                </div>
              </div>
            ) : (
              <p></p>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4"> 
          <div className="absolute inset-0 bg-black/50" onClick={() => !saving && setEditing(null)} />

          <div className="relative z-50 mt-20 max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8 mx-auto max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Edit Asset — {editing.name}</h3>
              <button className="text-gray-500 hover:text-gray-700 text-2xl font-light" onClick={() => !saving && setEditing(null)} aria-label="Close">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Employee Name</label>
                <input value={editing.name ?? ""} onChange={(e) => modalChange("name", e.target.value)} className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Employee ID</label>
                <input value={editing.empId ?? ""} onChange={(e) => modalChange("empId", e.target.value)} className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Team Category</label>
                <select value={editing.selectedTeamCategory ?? ""} onChange={(e) => modalChange("selectedTeamCategory", e.target.value)} className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select Category</option>
                  {Object.keys(Structure).map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Team / Department</label>
                <select value={editing.team ?? ""} onChange={(e) => modalChange("team", e.target.value)} className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select Team</option>
                  {getTeamOptions(editing.selectedTeamCategory).map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Designation</label>
                <select value={editing.designation ?? ""} onChange={(e) => modalChange("designation", e.target.value)} className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select Designation</option>
                  {getDesignationOptions(editing.selectedTeamCategory, editing.team).map((d) => (<option key={d} value={d}>{d}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Device Type</label>
                <select value={editing.deviceType ?? ""} onChange={(e) => modalChange("deviceType", e.target.value)} className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select Device</option>
                  <option value="Laptop">Laptop</option>
                  <option value="PC">PC</option>
                </select>
              </div>
            </div>

            {editing.deviceType === "Laptop" && (
              <>
                <h4 className="mt-6 text-lg font-semibold text-gray-800 mb-3">Laptop Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input value={editing.laptopModel ?? ""} onChange={(e) => modalChange("laptopModel", e.target.value)} placeholder="Laptop Model" className="p-3 border rounded-xl bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input value={editing.serialNumber ?? ""} onChange={(e) => modalChange("serialNumber", e.target.value)} placeholder="Serial Number" className="p-3 border rounded-xl bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input value={editing.yearOfMake ?? ""} onChange={(e) => modalChange("yearOfMake", e.target.value)} placeholder="Year of Make" className="p-3 border rounded-xl bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input value={editing.macAddress ?? ""} onChange={(e) => modalChange("macAddress", e.target.value)} placeholder="MAC Address" className="p-3 border rounded-xl bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input value={editing.processor ?? ""} onChange={(e) => modalChange("processor", e.target.value)} placeholder="Processor" className="p-3 border rounded-xl bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input value={editing.storage ?? ""} onChange={(e) => modalChange("storage", e.target.value)} placeholder="Storage" className="p-3 border rounded-xl bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input value={editing.ram ?? ""} onChange={(e) => modalChange("ram", e.target.value)} placeholder="RAM" className="p-3 border rounded-xl bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input value={editing.os ?? ""} onChange={(e) => modalChange("os", e.target.value)} placeholder="Operating System" className="p-3 border rounded-xl bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input value={editing.antivirus ?? ""} onChange={(e) => modalChange("antivirus", e.target.value)} placeholder="Antivirus" className="p-3 border rounded-xl bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="date" value={editing.purchaseDate ?? ""} onChange={(e) => modalChange("purchaseDate", e.target.value)} className="p-3 border rounded-xl bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </>
            )}

            {editing.deviceType === "PC" && (
              <>
                <h4 className="mt-6 text-lg font-semibold text-gray-800 mb-3">PC Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input value={editing.processor ?? ""} onChange={(e) => modalChange("processor", e.target.value)} placeholder="Processor" className="p-3 border rounded-xl bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input value={editing.storage ?? ""} onChange={(e) => modalChange("storage", e.target.value)} placeholder="Storage" className="p-3 border rounded-xl bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input value={editing.ram ?? ""} onChange={(e) => modalChange("ram", e.target.value)} placeholder="RAM" className="p-3 border rounded-xl bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input value={editing.os ?? ""} onChange={(e) => modalChange("os", e.target.value)} placeholder="Operating System" className="p-3 border rounded-xl bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input value={editing.antivirus ?? ""} onChange={(e) => modalChange("antivirus", e.target.value)} placeholder="Antivirus" className="p-3 border rounded-xl bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="date" value={editing.purchaseDate ?? ""} onChange={(e) => modalChange("purchaseDate", e.target.value)} className="p-3 border rounded-xl bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </>
            )}

            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Standard Accessories</h4>
              <div className="flex flex-wrap gap-3">
                {(editing.deviceType === "PC" ? standardPCAccessories : standardLaptopAccessories).map((item) => {
                  const checked = (editing.standardAccessories ?? []).includes(item);
                  return (
                    <label key={item} className={`px-4 py-2 rounded-xl border cursor-pointer transition-all ${checked ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 bg-gray-50 text-gray-700 hover:border-blue-300"}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleModalAccessory(item)} className="mr-2" />
                      <span className="text-sm font-medium">{item}</span>
                    </label>
                  );
                })}
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Other Accessories (comma-separated)</label>
                <input value={editing.otherAccessoriesText ?? ""} onChange={(e) => modalChange("otherAccessoriesText", e.target.value)} className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 text-black focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., Headset, WebCam" />
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="text-sm text-gray-700">
                  <strong className="text-gray-800">All accessories:</strong> {(editing.allAccessories ?? []).join(", ") || "None"}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => !saving && setEditing(null)} className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium" type="button" disabled={saving}>Cancel</button>
              <button onClick={saveEdit} className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium" type="button" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}