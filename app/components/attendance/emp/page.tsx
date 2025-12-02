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
} from "lucide-react";

// --- Type Definitions ---
type PunchType = "IN" | "OUT";
type AttendanceMode =
  | "IN_OFFICE"
  | "WORK_FROM_HOME"
  | "ON_DUTY"
  | "REGULARIZATION";

interface AttendanceRecord {
  punchInTime?: string;
  punchOutTime?: string;
}

// --- Component ---
const Page = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // User/State Data
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(true);
  const [punchType, setPunchType] = useState<PunchType | null>(null);
  const [mode, setMode] = useState<AttendanceMode>("IN_OFFICE");

  // Camera & Location Status
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [location, setLocation] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });

  // Submission/Confirmation State
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // NEW STATE: Tracks if we are in the confirmation step
  const [isConfirming, setIsConfirming] = useState(false); 

  // --- Utility Functions ---

  const formatTime = (val?: string) => {
    if (!val) return "—";
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getModeLabel = (m: AttendanceMode) => {
    switch (m) {
      case "IN_OFFICE":
        return "In Office";
      case "WORK_FROM_HOME":
        return "Work From Home";
      case "ON_DUTY":
        return "On Duty";
      case "REGULARIZATION":
        return "Regularization";
      default:
        return m;
    }
  };

  const getStatusLabel = (rec: AttendanceRecord | null): string => {
    if (!rec) return "No attendance yet";

    const { punchInTime, punchOutTime } = rec;
    
    if (!punchInTime && !punchOutTime) return "No punch-in";

    let isLate = false;
    let isGrace = false;
    let isEarlyLogout = false;

    if (punchInTime) {
      const d = new Date(punchInTime);
      const h = d.getHours();
      const m = d.getMinutes();

      const after930 = h > 9 || (h === 9 && m >= 30);
      const after935 = h > 9 || (h === 9 && m > 35);

      if (after935) {
        isLate = true;
      } else if (after930) {
        isGrace = true;
      }
    }

    if (punchOutTime) {
      const d = new Date(punchOutTime);
      const h = d.getHours();
      const m = d.getMinutes();

      const before630 = h < 18 || (h === 18 && m < 30);
      if (before630) {
        isEarlyLogout = true;
      }
    }

    const parts: string[] = [];

    if (!punchInTime && punchOutTime) {
      parts.push("No Login");
    } else if (punchInTime) {
      if (isLate) parts.push("Late Login");
      else if (isGrace) parts.push("Grace Login");
      else parts.push("On Time Login");
    }

    if (!punchOutTime && punchInTime) {
      parts.push("No Logout");
    } else if (punchOutTime) {
      if (isEarlyLogout) parts.push("Early Logout");
      else parts.push("On Time Logout");
    }

    return parts.join(" | ");
  };


  const getStatusColor = (rec: AttendanceRecord | null) => {
    const status = getStatusLabel(rec);
    if (status.includes("Late") || status.includes("Early")) return "text-amber-600";
    if (status.includes("On Time")) return "text-green-600";
    return "text-gray-600";
  };


  // --- Data Fetching Logic (Memoized for loadTodayAttendance) ---

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
      console.error(e);
    } finally {
      setLoadingRecord(false);
    }
  }, []);

  // --- Effects (Side Effects) ---

  // Load stored user info
  useEffect(() => {
    const id = localStorage.getItem("userEmpId");
    const storedName = localStorage.getItem("userName");

    setEmployeeId(id);
    setName(storedName);
  }, []);

  // Start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsCameraReady(true);
          };
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setSubmitStatus("Unable to access camera. Please allow camera permission.");
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Get location
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setSubmitStatus("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.error("Location error:", err);
        setSubmitStatus("Unable to fetch location. Please allow location permission.");
      }
    );
  }, []);

  // Fetch today's attendance for this mode
  useEffect(() => {
    if (!employeeId) return;
    loadTodayAttendance(employeeId, mode);
  }, [employeeId, mode, loadTodayAttendance]);

  // --- Handler Functions ---

  /**
   * Captures the image and moves to the confirmation step.
   * It does NOT submit to the database yet.
   */
  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setSubmitStatus("Camera is not ready.");
      return;
    }
    if (!employeeId) {
      setSubmitStatus("User info missing. Please log in again.");
      return;
    }
    if (!punchType) {
      setSubmitStatus("Please select Punch In or Punch Out.");
      return;
    }

    setSubmitLoading(true);
    setSubmitStatus(null);
    setPreviewImage(null); 

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions based on video stream to avoid stretching
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setSubmitStatus("Unable to capture image context.");
      setSubmitLoading(false);
      return;
    }

    // Draw the current video frame onto the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas image to a Data URL
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    
    setPreviewImage(dataUrl);
    setSubmitLoading(false);
    setIsConfirming(true); // Move to confirmation step
  };


  /**
   * Submits the captured image and data to the API.
   * Only called from the confirmation step.
   */
  const handleConfirmSubmit = async () => {
    if (!previewImage || !employeeId || !punchType) {
      setSubmitStatus("Missing data for submission. Please try capturing again.");
      setIsConfirming(false);
      setPreviewImage(null);
      return;
    }

    setSubmitLoading(true);
    setSubmitStatus(null);

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employeeId.trim(),
          imageData: previewImage,
          latitude: location.lat,
          longitude: location.lng,
          punchType,
          mode,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setSubmitStatus(json.error || "Failed to submit attendance.");
      } else {
        setSubmitStatus(
          `Attendance ${punchType === "IN" ? "Punch In" : "Punch Out"} recorded successfully! ✅`
        );
        // Reload today's record to update the display
        await loadTodayAttendance(employeeId, mode);
      }
    } catch (error) {
      console.error(error);
      setSubmitStatus("Something went wrong while submitting attendance.");
    } finally {
      setSubmitLoading(false);
      setIsConfirming(false); // Exit confirmation view
      setPreviewImage(null); // Clear the preview image
    }
  };


  /**
   * Discards the captured image and returns to the camera view.
   */
  const handleCancelCapture = () => {
    setPreviewImage(null);
    setIsConfirming(false);
    setSubmitStatus("Capture cancelled. Please take a new photo.");
  };

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // --- Confirmation Modal/View ---

  const ConfirmationView = () => (
    <div className="absolute inset-0 bg-white bg-opacity-95 backdrop-blur-sm p-4 sm:p-6 rounded-lg flex flex-col justify-center items-center z-10">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 text-center flex items-center">
        <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
        Confirm Attendance?
      </h2>
      <p className="text-sm text-gray-600 mb-4 text-center">
        Please verify the image and details before confirming the **{punchType === "IN" ? "PUNCH IN" : "PUNCH OUT"}** for **{getModeLabel(mode)}**.
      </p>

      {/* Confirmation Details */}
      <div className="w-full max-w-sm bg-gray-50 border border-gray-200 p-3 rounded-lg mb-4 text-sm">
        <div className="flex justify-between py-1">
          <span className="font-medium text-gray-700">Type:</span>
          <span className="font-semibold text-blue-600">{punchType}</span>
        </div>
        <div className="flex justify-between py-1 border-t border-gray-100">
          <span className="font-medium text-gray-700">Mode:</span>
          <span className="font-semibold text-gray-900">{getModeLabel(mode)}</span>
        </div>
        <div className="flex justify-between py-1 border-t border-gray-100">
          <span className="font-medium text-gray-700">Location:</span>
          <span className="text-gray-900 text-xs break-all">
            {location.lat && location.lng ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "Unavailable"}
          </span>
        </div>
      </div>
      
      {/* Captured Image Preview */}
      {previewImage && (
        <img
          src={previewImage}
          alt="Captured Confirmation"
          className="w-full max-w-xs aspect-video object-cover rounded-lg border-4 border-blue-400 mb-6"
          style={{ transform: "scaleX(-1)" }}
        />
      )}

      {/* Action Buttons */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={handleConfirmSubmit}
          disabled={submitLoading}
          className={`w-full py-3 rounded-lg font-bold text-white shadow-md transition-all flex items-center justify-center text-sm sm:text-base ${
            submitLoading
              ? "bg-green-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 active:scale-95"
          }`}
        >
          {submitLoading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </span>
          ) : (
            <>
              <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Confirm & Submit
            </>
          )}
        </button>

        <button
          onClick={handleCancelCapture}
          className="w-full py-3 rounded-lg font-bold text-gray-700 border border-gray-300 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all flex items-center justify-center text-sm sm:text-base"
          disabled={submitLoading}
        >
          <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Retake Photo / Cancel
        </button>
      </div>
    </div>
  );

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-white p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mt-40 mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Attendance System</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">{currentDate}</p>
        </div>

        {!employeeId && (
          <div className="mb-3 bg-red-50 border border-red-200 p-2 sm:p-3 rounded-lg">
            <div className="flex items-center">
              <XCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-red-700 font-medium text-xs sm:text-sm">No user logged in. Please log in again.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3">
          {/* Left Side - Small Info Boxes */}
          <div className="lg:col-span-1 space-y-2 sm:space-y-3">
            {/* User Info Box */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">{name || "—"}</h3>
                  <p className="text-xs text-gray-500">ID: {employeeId || "—"}</p>
                </div>
              </div>
            </div>

            {/* Mode Selection Box */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
              <div className="flex items-center mb-2">
                <Calendar className="w-4 h-4 text-gray-600 mr-2" />
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Work Mode</h3>
              </div>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as AttendanceMode)}
                disabled={isConfirming || submitLoading}
                className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium ${isConfirming || submitLoading ? 'opacity-60 bg-gray-50' : ''}`}
              >
                <option value="IN_OFFICE">🏢 In Office</option>
                <option value="WORK_FROM_HOME">🏠 Work From Home</option>
                <option value="ON_DUTY">🚗 On Duty</option>
                <option value="REGULARIZATION">📋 Regularization</option>
              </select>
            </div>

            {/* Punch Type Box */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
              <div className="flex items-center mb-2">
                <Clock className="w-4 h-4 text-gray-600 mr-2" />
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Punch Type</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPunchType("IN")}
                  disabled={isConfirming || submitLoading}
                  className={`p-2 rounded-md border transition-all ${
                    punchType === "IN"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400"
                  } ${isConfirming || submitLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <CheckCircle className={`w-5 h-5 mx-auto mb-1 ${punchType === "IN" ? "text-blue-600" : "text-gray-400"}`} />
                  <span className={`text-xs font-semibold block ${punchType === "IN" ? "text-blue-700" : "text-gray-600"}`}>
                    Punch In
                  </span>
                </button>
                
                <button
                  onClick={() => setPunchType("OUT")}
                  disabled={isConfirming || submitLoading}
                  className={`p-2 rounded-md border transition-all ${
                    punchType === "OUT"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400"
                  } ${isConfirming || submitLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <XCircle className={`w-5 h-5 mx-auto mb-1 ${punchType === "OUT" ? "text-blue-600" : "text-gray-400"}`} />
                  <span className={`text-xs font-semibold block ${punchType === "OUT" ? "text-blue-700" : "text-gray-600"}`}>
                    Punch Out
                  </span>
                </button>
              </div>
            </div>

            {/* Today's Status Box */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Today's Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Punch In:</span>
                  <span className="text-xs font-semibold text-gray-900">{formatTime(record?.punchInTime)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Punch Out:</span>
                  <span className="text-xs font-semibold text-gray-900">{formatTime(record?.punchOutTime)}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <p className={`text-xs font-semibold ${getStatusColor(record)}`}>
                    {getStatusLabel(record)}
                  </p>
                </div>
              </div>
            </div>

            {/* Location Box */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
              <div className="flex items-start">
                <MapPin className="w-4 h-4 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">Location</h3>
                  <p className="text-xs text-gray-600 break-all">
                    {location.lat && location.lng
                      ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                      : "Fetching..."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Large Camera View */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 relative min-h-[400px]">
              
              {isConfirming && <ConfirmationView />}

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center">
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Camera Capture
                </h3>
                <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                  isCameraReady ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                }`}>
                  {isCameraReady ? "● Live" : "● Waiting"}
                </div>
              </div>

              {/* Large Camera View */}
              <div className="relative mb-3">
                <video
                  ref={videoRef}
                  className="w-full aspect-video bg-black rounded-lg object-cover"
                  style={{ transform: "scaleX(-1)" }}
                  autoPlay
                  playsInline
                />
              </div>

              {/* Capture Button */}
              <button
                onClick={handleCapture}
                disabled={submitLoading || isConfirming}
                className={`w-full py-3 rounded-lg font-bold text-white text-sm sm:text-base shadow-md transition-all ${
                  submitLoading || isConfirming
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 active:scale-95"
                }`}
              >
                {submitLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Capturing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Capture Photo & Preview
                  </span>
                )}
              </button>

              {/* Status Message */}
              {submitStatus && (
                <div className={`mt-3 p-3 rounded-lg ${
                  submitStatus.includes("✅") 
                    ? "bg-green-50 border border-green-200" 
                    : "bg-red-50 border border-red-200"
                }`}>
                  <p className={`text-xs sm:text-sm font-medium ${
                    submitStatus.includes("✅") ? "text-green-700" : "text-red-700"
                  }`}>
                    {submitStatus}
                  </p>
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