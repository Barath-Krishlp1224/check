"use client";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { renderPreviewHtml } from "./AssetPreviewUtils";

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
        toast.error("Failed to refresh asset list from server.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Network error while fetching assets.");
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
  };

  const openPreviewWindow = (asset: Asset) => {
    const w = window.open("", "_blank", "width=680,height=720");
    if (!w) return toast.error("Popup blocked. Allow popups for this site to preview.");
    w.document.write(renderPreviewHtml(asset));
    w.document.close();
  };

  const handlePrint = (asset: Asset) => {
    const w = window.open("", "_blank", "width=800,height=700");
    if (!w) return toast.error("Popup blocked. Allow popups for this site to print.");
    w.document.write(renderPreviewHtml(asset, true));
    w.document.close();
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
      return toast.error("Employee name and Employee ID are required.");
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
        toast.error("Failed to update asset: " + (json?.error || "Unknown error"));
        return;
      }

      const updated: Asset = json.asset;
      setLocalAssets((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
      if (found && found._id === updated._id) setFound(updated);
      onUpdated?.(updated);
      setEditing(null);
      toast.success(`Asset for ${updated.name} updated successfully!`);
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Server error while updating asset. Check console.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 shadow-lg p-6 rounded-3xl mt-8">
        <h2 className="text-lg font-semibold text-black mb-4">Search Asset by Employee ID</h2>

        <form onSubmit={handleSearch} className="flex gap-3 items-center">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter Employee ID and press Enter or Search"
            className="flex-1 p-3 rounded-xl border border-gray-300 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-black"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium"
            disabled={searching}
          >
            {searching ? "Searching..." : "Search"}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-black"
            onClick={() => {
              setSearchQuery("");
              setFound(null);
            }}
          >
            Clear
          </button>
        </form>

        <div className="mt-6">
          {isLoading ? (
            <p className="text-sm text-black">Initial assets are loading...</p>
          ) : found === null && searchQuery.trim() !== "" && !searching ? (
            <div className="text-sm text-black">
              <p>No asset found for "{searchQuery}".</p>
              <p className="mt-2 text-xs text-black">Tip: try refreshing the list or check exact Employee ID spelling.</p>
            </div>
          ) : found ? (
            <div className="mt-4 bg-gray-50 border border-gray-100 p-4 rounded-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-black">{found.name}</div>
                  <div className="text-sm text-black">ID: {found.empId}</div>
                  <div className="text-sm text-black font-medium mt-1">{found.designation} ({found.team})</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openPreviewWindow(found)}
                    className="px-3 py-1 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-100 text-black"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => openEdit(found)}
                    className="px-3 py-1 rounded-lg border border-blue-500 text-sm font-medium text-black hover:bg-blue-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handlePrint(found)}
                    className="px-3 py-1 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-100 text-black"
                  >
                    Print
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-black">
                <div><strong>Device:</strong> {found.deviceType || "—"}</div>
                <div><strong>Model:</strong> {found.laptopModel || "—"}</div>
                <div><strong>Serial:</strong> {found.serialNumber || "—"}</div>
                <div><strong>CPU / RAM / Storage:</strong> {found.processor || "—"} / {found.ram || "—"} / {found.storage || "—"}</div>
                <div><strong>OS / Antivirus:</strong> {found.os || "—"} / {found.antivirus || "—"}</div>
                <div><strong>Purchase Date:</strong> {found.purchaseDate || "—"}</div>
                <div className="md:col-span-2"><strong>Accessories:</strong> {(found.allAccessories ?? []).join(", ") || "None"}</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-black">Enter an Employee ID to view details.</p>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-40 flex items-start justify-center pt-12 px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !saving && setEditing(null)} />

          <div className="relative z-50 max-w-4xl w-full bg-white rounded-2xl shadow-xl p-6 mx-auto">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-semibold text-black">Edit Asset — {editing.name}</h3>
              <button className="text-black hover:text-gray-700" onClick={() => !saving && setEditing(null)} aria-label="Close">✕</button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-black">Employee Name</label>
                <input value={editing.name ?? ""} onChange={(e) => modalChange("name", e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 bg-gray-50 text-black" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black">Employee ID</label>
                <input value={editing.empId ?? ""} onChange={(e) => modalChange("empId", e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 bg-gray-50 text-black" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black">Team Category</label>
                <select value={editing.selectedTeamCategory ?? ""} onChange={(e) => modalChange("selectedTeamCategory", e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 bg-gray-50 text-black">
                  <option value="">Select Category</option>
                  {Object.keys(Structure).map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-black">Team / Department</label>
                <select value={editing.team ?? ""} onChange={(e) => modalChange("team", e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 bg-gray-50 text-black">
                  <option value="">Select Team</option>
                  {getTeamOptions(editing.selectedTeamCategory).map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-black">Designation</label>
                <select value={editing.designation ?? ""} onChange={(e) => modalChange("designation", e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 bg-gray-50 text-black">
                  <option value="">Select Designation</option>
                  {getDesignationOptions(editing.selectedTeamCategory, editing.team).map((d) => (<option key={d} value={d}>{d}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-black">Device Type</label>
                <select value={editing.deviceType ?? ""} onChange={(e) => modalChange("deviceType", e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 bg-gray-50 text-black">
                  <option value="">Select Device</option>
                  <option value="Laptop">Laptop</option>
                  <option value="PC">PC</option>
                </select>
              </div>
            </div>

            {editing.deviceType === "Laptop" && (
              <>
                <h4 className="mt-6 text-sm font-semibold text-black">Laptop Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  <input value={editing.laptopModel ?? ""} onChange={(e) => modalChange("laptopModel", e.target.value)} placeholder="Laptop Model" className="p-2 border rounded-lg bg-gray-50 text-black" />
                  <input value={editing.serialNumber ?? ""} onChange={(e) => modalChange("serialNumber", e.target.value)} placeholder="Serial Number" className="p-2 border rounded-lg bg-gray-50 text-black" />
                  <input value={editing.yearOfMake ?? ""} onChange={(e) => modalChange("yearOfMake", e.target.value)} placeholder="Year of Make" className="p-2 border rounded-lg bg-gray-50 text-black" />
                  <input value={editing.macAddress ?? ""} onChange={(e) => modalChange("macAddress", e.target.value)} placeholder="MAC Address" className="p-2 border rounded-lg bg-gray-50 text-black" />
                  <input value={editing.processor ?? ""} onChange={(e) => modalChange("processor", e.target.value)} placeholder="Processor" className="p-2 border rounded-lg bg-gray-50 text-black" />
                  <input value={editing.storage ?? ""} onChange={(e) => modalChange("storage", e.target.value)} placeholder="Storage" className="p-2 border rounded-lg bg-gray-50 text-black" />
                  <input value={editing.ram ?? ""} onChange={(e) => modalChange("ram", e.target.value)} placeholder="RAM" className="p-2 border rounded-lg bg-gray-50 text-black" />
                  <input value={editing.os ?? ""} onChange={(e) => modalChange("os", e.target.value)} placeholder="Operating System" className="p-2 border rounded-lg bg-gray-50 text-black" />
                  <input value={editing.antivirus ?? ""} onChange={(e) => modalChange("antivirus", e.target.value)} placeholder="Antivirus" className="p-2 border rounded-lg bg-gray-50 text-black" />
                  <input type="date" value={editing.purchaseDate ?? ""} onChange={(e) => modalChange("purchaseDate", e.target.value)} className="p-2 border rounded-lg bg-gray-50 text-black" />
                </div>
              </>
            )}

            {editing.deviceType === "PC" && (
              <>
                <h4 className="mt-6 text-sm font-semibold text-black">PC Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  <input value={editing.processor ?? ""} onChange={(e) => modalChange("processor", e.target.value)} placeholder="Processor" className="p-2 border rounded-lg bg-gray-50 text-black" />
                  <input value={editing.storage ?? ""} onChange={(e) => modalChange("storage", e.target.value)} placeholder="Storage" className="p-2 border rounded-lg bg-gray-50 text-black" />
                  <input value={editing.ram ?? ""} onChange={(e) => modalChange("ram", e.target.value)} placeholder="RAM" className="p-2 border rounded-lg bg-gray-50 text-black" />
                  <input value={editing.os ?? ""} onChange={(e) => modalChange("os", e.target.value)} placeholder="Operating System" className="p-2 border rounded-lg bg-gray-50 text-black" />
                  <input value={editing.antivirus ?? ""} onChange={(e) => modalChange("antivirus", e.target.value)} placeholder="Antivirus" className="p-2 border rounded-lg bg-gray-50 text-black" />
                  <input type="date" value={editing.purchaseDate ?? ""} onChange={(e) => modalChange("purchaseDate", e.target.value)} className="p-2 border rounded-lg bg-gray-50 text-black" />
                </div>
              </>
            )}

            <div className="mt-6">
              <h4 className="text-sm font-semibold text-black">Standard Accessories</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {(editing.deviceType === "PC" ? standardPCAccessories : standardLaptopAccessories).map((item) => {
                  const checked = (editing.standardAccessories ?? []).includes(item);
                  return (
                    <label key={item} className={`px-3 py-1 rounded-lg border ${checked ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-gray-50"} cursor-pointer`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleModalAccessory(item)} className="mr-2" />
                      <span className="text-sm text-black">{item}</span>
                    </label>
                  );
                })}
              </div>

              <div className="mt-3">
                <label className="block text-xs font-semibold text-black">Other Accessories (comma-separated)</label>
                <input value={editing.otherAccessoriesText ?? ""} onChange={(e) => modalChange("otherAccessoriesText", e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 bg-gray-50 text-black" placeholder="e.g., Headset, WebCam" />
              </div>

              <div className="mt-3 text-sm text-black">
                <div><strong>All accessories:</strong> {(editing.allAccessories ?? []).join(", ") || "None"}</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => !saving && setEditing(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-black" type="button" disabled={saving}>Cancel</button>
              <button onClick={saveEdit} className="px-4 py-2 rounded-lg bg-blue-600 text-white" type="button" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}