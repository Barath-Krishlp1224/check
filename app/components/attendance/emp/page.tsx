"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  MapPin,
  Clock,
  User,
  Calendar,
  Send,
  RotateCcw,
  LogIn,
  LogOut,
  CheckCircle2,
} from "lucide-react";

type PunchType = "IN" | "OUT";
type AttendanceMode = "IN_OFFICE" | "WORK_FROM_HOME" | "ON_DUTY" | "REGULARIZATION";

const BRANCHES = [
  { id: "saaram", name: "LP-Saaram Pondy", lat: 11.939198361614558, lon: 79.81654494108358, radius: 150 },
  { id: "tidel", name: "LP-Tidel Villupuram", lat: 11.995967441546023, lon: 79.76744798792814, radius: 2000 } 
];

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

const AttendancePage = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [record, setRecord] = useState<any>(null);
  const [loadingRecord, setLoadingRecord] = useState(true);
  const [punchType, setPunchType] = useState<PunchType | null>(null);
  const [mode, setMode] = useState<AttendanceMode>("IN_OFFICE");
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0]);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [location, setLocation] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const formatTime = (val?: string) => {
    if (!val) return "—";
    const d = new Date(val);
    return isNaN(d.getTime()) ? "—" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

  const loadTodayAttendance = useCallback(async (empId: string, currentMode: AttendanceMode) => {
    setLoadingRecord(true);
    try {
      const res = await fetch("/api/attendance/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: empId, mode: currentMode }),
      });
      const json = await res.json();
      setRecord(json.record || null);
    } catch (e) {
      console.error("Load Error:", e);
    } finally {
      setLoadingRecord(false);
    }
  }, []);

  useEffect(() => {
    setEmployeeId(localStorage.getItem("userEmpId"));
    setName(localStorage.getItem("userName"));
  }, []);

  useEffect(() => {
    if (employeeId) loadTodayAttendance(employeeId, mode);
  }, [employeeId, mode, loadTodayAttendance]);

  useEffect(() => {
    // Logic to determine if user needs to punch IN, OUT, or if they are DONE
    if (record?.punchInTime && !record.punchOutTime) {
      setPunchType("OUT");
    } else if (record?.punchInTime && record.punchOutTime) {
      setPunchType(null); // Shift complete
    } else {
      setPunchType("IN");
    }
  }, [record]);

  useEffect(() => {
    // Don't start camera if shift is already completed
    if (record?.punchInTime && record.punchOutTime) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, 
            audio: false 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsCameraReady(true);
          };
        }
      } catch (e) {
        setSubmitStatus("Camera access denied.");
      }
    };
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    };
  }, [record]); // Re-run if record changes to cleanup/start camera

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("Geo Error:", err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || !employeeId) return;
    
    if (mode === "IN_OFFICE" && location.lat && location.lng) {
      const distance = getDistance(location.lat, location.lng, selectedBranch.lat, selectedBranch.lon);
      if (distance > selectedBranch.radius) {
        setSubmitStatus(`❌ Failed: Outside branch area (${Math.round(distance)}m).`);
        return;
      }
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);
        setPreviewImage(canvas.toDataURL("image/jpeg", 0.8));
        setIsConfirming(true);
        setSubmitStatus(null);
    }
  };

  const handleConfirmSubmit = async () => {
    setSubmitLoading(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employeeId?.trim(),
          employeeName: name,
          imageData: previewImage,
          latitude: location.lat,
          longitude: location.lng,
          punchType,
          mode,
          branch: selectedBranch.name 
        }),
      });

      if (res.ok) {
        setSubmitStatus(`Success! Recorded at ${selectedBranch.name} ✅`);
        if (employeeId) await loadTodayAttendance(employeeId, mode);
        setIsConfirming(false);
        setPreviewImage(null);
      } else {
        const errorData = await res.json();
        setSubmitStatus(errorData.error || "Submission failed.");
      }
    } catch (e) {
      setSubmitStatus("System error.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const isShiftComplete = !!(record?.punchInTime && record?.punchOutTime);

  const ConfirmationModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-blue-100">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-black">Verify & Submit</h2>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-black font-medium">Action</span>
            <span className={`font-bold px-2 py-1 rounded text-xs ${punchType === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {punchType === 'IN' ? 'Check In' : 'Check Out'}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-black font-medium">Mode</span>
            <span className="font-bold text-black">{getModeLabel(mode)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-black font-medium">Branch</span>
            <span className="font-bold text-black">{selectedBranch.name}</span>
          </div>
        </div>

        {previewImage && <img src={previewImage} className="w-full h-40 object-cover rounded-xl mb-6 shadow-sm" alt="Captured" />}

        <div className="grid grid-cols-1 gap-2">
          <button onClick={handleConfirmSubmit} disabled={submitLoading} className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center">
            {submitLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <><Send className="w-4 h-4 mr-2" /> Submit Now</>}
          </button>
          <button onClick={() => { setIsConfirming(false); setPreviewImage(null); }} disabled={submitLoading} className="w-full py-3 rounded-xl font-bold text-black bg-gray-100 hover:bg-gray-200">
            Retake
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {isConfirming && <ConfirmationModal />}
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8 flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-black text-black tracking-tight">TimeTrack <span className="text-blue-600">Pro</span></h1>
                <p className="text-black font-medium text-sm">{name || 'Employee'}</p>
            </div>
            <div className="flex items-center bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                    {name?.charAt(0) || 'U'}
                </div>
                <div className="ml-3 pr-2">
                    <p className="text-xs font-bold text-black">{employeeId}</p>
                </div>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <label className="text-xs font-bold text-black uppercase tracking-widest mb-4 block">Branch</label>
              <select 
                disabled={isShiftComplete}
                className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-xl text-black font-bold outline-none transition-all disabled:opacity-50" 
                value={selectedBranch.id} 
                onChange={(e) => setSelectedBranch(BRANCHES.find(b => b.id === e.target.value) || BRANCHES[0])} 
              >
                {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <label className="text-xs font-bold text-black uppercase tracking-widest mb-4 block">Work Mode</label>
              <div className="grid grid-cols-1 gap-2">
                {['IN_OFFICE', 'WORK_FROM_HOME', 'ON_DUTY'].map((m) => (
                  <button
                    key={m}
                    disabled={isShiftComplete}
                    onClick={() => setMode(m as AttendanceMode)}
                    className={`p-3 rounded-xl text-left font-bold border-2 transition-all ${mode === m ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-100 text-black'} disabled:opacity-50`}
                  >
                    {getModeLabel(m as AttendanceMode)}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xs font-bold text-black uppercase tracking-widest mb-4 block">Log Summary</h3>
              {loadingRecord ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto" /> : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <LogIn className="w-4 h-4 text-green-600" />
                      <span className="text-black">Check In</span>
                    </div>
                    <span className="font-bold text-black">{formatTime(record?.punchInTime)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span className="text-black">Check Out</span>
                    </div>
                    <span className="font-bold text-black">{formatTime(record?.punchOutTime)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-6 md:p-10 h-full flex flex-col">
              {isShiftComplete ? (
                /* SHIFT COMPLETED VIEW */
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-green-50 rounded-[1.5rem] border-2 border-dashed border-green-200 animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-black text-green-900 mb-2">SHIFT COMPLETED</h2>
                  <p className="text-green-700 font-medium max-w-sm">
                    Great job! You have successfully recorded both Check-In and Check-Out for today.
                  </p>
                  <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md">
                    <div className="bg-white p-4 rounded-2xl shadow-sm">
                      <p className="text-xs font-bold text-gray-400 uppercase">Total Hours</p>
                      <p className="text-xl font-black text-black">Completed</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm">
                      <p className="text-xs font-bold text-gray-400 uppercase">Status</p>
                      <p className="text-xl font-black text-green-600">Present</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-8 flex items-center gap-2 text-green-700 font-bold hover:text-green-900 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" /> Refresh View
                  </button>
                </div>
              ) : (
                /* CAMERA VIEW */
                <>
                  <div className="relative flex-1 min-h-[450px] bg-gray-900 rounded-[1.5rem] overflow-hidden border-[8px] border-gray-50 shadow-inner">
                    <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay playsInline />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-72 h-72 border-2 border-white/20 rounded-full flex items-center justify-center">
                            <div className="w-64 h-64 border-4 border-dashed border-blue-400/50 rounded-full" />
                        </div>
                    </div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full">
                       <p className="text-white text-xs font-bold flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-blue-400" />
                        {location.lat ? 'GPS Active' : 'Locating...'}
                       </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button 
                      onClick={handleCapture} 
                      disabled={!isCameraReady || submitLoading} 
                      className={`w-full py-5 rounded-2xl font-black text-xl shadow-xl transition-all ${punchType === 'IN' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-red-600 text-white hover:bg-red-700'} disabled:opacity-50`}
                    >
                      <Camera className="w-6 h-6 inline mr-2" />
                      {punchType === 'IN' ? 'CHECK IN' : 'CHECK OUT'}
                    </button>

                    {submitStatus && (
                      <div className={`mt-4 p-4 rounded-xl text-sm font-bold text-center animate-pulse ${submitStatus.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {submitStatus}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default AttendancePage;