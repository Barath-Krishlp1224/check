"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  MapPin,
  Clock,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  RotateCcw,
  Building2,
  LogIn,
  LogOut,
  Home,
  Briefcase,
} from "lucide-react";

type PunchType = "IN" | "OUT";
type AttendanceMode = "IN_OFFICE" | "WORK_FROM_HOME" | "ON_DUTY" | "REGULARIZATION";

const BRANCHES = [
  { id: "saaram", name: "LP-Saaram Pondy", lat: 11.939198361614558, lon: 79.81654494108358, radius: 150 },
  { id: "tidel", name: "LP-Tidel Villupuram", lat: 11.940000000000000, lon: 79.82000000000000, radius: 300 } 
];

interface AttendanceRecord {
  punchInTime?: string;
  punchOutTime?: string;
  punchInMode?: AttendanceMode;
  punchOutMode?: AttendanceMode;
  mode?: AttendanceMode; 
}

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

const Page = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(true);
  const [punchType, setPunchType] = useState<PunchType | null>(null);
  const [mode, setMode] = useState<AttendanceMode>("IN_OFFICE");
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0]);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [location, setLocation] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const formatTime = (val?: string) => {
    if (!val) return "—";
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getModeLabel = (m: AttendanceMode) => {
    const labels: Record<string, string> = {
      IN_OFFICE: "In Office",
      WORK_FROM_HOME: "Work From Home",
      ON_DUTY: "On Duty",
      REGULARIZATION: "Regularization"
    };
    return labels[m] || m;
  };

  const getStatusLabel = (rec: AttendanceRecord | null): string => {
    if (!rec) return "No attendance yet";
    const { punchInTime, punchOutTime } = rec;
    if (!punchInTime && !punchOutTime) return "No records";
    const parts: string[] = [];
    if (punchInTime) {
      const d = new Date(punchInTime);
      const h = d.getHours(), m = d.getMinutes();
      if (h > 9 || (h === 9 && m > 35)) parts.push("Late Login");
      else if (h > 9 || (h === 9 && m >= 30)) parts.push("Grace Login");
      else parts.push("On Time Login");
    }
    if (punchOutTime) {
      const d = new Date(punchOutTime);
      if (d.getHours() < 18 || (d.getHours() === 18 && d.getMinutes() < 30)) parts.push("Early Logout");
      else parts.push("On Time Logout");
    }
    return parts.join(" | ");
  };

  const loadTodayAttendance = useCallback(async (empId: string, currentMode: AttendanceMode) => {
    setLoadingRecord(true);
    try {
      const res = await fetch("/api/attendance/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: empId, mode: currentMode }),
      });
      const json = await res.json();
      setRecord(json.record || json.data || json || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRecord(false);
    }
  }, []);

  useEffect(() => {
    setEmployeeId(localStorage.getItem("userEmpId"));
    setName(localStorage.getItem("userName"));
  }, []);

  useEffect(() => {
    if (!employeeId) return;
    loadTodayAttendance(employeeId, mode);
  }, [employeeId, mode, loadTodayAttendance]);

  useEffect(() => {
    if (record && record.punchInTime && !record.punchOutTime) {
      setPunchType("OUT");
    } else if (!record || !record.punchInTime) {
      setPunchType("IN");
    }
  }, [record]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); setIsCameraReady(true); };
        }
      } catch (e) {
        setSubmitStatus("Camera access denied.");
      }
    };
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || !employeeId || !punchType) {
      setSubmitStatus("Please select punch type and ensure camera is ready.");
      return;
    }
    
    if (mode === "IN_OFFICE" && location.lat && location.lng) {
      const distance = getDistance(location.lat, location.lng, selectedBranch.lat, selectedBranch.lon);
      if (distance > selectedBranch.radius) {
        setSubmitStatus(`Verification Failed: You are ${Math.round(distance)}m away from ${selectedBranch.name}.`);
        return;
      }
    }

    setSubmitLoading(true);
    const video = videoRef.current, canvas = canvasRef.current;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setPreviewImage(canvas.toDataURL("image/jpeg", 0.8));
    setSubmitLoading(false);
    setIsConfirming(true);
    setSubmitStatus(null);
  };

  const handleConfirmSubmit = async () => {
    setSubmitLoading(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employeeId?.trim(),
          imageData: previewImage,
          latitude: location.lat,
          longitude: location.lng,
          punchType,
          mode,
          branch: selectedBranch.name
        }),
      });
      if (res.ok) {
        setSubmitStatus(`Attendance recorded at ${selectedBranch.name} ✅`);
        if (employeeId) await loadTodayAttendance(employeeId, mode);
      } else {
        setSubmitStatus("Submission failed.");
      }
    } catch (e) {
      setSubmitStatus("Error occurred.");
    } finally {
      setSubmitLoading(false);
      setIsConfirming(false);
      setPreviewImage(null);
    }
  };

  const ConfirmationModal = () => (
    <div className="fixed inset-0 mt-[4%] backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Attendance</h2>
          <p className="text-sm text-gray-600">Please verify your details before submitting</p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-6 space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600 font-medium">Punch Type</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${punchType === "IN" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {punchType === "IN" ? "Check In" : "Check Out"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600 font-medium">Location</span>
            <span className="text-sm font-bold text-gray-900">{selectedBranch.name}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600 font-medium">Work Mode</span>
            <span className="text-sm font-bold text-gray-900">{getModeLabel(mode)}</span>
          </div>
        </div>

        {previewImage && (
          <div className="mb-6">
            <p className="text-xs text-gray-500 mb-2 text-center">Captured Photo</p>
            <div className="relative">
              <img 
                src={previewImage} 
                className="w-full rounded-xl shadow-lg border-4 border-blue-100" 
                style={{ transform: "scaleX(-1)" }} 
                alt="Preview" 
              />
              <div className="absolute top-2 right-2">
                <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" /> Verified
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button 
            onClick={handleConfirmSubmit} 
            disabled={submitLoading} 
            className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" /> Confirm & Submit
              </>
            )}
          </button>
          <button 
            onClick={() => { setIsConfirming(false); setPreviewImage(null); }} 
            disabled={submitLoading}
            className="w-full py-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border-2 border-gray-200 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-5 h-5 mr-2" /> Retake Photo
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {isConfirming && <ConfirmationModal />}
      
      {/* Header */}
     

      <div className="max-w-7xl mt-[5%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Controls */}
          <div className="space-y-6">
            {/* Branch Selection */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Office Location</h3>
              </div>
              <select 
                className="w-full p-4 border-2 text-black border-gray-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-gray-50" 
                value={selectedBranch.id} 
                onChange={(e) => setSelectedBranch(BRANCHES.find(b => b.id === e.target.value) || BRANCHES[0])} 
                disabled={isConfirming}
              >
                {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {location.lat && location.lng && mode === "IN_OFFICE" && (
                <div className="mt-3 flex items-center text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="font-medium">Location verified</span>
                </div>
              )}
            </div>

            {/* Work Mode */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mr-3">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Work Mode</h3>
              </div>
              <select 
                className="w-full p-4 border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-2 text-black focus:ring-blue-200 transition-all bg-gray-50" 
                value={mode} 
                onChange={(e) => setMode(e.target.value as AttendanceMode)} 
                disabled={isConfirming}
              >
                <option value="IN_OFFICE">🏢 In Office</option>
                <option value="WORK_FROM_HOME">🏠 Work From Home</option>
                <option value="ON_DUTY">🚗 On Duty</option>
              </select>
            </div>

            {/* Punch Action */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Punch Action</h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {record && record.punchInTime && !record.punchOutTime ? (
                  <button 
                    onClick={() => setPunchType("OUT")} 
                    className="p-6 rounded-xl border-2 transition-all font-bold text-lg flex items-center justify-center bg-gradient-to-br from-red-500 to-rose-600 text-white border-transparent shadow-lg"
                    disabled={isConfirming}
                  >
                    <LogOut className="w-6 h-6 mr-3" />
                    Check Out
                  </button>
                ) : (
                  <button 
                    onClick={() => setPunchType("IN")} 
                    className="p-6 rounded-xl border-2 transition-all font-bold text-lg flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 text-white border-transparent shadow-lg"
                    disabled={isConfirming}
                  >
                    <LogIn className="w-6 h-6 mr-3" />
                    Check In
                  </button>
                )}
              </div>
            </div>

            {/* Today's Summary */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Today's Activity</h3>
              </div>
              {loadingRecord ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-3 border-blue-600"></div>
                </div>
              ) : !record || (!record.punchInTime && !record.punchOutTime) ? (
                <div className="text-center py-8">
                  <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No records for today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {record.punchInTime && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <LogIn className="w-5 h-5 text-green-600 mr-2" />
                          <span className="font-bold text-green-900">Check In</span>
                        </div>
                        <span className="text-sm px-3 py-1 bg-green-200 text-green-800 rounded-full font-bold">
                          {getModeLabel(record.punchInMode || mode)}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-green-700">{formatTime(record.punchInTime)}</p>
                    </div>
                  )}
                  {record.punchOutTime && (
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-xl border-2 border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <LogOut className="w-5 h-5 text-red-600 mr-2" />
                          <span className="font-bold text-red-900">Check Out</span>
                        </div>
                        <span className="text-sm px-3 py-1 bg-red-200 text-red-800 rounded-full font-bold">
                          {getModeLabel(record.punchOutMode || mode)}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-red-700">{formatTime(record.punchOutTime)}</p>
                    </div>
                  )}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-200">
                    <p className="text-xs font-bold text-center text-blue-900">{getStatusLabel(record)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Camera */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center mr-3">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Face Verification</h3>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center ${
                  isCameraReady 
                    ? "bg-green-100 text-green-700" 
                    : "bg-gray-100 text-gray-500"
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${isCameraReady ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}></div>
                  {isCameraReady ? "Camera Ready" : "Initializing..."}
                </div>
              </div>

              <div className="relative flex-1 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden mb-6 shadow-inner border-4 border-gray-200 min-h-[400px]">
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover" 
                  style={{ transform: "scaleX(-1)" }} 
                  autoPlay 
                  playsInline 
                />
                <div className="absolute inset-0 border-4 border-blue-400 opacity-20 rounded-2xl pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-80 border-4 border-white opacity-30 rounded-3xl pointer-events-none"></div>
              </div>

              <button 
                onClick={handleCapture} 
                disabled={submitLoading || isConfirming || !punchType || !isCameraReady} 
                className="w-full py-5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transition-all text-lg"
              >
                <Camera className="w-6 h-6 mr-3" /> 
                {submitLoading ? "Processing..." : "Capture & Verify"}
              </button>

              {submitStatus && (
                <div className={`mt-4 p-4 rounded-xl text-sm font-bold text-center border-2 ${
                  submitStatus.includes("✅") 
                    ? "bg-green-50 text-green-700 border-green-200" 
                    : "bg-red-50 text-red-700 border-red-200"
                }`}>
                  {submitStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default Page;