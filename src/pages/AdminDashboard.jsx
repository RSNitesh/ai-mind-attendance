import { useState, useEffect } from "react";
import Employees from "./Employees";
import Attendance from "./Attendance";
import OTManagement from "./OTManagement";
import Reports from "./Reports";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

function AdminDashboard({ role }) {
  const [page, setPage] = useState("dashboard");
  const [newAdminId, setNewAdminId] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [adminList, setAdminList] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const snapshot = await getDocs(collection(db, "admins"));
      const list = [];
      snapshot.forEach((doc) => list.push({ docId: doc.id, ...doc.data() }));
      setAdminList(list);
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    if (role === "super_admin") {
      fetchAdmins();
    }
  }, [role]);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminId || !newAdminPassword) {
      alert("Please fill all fields");
      return;
    }
    if (adminList.length >= 2) {
      alert("आप अधिकतम 2 सब-एडमिन ही जोड़ सकते हैं!");
      return;
    }
    try {
      await addDoc(collection(db, "admins"), {
        adminId: newAdminId,
        password: newAdminPassword,
        role: "admin",
        createdAt: new Date()
      });
      setNewAdminId("");
      setNewAdminPassword("");
      alert("New Admin added successfully!");
      fetchAdmins();
    } catch (error) {
      alert("Error adding admin: " + error.message);
    }
  };

  const handleDeleteAdmin = async (docId) => {
    if (window.confirm("क्या आप सच में इस एडमिन को हटाना चाहते हैं?")) {
      try {
        await deleteDoc(doc(db, "admins", docId));
        alert("Admin deleted successfully!");
        fetchAdmins();
      } catch (error) {
        alert("Error deleting admin: " + error.message);
      }
    }
  };

  // --- PREMIUM CSS-IN-JS STYLES ---
  const styles = {
    container: { padding: "30px 40px", backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Segoe UI', Roboto, sans-serif" },
    header: { borderBottom: "2px solid #e2e8f0", paddingBottom: "20px", marginBottom: "25px" },
    mainTitle: { fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: "0 0 5px 0" },
    subTitle: { fontSize: "14px", color: "#64748b", fontWeight: "500", display: "flex", alignItems: "center", gap: "10px" },
    badge: { padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: role === "super_admin" ? "#fef3c7" : "#e0f2fe", color: role === "super_admin" ? "#b45309" : "#0369a1" },
    menuBar: { display: "flex", gap: "12px", marginBottom: "30px", flexWrap: "wrap" },
    navButton: (isActive, type) => {
      let base = { padding: "12px 20px", cursor: "pointer", fontWeight: "600", fontSize: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", color: "#475569", transition: "all 0.2s" };
      if (isActive) { base.backgroundColor = "#0f172a"; base.color = "#ffffff"; base.borderColor = "#0f172a"; }
      else if (type === "emp") { base.backgroundColor = "#e0f2fe"; base.color = "#0369a1"; base.borderColor = "#bae6fd"; }
      else if (type === "admin") { base.backgroundColor = "#fef3c7"; base.color = "#b45309"; base.borderColor = "#fde68a"; }
      return base;
    },
    contentArea: { backgroundColor: "#ffffff", borderRadius: "12px", padding: "30px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" },
    welcomeBox: { lineHeight: "1.8", color: "#334155" },
    guideLine: { margin: "12px 0", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" },
    formGroup: { backgroundColor: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "25px" },
    input: { padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", width: "200px", outline: "none" },
    btnSuccess: { padding: "10px 20px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" },
    table: { width: "100%", borderCollapse: "collapse", marginTop: "15px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" },
    th: { backgroundColor: "#f1f5f9", color: "#475569", fontWeight: "600", padding: "14px", textAlign: "left", fontSize: "14px" },
    td: { padding: "14px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.mainTitle}>AI Mind Technologies Pvt. Ltd.</h1>
        <div style={styles.subTitle}>
          Control Center <span style={styles.badge}>{role === "super_admin" ? "👑 Super Admin Mode" : "👤 Sub-Admin Mode"}</span>
        </div>
      </div>

      <div style={styles.menuBar}>
        <button onClick={() => setPage("dashboard")} style={styles.navButton(page === "dashboard")}>🏠 Dashboard Summary</button>
        <button onClick={() => setPage("employees")} style={styles.navButton(page === "employees", "emp")}>➕ Add / View Employees</button>
        <button onClick={() => setPage("attendance")} style={styles.navButton(page === "attendance")}>📝 Attendance List</button>
        <button onClick={() => setPage("ot_management")} style={styles.navButton(page === "ot_management")}>⚙️ OT Management</button>
        <button onClick={() => setPage("reports")} style={styles.navButton(page === "reports")}>📊 Monthly Reports</button>
        {role === "super_admin" && (
          <button onClick={() => setPage("manage_admins")} style={styles.navButton(page === "manage_admins", "admin")}>🔑 Manage Sub-Admins</button>
        )}
      </div>

      <div style={styles.contentArea}>
        {page === "dashboard" && (
          <div style={styles.welcomeBox}>
            <h3 style={{ fontSize: "22px", marginBottom: "15px", color: "#0f172a" }}>🚀 Welcome to AI Mind Admin System</h3>
            <p style={styles.guideLine}>🔹 <strong>नया कर्मचारी जोड़ने के लिए:</strong> ऊपर नीले रंग के <strong>"Add / View Employees"</strong> बटन पर क्लिक करें।</p>
            <p style={styles.guideLine}>🔹 <strong>अटेंडेंस देखने के लिए:</strong> "Attendance List" पर जाएं।</p>
            <p style={styles.guideLine}>🔹 <strong>ओवरटाइम देने के लिए:</strong> "OT Management" का उपयोग करें।</p>
            {role === "super_admin" && (
              <div style={{ marginTop: "20px", padding: "12px", backgroundColor: "#ecfdf5", color: "#065f46", borderRadius: "6px", fontWeight: "500" }}>
                👑 आप <strong>Super Admin</strong> हैं। आपके पास सब-एडमिन्स को मैनेज करने का पूरा एक्सेस है।
              </div>
            )}
          </div>
        )}

        {page === "employees" && <Employees role={role} />}
        {page === "attendance" && <Attendance />}
        {page === "ot_management" && <OTManagement />}
        {page === "reports" && <Reports />}

        {page === "manage_admins" && role === "super_admin" && (
          <div>
            <h3 style={{ marginBottom: "20px" }}>👑 Super Admin Control: Manage Sub-Admins</h3>
            <form onSubmit={handleAddAdmin} style={styles.formGroup}>
              <h4 style={{ marginBottom: "12px" }}>Create New Sub-Admin</h4>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <input type="text" placeholder="New Admin ID" value={newAdminId} onChange={(e) => setNewAdminId(e.target.value)} style={styles.input} />
                <input type="password" placeholder="Password / PIN" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} style={styles.input} />
                <button type="submit" style={styles.btnSuccess}>Add Admin</button>
              </div>
            </form>

            <h4>Current Sub-Admins List</h4>
            {loadingAdmins ? <p>Loading...</p> : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Admin ID</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {adminList.length === 0 ? (
                    <tr><td colSpan="3" style={{ ...styles.td, textAlign: "center" }}>No sub-admins created yet.</td></tr>
                  ) : (
                    adminList.map((admin) => (
                      <tr key={admin.docId}>
                        <td style={styles.td}>{admin.adminId}</td>
                        <td style={styles.td}><span style={{ padding: "3px 8px", backgroundColor: "#f1f5f9", borderRadius: "4px", fontSize: "12px" }}>Sub-Admin</span></td>
                        <td style={styles.td}>
                          <button onClick={() => handleDeleteAdmin(admin.docId)} style={{ backgroundColor: "#ef4444", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;