"use client";

import React, { useState, useEffect } from "react";
import { Activity, Target, SmilePlus } from "lucide-react";

export interface BehaviorComponentProps {
  employeeId: string;
  employeeName: string;
  onClose: () => void;
  onSave?: (score: number) => void;
}

const BehaviorComponent: React.FC<BehaviorComponentProps> = ({
  employeeId,
  employeeName,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    featuresDelivered: 0,
    bugsReported: 0,
    bugRate: 0,
    storyPointsCommitted: 0,
    storyPointsCompleted: 0,
    sprintCompletionRate: 0,
    estimatedHours: 0,
    actualHours: 0,
    estimationAccuracy: 0,
    prsOpened: 0,
    prsReopened: 0,
    codeQualityScore: 0,
    leavesTaken: 0,
    behaviorScore: 100,
  });

  useEffect(() => {
    const bugRate = formData.featuresDelivered > 0 ? (formData.bugsReported / formData.featuresDelivered) * 100 : 0;
    const sprintRate = formData.storyPointsCommitted > 0 ? (formData.storyPointsCompleted / formData.storyPointsCommitted) * 100 : 0;
    const variance = formData.estimatedHours > 0 ? Math.abs(formData.actualHours - formData.estimatedHours) / formData.estimatedHours : 0;
    const estAccuracy = Math.max(0, 100 - (variance * 100));

    setFormData((prev) => ({
      ...prev,
      bugRate: Math.round(bugRate),
      sprintCompletionRate: Math.round(sprintRate),
      estimationAccuracy: Math.round(estAccuracy),
    }));
  }, [formData.featuresDelivered, formData.bugsReported, formData.storyPointsCommitted, formData.storyPointsCompleted, formData.estimatedHours, formData.actualHours]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: Number(value) || 0 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/metrics/behavior", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, employeeName, formData }),
      });
      const data = await res.json();
      if (data.success) {
        onSave?.(formData.behaviorScore);
        onClose();
      }
    } catch (err) {
      console.error("Submit failed", err);
    }
  };

  return (
    <div className="bg-white p-10">
      <h1 className="text-2xl font-bold mb-8 text-gray-900">
        Metrics for <span className="text-blue-600">{employeeName || "Employee"}</span>
      </h1>
      <form onSubmit={handleSubmit} className="space-y-10">
        <section>
          <SectionHeader icon={<Activity size={18} />} title="Engineering" />
          <Grid>
            <InputField label="Features Delivered" name="featuresDelivered" value={formData.featuresDelivered} onChange={handleChange} />
            <InputField label="Bugs Reported" name="bugsReported" value={formData.bugsReported} onChange={handleChange} />
            <InputField label="PRs Opened" name="prsOpened" value={formData.prsOpened} onChange={handleChange} />
            <InputField label="PRs Reopened" name="prsReopened" value={formData.prsReopened} onChange={handleChange} />
          </Grid>
        </section>
        <section>
          <SectionHeader icon={<Target size={18} />} title="Planning" />
          <Grid>
            <InputField label="Story Points Committed" name="storyPointsCommitted" value={formData.storyPointsCommitted} onChange={handleChange} />
            <InputField label="Story Points Completed" name="storyPointsCompleted" value={formData.storyPointsCompleted} onChange={handleChange} />
            <InputField label="Estimated Hours" name="estimatedHours" value={formData.estimatedHours} onChange={handleChange} />
            <InputField label="Actual Hours" name="actualHours" value={formData.actualHours} onChange={handleChange} />
          </Grid>
        </section>
        <section>
          <SectionHeader icon={<SmilePlus size={18} />} title="Culture" />
          <Grid>
            <InputField label="Code Quality (0-100)" name="codeQualityScore" value={formData.codeQualityScore} onChange={handleChange} />
            <InputField label="Leaves Taken" name="leavesTaken" value={formData.leavesTaken} onChange={handleChange} />
            <InputField label="Behavior Score (0-100)" name="behaviorScore" value={formData.behaviorScore} onChange={handleChange} />
          </Grid>
        </section>
        <div className="flex justify-end gap-4 pt-6 border-t">
          <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
          <button type="submit" className="px-8 py-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-all shadow-lg active:scale-95">Save Metrics</button>
        </div>
      </form>
    </div>
  );
};

const Grid = ({ children }: { children: React.ReactNode }) => <div className="grid grid-cols-1 md:grid-cols-4 gap-6">{children}</div>;
const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="p-2 bg-gray-100 rounded-lg text-gray-600">{icon}</div>
    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">{title}</h2>
  </div>
);
const InputField = ({ label, name, value, onChange }: { label: string; name: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <div className="group">
    <label className="block text-[10px] font-bold uppercase tracking-tight text-gray-400 mb-1 group-focus-within:text-blue-500 transition-colors">{label}</label>
    <input type="number" name={name} value={value} onChange={onChange} className="w-full border-b border-gray-200 outline-none py-2 text-sm font-semibold text-gray-800 focus:border-blue-500 transition-colors bg-transparent" />
  </div>
);

export default BehaviorComponent;