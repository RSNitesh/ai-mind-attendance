import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, serverTimestamp, query, where } from "firebase/firestore";
import { db } from "../firebase";

function OTManagement() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [absentEmp, setAbsentEmp] = useState("");
  const [otCount, setOtCount] = useState("1"); // Default 1 OT
  const [otDate, setOtDate] = useState(new Date().toLocaleDateString());

  // कर्मचारियों की लिस्ट लोड करना ताकि ड्रॉपडाउन में दिखें
  const loadEmployees = async () => {
    const querySnapshot = await getDocs(collection(db, "employees"));
    const list = [];
    querySnapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    setEmployees(list);
    if (list.length > 0) {
      setSelectedEmp(list[0].employeeId);
      setAbsentEmp(list.length > 1 ? list[1].employeeId : list[0].employeeId);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const assignOT = async () => {
    if (!selectedEmp) {
      alert("Please select an employee");
      return;
    }
    if (!absentEmp) {
      alert("Please select the absent employee who is receiving OT");
      return;
    }

    const empDetails = employees.find(e => e.employeeId === selectedEmp);
    const absentDetails = employees.find(e => e.employeeId === absentEmp);
    const assignCount = parseInt(otCount, 10);
    const maxOTCount = 2;
    const now = new Date();
    const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);

    try {
      const otQuery = query(
        collection(db, "overtime"),
        where("employeeId", "==", selectedEmp)
      );
      const otSnapshot = await getDocs(otQuery);
      let recentTotal = 0;
      otSnapshot.forEach((doc) => {
        const data = doc.data();
        let ts = null;
        if (data.timestamp?.toDate) ts = data.timestamp.toDate();
        else if (data.timestamp instanceof Date) ts = data.timestamp;
        else if (data.date && data.time) ts = new Date(`${data.date} ${data.time}`);
        else if (data.date) ts = new Date(data.date);

        if (ts && ts >= eightHoursAgo) {
          recentTotal += parseInt(data.otCount, 10) || 0;
        }
      });

      if (recentTotal + assignCount > maxOTCount) {
        alert(`Cannot assign ${assignCount} OT because ${selectedEmp} already has ${recentTotal} OT in the last 8 hours. Maximum allowed is ${maxOTCount} OT per 8 hours.`);
        return;
      }

      await addDoc(collection(db, "overtime"), {
        employeeId: selectedEmp,
        name: empDetails.name,
        otCount: assignCount,
        date: otDate,
        assignedForAbsent: absentEmp,
        absentName: absentDetails?.name || "",
        timestamp: serverTimestamp()
      });

      alert(`OT (${assignCount}) successfully assigned to ${empDetails.name} for absent employee ${absentDetails?.name || absentEmp}`);
    } catch (error) {
      console.error(error);
      alert("Error assigning OT");
    }
  };

  const selectedEmployee = employees.find((e) => e.employeeId === selectedEmp);

  return (
    <div style={{ padding: "10px" }}>
      <h2>OT Management Panel</h2>
      <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px", maxWidth: "400px" }}>
        <h3>Assign Overtime (OT)</h3>
        
        <label>Select Employee:</label>
        <br />
        <select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)} style={{ padding: "8px", width: "100%", marginTop: "5px", marginBottom: "15px" }}>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.employeeId}>
              {emp.name} ({emp.employeeId})
            </option>
          ))}
        </select>

        <label>Select OT Count:</label>
        <br />
        <select value={otCount} onChange={(e) => setOtCount(e.target.value)} style={{ padding: "8px", width: "100%", marginTop: "5px", marginBottom: "15px" }}>
          <option value="1">1 OT</option>
          <option value="2">2 OT</option>
          <option value="3">3 OT</option>
          <option value="4">4 OT</option>
        </select>

        <label>Select Absent Employee:</label>
        <br />
        <select value={absentEmp} onChange={(e) => setAbsentEmp(e.target.value)} style={{ padding: "8px", width: "100%", marginTop: "5px", marginBottom: "15px" }}>
          {employees.map((emp) => (
            <option key={`absent-${emp.id}`} value={emp.employeeId}>
              {emp.name} ({emp.employeeId})
            </option>
          ))}
        </select>

        <label>Date:</label>
        <br />
        <input 
          type="text" 
          value={otDate} 
          onChange={(e) => setOtDate(e.target.value)} 
          style={{ padding: "8px", width: "95%", marginTop: "5px", marginBottom: "20px" }}
        />

        <button onClick={assignOT} style={{ padding: "10px 20px", backgroundColor: "#008CBA", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", width: "100%" }}>
          Assign OT
        </button>

        {selectedEmployee && (
          <div style={{ marginTop: "20px", padding: "12px", backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px" }}>
            <strong>OT Assigned To:</strong>
            <p style={{ margin: "8px 0 0" }}>{selectedEmployee.name} ({selectedEmployee.employeeId})</p>
          </div>
        )}
        {absentEmp && (
          <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#fff7ed", border: "1px solid #fdba74", borderRadius: "8px" }}>
            <strong>For Absent Employee:</strong>
            <p style={{ margin: "8px 0 0" }}>
              {employees.find((e) => e.employeeId === absentEmp)?.name || absentEmp} ({absentEmp})
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default OTManagement;