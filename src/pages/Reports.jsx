import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, updateDoc, doc, query, where } from "firebase/firestore";
import { db } from "../firebase";

function Reports() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [overtime, setOvertime] = useState([]);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [editingEmpId, setEditingEmpId] = useState(null);
  const [editForm, setEditForm] = useState({ employeeId: "", name: "", presentDays: "", totalOT: "" });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const loadAllData = async () => {
    try {
      setLoading(true);
      const empSnapshot = await getDocs(collection(db, "employees"));
      const empList = [];
      empSnapshot.forEach((doc) => empList.push({ id: doc.id, ...doc.data() }));
      setEmployees(empList);

      const attSnapshot = await getDocs(collection(db, "attendance"));
      const attList = [];
      attSnapshot.forEach((doc) => attList.push(doc.data()));
      setAttendance(attList);

      const otSnapshot = await getDocs(collection(db, "overtime"));
      const otList = [];
      otSnapshot.forEach((doc) => otList.push(doc.data()));
      setOvertime(otList);
    } catch (error) {
      console.error("Error loading report data: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleEditEmployee = async (empDocId, currentName) => {
    const newName = window.prompt("Enter new employee name:", currentName || "");
    if (newName === null) return;

    const trimmedName = newName.trim();
    if (!trimmedName) {
      alert("Employee name cannot be empty.");
      return;
    }

    try {
      await updateDoc(doc(db, "employees", empDocId), { name: trimmedName });
      alert("Employee name updated successfully.");
      await loadAllData();
    } catch (error) {
      console.error("Error updating employee:", error);
      alert("Error updating employee.");
    }
  };

  const handleDeleteEmployee = async (empDocId, empId) => {
    const confirmed = window.confirm(`Delete employee ${empId}?`);
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "employees", empDocId));
      alert(`Employee ${empId} deleted successfully.`);
      await loadAllData();
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert("Error deleting employee.");
    }
  };

  const startEdit = (emp) => {
    const stats = getReportStats(emp);
    setEditingEmpId(emp.id);
    setEditForm({
      employeeId: emp.employeeId || "",
      name: emp.name || "",
      presentDays: String(stats.presentDays),
      totalOT: String(stats.totalOT),
    });
  };

  const cancelEdit = () => {
    setEditingEmpId(null);
    setEditForm({ employeeId: "", name: "", presentDays: "", totalOT: "" });
  };

  const handleFieldChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveEdit = async () => {
    if (!editingEmpId) return;

    const employeeIdValue = editForm.employeeId.trim();
    const nameValue = editForm.name.trim();
    const presentDaysValue = parseInt(editForm.presentDays, 10);
    const totalOTValue = parseInt(editForm.totalOT, 10);

    if (!employeeIdValue || !nameValue) {
      alert("Employee ID and Name are required.");
      return;
    }

    if (!Number.isInteger(presentDaysValue) || presentDaysValue < 0) {
      alert("Present Days must be a non-negative number.");
      return;
    }

    if (!Number.isInteger(totalOTValue) || totalOTValue < 0) {
      alert("Total OT must be a non-negative number.");
      return;
    }

    try {
      const duplicateQuery = query(collection(db, "employees"), where("employeeId", "==", employeeIdValue));
      const duplicateSnapshot = await getDocs(duplicateQuery);
      const duplicateDoc = duplicateSnapshot.docs.find((docItem) => docItem.id !== editingEmpId);

      if (duplicateDoc) {
        alert("This employee ID is already in use.");
        return;
      }

      await updateDoc(doc(db, "employees", editingEmpId), {
        employeeId: employeeIdValue,
        name: nameValue,
        presentDaysOverride: presentDaysValue,
        otOverride: totalOTValue,
      });

      alert("Employee details updated successfully.");
      await loadAllData();
      cancelEdit();
    } catch (error) {
      console.error("Error saving employee edit:", error);
      alert("Error saving employee edit.");
    }
  };

  const getBaseReport = (employeeId) => {
    const empAtt = attendance.filter((att) => {
      if (att.employeeId !== employeeId) return false;
      if (att.timestamp && att.timestamp.toDate) {
        const attDateObj = att.timestamp.toDate();
        return (attDateObj.getMonth() + 1) === reportMonth && attDateObj.getFullYear() === reportYear;
      }
      if (att.date) {
        const parts = att.date.split("/");
        return parts.length === 3 && parseInt(parts[1]) === reportMonth && parseInt(parts[2]) === reportYear;
      }
      return false;
    });

    const empOt = overtime.filter((ot) => {
      if (ot.employeeId !== employeeId) return false;
      if (ot.timestamp && ot.timestamp.toDate) {
        const otDateObj = ot.timestamp.toDate();
        return (otDateObj.getMonth() + 1) === reportMonth && otDateObj.getFullYear() === reportYear;
      }
      if (ot.date) {
        const parts = ot.date.split("/");
        return parts.length === 3 && parseInt(parts[1]) === reportMonth && parseInt(parts[2]) === reportYear;
      }
      return false;
    });

    const uniqueDates = [];
    empAtt.forEach((item) => {
      let dateString = item.date;
      if (item.timestamp && item.timestamp.toDate) {
        dateString = item.timestamp.toDate().toLocaleDateString();
      }
      if (dateString && !uniqueDates.includes(dateString)) {
        uniqueDates.push(dateString);
      }
    });

    const presentDays = uniqueDates.length;
    const totalOT = empOt.reduce((sum, item) => sum + (parseInt(item.otCount) || 0), 0);

    return { presentDays, totalOT };
  };

  const getReportStats = (emp) => {
    const baseStats = getBaseReport(emp?.employeeId);
    const presentDaysOverride = emp?.presentDaysOverride;
    const otOverride = emp?.otOverride;

    return {
      presentDays: presentDaysOverride !== undefined && presentDaysOverride !== null ? Number(presentDaysOverride) : baseStats.presentDays,
      totalOT: otOverride !== undefined && otOverride !== null ? Number(otOverride) : baseStats.totalOT,
    };
  };

  const calculateReport = (employeeId) => {
    const emp = employees.find((item) => item.employeeId === employeeId);
    if (!emp) {
      return getBaseReport(employeeId);
    }
    return getReportStats(emp);
  };

  // 1. Excel (CSV) Download Function
  const downloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `AI Mind Technologies Pvt. Ltd. - Attendance Report for ${monthNames[reportMonth - 1]} ${reportYear}\n\n`;
    csvContent += "Employee ID,Name,Present Days,Total OT\n";

    employees.forEach((emp) => {
      const stats = calculateReport(emp.employeeId);
      csvContent += `${emp.employeeId},${emp.name},${stats.presentDays},${stats.totalOT}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Monthly_Report_${monthNames[reportMonth - 1]}_${reportYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. PDF Download Function (Print Command)
  const downloadPDF = () => {
    window.print();
  };

  if (loading) {
    return <div style={{ padding: "20px" }}><h3>Loading Monthly Reports... Please wait...</h3></div>;
  }

  return (
    <div style={{ padding: "10px" }}>
      {/* प्रिंट के समय फालतू बटन्स को छुपाने के लिए CSS CSS style */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            padding: 20px;
            background: white;
          }
          table {
            width: 100% !important;
            border: 1px solid #000 !important;
          }
          th, td {
            border: 1px solid #000 !important;
          }
        }
      `}</style>

      <h2 style={{ color: "#333" }}>
        Attendance & OT Report for <span style={{ color: "#008CBA" }}>{monthNames[reportMonth - 1]} {reportYear}</span>
      </h2>

      {/* यह पूरा डिव PDF/Print में दिखाई नहीं देगा क्योंकि इसमें 'no-print' क्लास है */}
      <div className="no-print" style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <label>Select Month:</label>
        <select value={reportMonth} onChange={(e) => setReportMonth(parseInt(e.target.value))} style={{ padding: "5px" }}>
          {monthNames.map((name, index) => (
            <option key={index + 1} value={index + 1}>{name}</option>
          ))}
        </select>

        <label>Year:</label>
        <input 
          type="number" 
          value={reportYear} 
          onChange={(e) => setReportYear(parseInt(e.target.value))} 
          style={{ padding: "5px", width: "80px" }} 
        />

        {/* Excel बटन */}
        <button onClick={downloadCSV} style={{ padding: "6px 12px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          📥 Export to Excel
        </button>

        {/* PDF बटन */}
        <button onClick={downloadPDF} style={{ padding: "6px 12px", backgroundColor: "#E74C3C", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          📄 Export to PDF
        </button>

        <button onClick={loadAllData} style={{ padding: "6px 12px", backgroundColor: "#555", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead style={{ backgroundColor: "#f2f2f2" }}>
          <tr>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Present Days</th>
            <th>Total OT Count</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>No employees found.</td>
            </tr>
          ) : (
            employees.map((emp) => {
              const stats = calculateReport(emp.employeeId);
              const isEditing = editingEmpId === emp.id;

              return (
                <tr key={emp.employeeId}>
                  {isEditing ? (
                    <>
                      <td><input value={editForm.employeeId} onChange={(e) => handleFieldChange("employeeId", e.target.value)} style={{ width: "100%", padding: "4px" }} /></td>
                      <td><input value={editForm.name} onChange={(e) => handleFieldChange("name", e.target.value)} style={{ width: "100%", padding: "4px" }} /></td>
                      <td><input type="number" min="0" value={editForm.presentDays} onChange={(e) => handleFieldChange("presentDays", e.target.value)} style={{ width: "100%", padding: "4px" }} /></td>
                      <td><input type="number" min="0" value={editForm.totalOT} onChange={(e) => handleFieldChange("totalOT", e.target.value)} style={{ width: "100%", padding: "4px" }} /></td>
                      <td>
                        <button onClick={saveEdit} style={{ padding: "4px 8px", marginRight: "6px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Save</button>
                        <button onClick={cancelEdit} style={{ padding: "4px 8px", backgroundColor: "#64748b", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{emp.employeeId}</td>
                      <td>{emp.name}</td>
                      <td style={{ fontWeight: "bold", color: "green" }}>{stats.presentDays} Days</td>
                      <td style={{ fontWeight: "bold", color: "#008CBA" }}>{stats.totalOT} OT</td>
                      <td>
                        <button
                          onClick={() => startEdit(emp)}
                          style={{ padding: "4px 8px", marginRight: "6px", backgroundColor: "#f59e0b", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp.id, emp.employeeId)}
                          style={{ padding: "4px 8px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Reports;