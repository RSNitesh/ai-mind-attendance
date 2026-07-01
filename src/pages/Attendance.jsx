import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

function Attendance() {
  const [attendanceList, setAttendanceList] = useState([]);
  const [searchDate, setSearchDate] = useState(new Date().toLocaleDateString());
  const [updatingId, setUpdatingId] = useState(null);

  const loadAllAttendance = async () => {
    try {
      const q = query(collection(db, "attendance"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setAttendanceList(list);
    } catch (error) {
      console.error("Error loading attendance:", error);
    }
  };

  useEffect(() => {
    loadAllAttendance();
  }, []);

  const filteredList = attendanceList.filter((rec) => rec.date === searchDate);

  const handleStatusChange = async (recId, newStatus) => {
    if (!recId) return;

    setUpdatingId(recId);
    try {
      await updateDoc(doc(db, "attendance", recId), { status: newStatus });
      await loadAllAttendance();
    } catch (error) {
      console.error("Error updating attendance status:", error);
      alert("Status update failed.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteRecord = async (recId) => {
    if (!recId) return;

    const confirmed = window.confirm("Kya aap is attendance record ko delete karna chahte hain?");
    if (!confirmed) return;

    setUpdatingId(recId);
    try {
      await deleteDoc(doc(db, "attendance", recId));
      await loadAllAttendance();
    } catch (error) {
      console.error("Error deleting attendance record:", error);
      alert("Record delete failed.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusStyle = (status) => {
    const normalizedStatus = (status || "Present").toString().toLowerCase();
    return normalizedStatus === "absent"
      ? { color: "#991b1b", fontWeight: "bold" }
      : { color: "#15803d", fontWeight: "bold" };
  };

  return (
    <div style={{ padding: "10px" }}>
      <h2>Employee Attendance Records</h2>

      <div style={{ marginBottom: "20px" }}>
        <label>Filter by Date (e.g. {new Date().toLocaleDateString()}): </label>
        <input
          type="text"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          style={{ padding: "5px", width: "150px", marginLeft: "10px" }}
        />
        <button onClick={loadAllAttendance} style={{ marginLeft: "10px", padding: "5px 10px" }}>Refresh</button>
      </div>

      <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead style={{ backgroundColor: "#f2f2f2" }}>
          <tr>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Type</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredList.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>इस तारीख का कोई रिकॉर्ड नहीं मिला।</td>
            </tr>
          ) : (
            filteredList.map((rec) => (
              <tr key={rec.id}>
                <td>{rec.employeeId}</td>
                <td>{rec.name}</td>
                <td style={{ color: rec.type === "IN" ? "green" : "red", fontWeight: "bold" }}>{rec.type}</td>
                <td>{rec.date}</td>
                <td>{rec.timestamp?.toDate() ? rec.timestamp.toDate().toLocaleTimeString() : rec.time || "Saving..."}</td>
                <td style={getStatusStyle(rec.status)}>{rec.status || "Present"}</td>
                <td>
                  <button
                    onClick={() => handleStatusChange(rec.id, "Present")}
                    disabled={updatingId === rec.id}
                    style={{ marginRight: "8px", padding: "4px 8px", cursor: "pointer" }}
                  >
                    Present
                  </button>
                  <button
                    onClick={() => handleStatusChange(rec.id, "Absent")}
                    disabled={updatingId === rec.id}
                    style={{ padding: "4px 8px", cursor: "pointer" }}
                  >
                    Absent
                  </button>
                  <button
                    onClick={() => handleDeleteRecord(rec.id)}
                    disabled={updatingId === rec.id}
                    style={{ marginLeft: "8px", padding: "4px 8px", cursor: "pointer", backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Attendance;