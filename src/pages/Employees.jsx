import { useState, useEffect } from "react";
import { addDoc, collection, getDocs, deleteDoc, doc, query, where, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

function Employees({ role }) {
  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [shift, setShift] = useState("Morning");
  const [shownPinId, setShownPinId] = useState(null);
  const [employees, setEmployees] = useState([]);

  const loadEmployees = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "employees"));
      const list = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setEmployees(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleDeleteEmployee = async (docId, empId) => {
    if (!role) return;
    if (!window.confirm(`Delete employee ${empId}?`)) return;

    try {
      await deleteDoc(doc(db, "employees", docId));
      alert(`Employee ${empId} deleted successfully.`);
      loadEmployees();
    } catch (error) {
      console.error(error);
      alert("Error deleting employee: " + error.message);
    }
  };

  const toggleShowPin = (docId) => {
    setShownPinId(shownPinId === docId ? null : docId);
  };

  const handleChangePin = async (docId, currentPin) => {
    if (!role) return;
    const newPin = window.prompt("Enter new 4-digit PIN for this employee:", currentPin || "");
    if (newPin === null) return;
    if (!/^\d{4}$/.test(newPin)) {
      alert("PIN must be exactly 4 digits.");
      return;
    }

    try {
      await updateDoc(doc(db, "employees", docId), { pin: newPin });
      alert("PIN updated successfully.");
      loadEmployees();
    } catch (error) {
      console.error(error);
      alert("Error changing PIN: " + error.message);
    }
  };

  const saveEmployee = async () => {
    if (!employeeId || !name || !pin || !shift) {
      alert("Please fill all fields!");
      return;
    }

    try {
      const duplicateQuery = query(
        collection(db, "employees"),
        where("employeeId", "==", employeeId)
      );
      const duplicateSnapshot = await getDocs(duplicateQuery);
      if (!duplicateSnapshot.empty) {
        alert("This employee ID is already allocated. Please use a different ID.");
        return;
      }

      await addDoc(collection(db, "employees"), { employeeId, name, pin, shift });
      alert("Employee Added Successfully");
      setEmployeeId("");
      setName("");
      setPin("");
      setShift("Morning");
      loadEmployees();
    } catch (error) {
      console.error(error);
      alert("Error saving employee");
    }
  };

  const coreStyles = {
    title: { fontSize: "20px", fontWeight: "600", color: "#0f172a", marginBottom: "20px" },
    formBox: { display: "flex", gap: "15px", flexWrap: "wrap", marginBottom: "35px", alignItems: "center", backgroundColor: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" },
    input: { padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", width: "220px", outline: "none" },
    btn: { padding: "10px 22px", backgroundColor: "#0284c7", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" },
    table: { width: "100%", borderCollapse: "collapse", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" },
    th: { backgroundColor: "#f1f5f9", color: "#475569", padding: "14px", fontWeight: "600", textAlign: "left", fontSize: "14px" },
    td: { padding: "14px", borderBottom: "1px solid #e2e8f0", fontSize: "14px", color: "#334155" }
  };

  return (
    <div>
      <h2 style={coreStyles.title}>➕ Add New Employee</h2>
      <div style={coreStyles.formBox}>
        <input placeholder="Employee ID (e.g. EMP001)" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} style={coreStyles.input} />
        <input placeholder="Employee Name" value={name} onChange={(e) => setName(e.target.value)} style={coreStyles.input} />
        <input placeholder="4 Digit PIN" type="password" maxLength="4" value={pin} onChange={(e) => setPin(e.target.value)} style={coreStyles.input} />
        <select value={shift} onChange={(e) => setShift(e.target.value)} style={coreStyles.input}>
          <option value="Morning">Morning Shift</option>
          <option value="Evening">Evening Shift</option>
          <option value="Night">Night Shift</option>
        </select>
        <button onClick={saveEmployee} style={coreStyles.btn}>Save Employee</button>
      </div>

      <h3 style={{ ...coreStyles.title, marginBottom: "15px" }}>👥 Registered Employees List</h3>
      <table style={coreStyles.table}>
        <thead>
            <tr>
            <th style={coreStyles.th}>Document ID</th>
            <th style={coreStyles.th}>Employee ID</th>
            <th style={coreStyles.th}>Name</th>
            <th style={coreStyles.th}>Shift</th>
            <th style={coreStyles.th}>Status/PIN Lock</th>
            {role && <th style={coreStyles.th}>Action</th>}
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr><td colSpan={role ? "6" : "5"} style={{ ...coreStyles.td, textAlign: "center" }}>No employees found.</td></tr>
          ) : (
            employees.map((emp) => (
              <tr key={emp.id}>
                <td style={{ ...coreStyles.td, color: "#64748b", fontFamily: "monospace" }}>{emp.id}</td>
                <td style={{ ...coreStyles.td, fontWeight: "600" }}>{emp.employeeId}</td>
                <td style={coreStyles.td}>{emp.name}</td>
                <td style={coreStyles.td}>{emp.shift || "Morning"}</td>
                <td style={coreStyles.td}>
                  {role ? (
                    shownPinId === emp.id ? (
                      <span style={{ padding: "3px 8px", backgroundColor: "#e0f2fe", borderRadius: "4px", fontSize: "12px" }}>{emp.pin}</span>
                    ) : (
                      <span style={{ padding: "3px 8px", backgroundColor: "#e2e8f0", borderRadius: "4px", fontSize: "12px" }}>🔒 Secured</span>
                    )
                  ) : (
                    <span style={{ padding: "3px 8px", backgroundColor: "#e2e8f0", borderRadius: "4px", fontSize: "12px" }}>🔒 Secured</span>
                  )}
                </td>
                {role && (
                  <td style={coreStyles.td}>
                    <button
                      onClick={() => toggleShowPin(emp.id)}
                      style={{ padding: "6px 12px", marginRight: "8px", backgroundColor: "#0ea5e9", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                    >
                      {shownPinId === emp.id ? "Hide PIN" : "Show PIN"}
                    </button>
                    <button
                      onClick={() => handleChangePin(emp.id, emp.pin)}
                      style={{ padding: "6px 12px", marginRight: "8px", backgroundColor: "#f59e0b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                    >
                      Change PIN
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(emp.id, emp.employeeId)}
                      style={{ padding: "6px 12px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Employees;