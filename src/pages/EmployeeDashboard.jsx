import { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase";

function EmployeeDashboard({ employee, onLogout }) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!employee?.employeeId) return;
    setLoading(true);

    try {
      const attQuery = query(collection(db, "attendance"), where("employeeId", "==", employee.employeeId));
      const attSnapshot = await getDocs(attQuery);
      const attList = [];
      attSnapshot.forEach((doc) => attList.push({ id: doc.id, ...doc.data() }));
      setAttendanceRecords(attList);

      const otQuery = query(collection(db, "overtime"), where("employeeId", "==", employee.employeeId));
      const otSnapshot = await getDocs(otQuery);
      const otList = [];
      otSnapshot.forEach((doc) => otList.push({ id: doc.id, ...doc.data() }));
      setOvertimeRecords(otList);
    } catch (error) {
      console.error("Error fetching employee data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [employee]);

  const getLatestDutyTimestamp = () => {
    if (!attendanceRecords.length) return null;
    const recent = attendanceRecords
      .filter((rec) => ["IN", "OUT"].includes((rec.type || "").toString().toUpperCase()))
      .map((rec) => {
        if (rec.timestamp?.toDate) return rec.timestamp.toDate();
        if (rec.timestamp instanceof Date) return rec.timestamp;
        if (rec.date && rec.time) return new Date(`${rec.date} ${rec.time}`);
        if (rec.date) return new Date(rec.date);
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => b - a);
    return recent.length ? recent[0] : null;
  };

  const handleMarkDuty = async (type) => {
    if (!employee?.employeeId) {
      alert("Employee not logged in.");
      return;
    }

    const lastTimestamp = getLatestDutyTimestamp();
    if (lastTimestamp) {
      const diffMs = new Date() - lastTimestamp;
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours < 8) {
        alert("You can only mark IN/OUT duty once every 8 hours.");
        return;
      }
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "attendance"), {
        employeeId: employee.employeeId,
        name: employee.name,
        type,
        status: "Present",
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        timestamp: new Date(),
      });
      alert(`${type} Duty recorded successfully.`);
      await loadData();
    } catch (error) {
      console.error(`Error recording ${type} Duty:`, error);
      alert(`Error recording ${type} Duty: ${error.message}`);
      setLoading(false);
    }
  };

  const formatDate = (rec) => {
    if (rec.date) return rec.date;
    if (rec.timestamp?.toDate) return rec.timestamp.toDate().toLocaleDateString();
    return "N/A";
  };

  const formatTime = (rec) => {
    if (rec.time) return rec.time;
    if (rec.timestamp?.toDate) return rec.timestamp.toDate().toLocaleTimeString();
    return "N/A";
  };

  const computeStatus = (rec) => {
    const status = (rec.status || "").toString().toLowerCase();
    const type = (rec.type || "").toString().toUpperCase();
    if (status === "absent" || type === "ABSENT") return "Absent";
    return "Present";
  };

  const otByDate = overtimeRecords.reduce((map, ot) => {
    const date = ot.date || (ot.timestamp?.toDate ? ot.timestamp.toDate().toLocaleDateString() : "Unknown");
    map[date] = (map[date] || 0) + (parseInt(ot.otCount) || 0);
    return map;
  }, {});

  const dates = [...new Set(attendanceRecords.map((rec) => formatDate(rec)))].sort((a, b) => new Date(a) - new Date(b));

  const summary = dates.reduce(
    (acc, date) => {
      const recs = attendanceRecords.filter((rec) => formatDate(rec) === date);
      const hasAbsent = recs.some((rec) => computeStatus(rec) === "Absent");
      if (hasAbsent) acc.absent += 1;
      else acc.present += 1;
      return acc;
    },
    { present: 0, absent: 0 }
  );
  summary.totalOT = overtimeRecords.reduce((sum, ot) => sum + (parseInt(ot.otCount) || 0), 0);

  const currentMonthName = new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const styles = {
    container: { padding: "20px", fontFamily: "Segoe UI, Roboto, sans-serif" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: "24px" },
    title: { fontSize: "26px", margin: 0, color: "#0f172a" },
    subtitle: { margin: "8px 0 0", color: "#475569" },
    cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "16px", marginBottom: "24px" },
    statCard: { borderRadius: "12px", padding: "20px", minHeight: "110px" },
    tableCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { padding: "14px", textAlign: "left", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: "600" },
    td: { padding: "14px", borderBottom: "1px solid #e2e8f0", color: "#334155" },
    badge: (status) => ({ display: "inline-block", padding: "4px 10px", borderRadius: "999px", background: status === "Present" ? "#dcfce7" : "#fee2e2", color: status === "Present" ? "#15803d" : "#991b1b", fontWeight: "700" })
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={{ color: "#1d4ed8", fontSize: "32px", fontWeight: "800", fontFamily: "Georgia, serif", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>
            {currentMonthName}
          </div>
          <h2 style={styles.title}>Welcome, {employee?.name || "Employee"}</h2>
          <p style={styles.subtitle}>Employee ID: <strong>{employee?.employeeId || "N/A"}</strong></p>
        </div>
        <button onClick={onLogout} style={{ padding: "10px 18px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" }}>
          Logout
        </button>
      </div>

      <div style={{ marginBottom: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          onClick={() => handleMarkDuty("IN")}
          style={{ padding: "10px 16px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
        >
          Mark IN Duty
        </button>
        <button
          onClick={() => handleMarkDuty("OUT")}
          style={{ padding: "10px 16px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
        >
          Mark OUT Duty
        </button>
      </div>

      <div style={styles.cardGrid}>
        <div style={{ ...styles.statCard, background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#166534" }}>
          <p style={{ margin: 0, fontSize: "14px" }}>Present Days</p>
          <p style={{ margin: "12px 0 0", fontSize: "28px", fontWeight: "700" }}>{summary.present}</p>
        </div>
        <div style={{ ...styles.statCard, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
          <p style={{ margin: 0, fontSize: "14px" }}>Absent Days</p>
          <p style={{ margin: "12px 0 0", fontSize: "28px", fontWeight: "700" }}>{summary.absent}</p>
        </div>
        <div style={{ ...styles.statCard, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8" }}>
          <p style={{ margin: 0, fontSize: "14px" }}>Total OT</p>
          <p style={{ margin: "12px 0 0", fontSize: "28px", fontWeight: "700" }}>{summary.totalOT} OT</p>
        </div>
      </div>

      {loading ? (
        <p>Loading your attendance and OT details...</p>
      ) : (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Time</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>OT</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ ...styles.td, textAlign: "center", color: "#64748b" }}>
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                attendanceRecords.sort((a, b) => {
                  const da = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.date);
                  const db = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.date);
                  return db - da;
                }).map((rec) => {
                  const date = formatDate(rec);
                  return (
                    <tr key={rec.id}>
                      <td style={styles.td}>{date}</td>
                      <td style={styles.td}>{formatTime(rec)}</td>
                      <td style={styles.td}>{rec.type || "N/A"}</td>
                      <td style={styles.td}><span style={styles.badge(computeStatus(rec))}>{computeStatus(rec)}</span></td>
                      <td style={styles.td}>{otByDate[date] ? `${otByDate[date]} OT` : "0 OT"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default EmployeeDashboard;
