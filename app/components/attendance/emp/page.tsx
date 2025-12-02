"use client";

import React, { useEffect, useRef, useState } from "react";

type PunchType = "IN" | "OUT";

interface AttendanceRecord {
  punchInTime?: string;
  punchOutTime?: string;
}

const Page = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(true);

  const [punchType, setPunchType] = useState<PunchType | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [location, setLocation] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });

  // ---- Load stored user info ----
  useEffect(() => {
    const id = localStorage.getItem("userEmpId");
    const storedName = localStorage.getItem("userName");

    setEmployeeId(id);
    setName(storedName);
  }, []);

  // ---- Start camera once ----
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

  // ---- Get location once ----
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

  // ---- Fetch today's attendance record ----
  const loadTodayAttendance = async (empId: string) => {
    setLoadingRecord(true);
    try {
      const res = await fetch("/api/attendance/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: empId }),
      });

      const json = await res.json();
      setRecord(json.record || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRecord(false);
    }
  };

  useEffect(() => {
    if (!employeeId) return;
    loadTodayAttendance(employeeId);
  }, [employeeId]);

  const formatTime = (val?: string) => {
    if (!val) return "—";
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // ---- Status logic (late / grace / early) ----
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

  // ---- Capture + submit attendance (camera) ----
  const handleCaptureAndSubmit = async () => {
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

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setSubmitStatus("Unable to capture image.");
      setSubmitLoading(false);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setPreviewImage(dataUrl);

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employeeId.trim(),
          imageData: dataUrl,
          latitude: location.lat,
          longitude: location.lng,
          punchType,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setSubmitStatus(json.error || "Failed to submit attendance.");
      } else {
        setSubmitStatus(
          `Attendance ${
            punchType === "IN" ? "Punch In" : "Punch Out"
          } recorded successfully! ✅`
        );
        // Reload today's record after successful punch
        await loadTodayAttendance(employeeId);
      }
    } catch (error) {
      console.error(error);
      setSubmitStatus("Something went wrong while submitting attendance.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: 20,
        minHeight: "100vh",
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        background: "#f5f5f5",
      }}
    >
      <h2 style={{ marginBottom: 8 }}>My Attendance</h2>

      {!employeeId && (
        <p style={{ color: "red" }}>
          No user logged in. Please log in again.
        </p>
      )}

      {/* User + today info card */}
      <div
        style={{
          marginTop: 16,
          padding: 16,
          background: "#fff",
          borderRadius: 10,
          border: "1px solid #ddd",
          maxWidth: 420,
        }}
      >
        <p>
          <strong>Name:</strong> {name || "—"}
        </p>
        <p>
          <strong>Employee ID:</strong> {employeeId || "—"}
        </p>

        <hr style={{ margin: "12px 0" }} />

        {loadingRecord ? (
          <p>Loading today&apos;s attendance...</p>
        ) : (
          <>
            <p>
              <strong>Punch In:</strong> {formatTime(record?.punchInTime)}
            </p>
            <p>
              <strong>Punch Out:</strong> {formatTime(record?.punchOutTime)}
            </p>
            <p style={{ marginTop: 8 }}>
              <strong>Status:</strong> {getStatusLabel(record)}
            </p>
          </>
        )}
      </div>

      {/* Punch type selection */}
      <div
        style={{
          marginTop: 20,
          padding: "10px 14px",
          borderRadius: 10,
          background: "white",
          border: "1px solid #ddd",
          display: "inline-flex",
          gap: 20,
          alignItems: "center",
          fontSize: 14,
        }}
      >
        <span style={{ fontWeight: 600 }}>Punch Type:</span>
        <label
          style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
        >
          <input
            type="radio"
            name="punchType"
            value="IN"
            checked={punchType === "IN"}
            onChange={() => setPunchType("IN")}
          />
          Punch In
        </label>
        <label
          style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
        >
          <input
            type="radio"
            name="punchType"
            value="OUT"
            checked={punchType === "OUT"}
            onChange={() => setPunchType("OUT")}
          />
          Punch Out
        </label>
      </div>

      {/* Camera + preview */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 20 }}>
        {/* Camera */}
        <div>
          <h3 style={{ marginBottom: 8 }}>Camera</h3>
          <video
            ref={videoRef}
            style={{
              width: 320,
              height: 240,
              backgroundColor: "#000",
              borderRadius: 8,
              border: "1px solid #ddd",
              objectFit: "cover",
              transform: "scaleX(-1)",
            }}
            autoPlay
            playsInline
          />
          <p style={{ fontSize: 12, color: "#555", marginTop: 6 }}>
            {isCameraReady ? "Camera ready ✅" : "Waiting for camera..."}
          </p>
        </div>

        {/* Preview */}
        <div>
          <h3 style={{ marginBottom: 8 }}>Captured Image</h3>
          {previewImage ? (
            <img
              src={previewImage}
              alt="Captured face"
              style={{
                width: 320,
                height: 240,
                objectFit: "cover",
                borderRadius: 8,
                border: "1px solid #ddd",
                transform: "scaleX(-1)",
              }}
            />
          ) : (
            <div
              style={{
                width: 320,
                height: 240,
                borderRadius: 8,
                border: "1px dashed #aaa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "#777",
                background: "white",
              }}
            >
              No image captured yet
            </div>
          )}
        </div>
      </div>

      {/* Capture button */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={handleCaptureAndSubmit}
          disabled={submitLoading}
          style={{
            padding: "10px 18px",
            borderRadius: 6,
            border: "none",
            backgroundColor: submitLoading ? "#999" : "#0070f3",
            color: "white",
            cursor: submitLoading ? "default" : "pointer",
            fontWeight: 600,
            fontSize: 14,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {submitLoading ? "Submitting..." : "Capture & Submit Attendance"}
        </button>
      </div>

      {/* Location + submit status */}
      <p style={{ marginTop: 12, fontSize: 12, color: "#444" }}>
        Location:{" "}
        {location.lat && location.lng
          ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
          : "Fetching location..."}
      </p>

      {submitStatus && (
        <p
          style={{
            marginTop: 8,
            fontSize: 14,
            color: submitStatus.includes("✅") ? "green" : "red",
            fontWeight: 500,
          }}
        >
          {submitStatus}
        </p>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default Page;
