import { useState, useEffect } from "react";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeLogin from "./pages/EmployeeLogin";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

function App() {
  const [userMode, setUserMode] = useState("select"); 
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [adminId, setAdminId] = useState("");
  const [pin, setPin] = useState("");
  const [currentAdminRole, setCurrentAdminRole] = useState(""); // super_admin या admin
  const [dbAdmins, setDbAdmins] = useState([]);

  // Firestore से एडमिन्स की लिस्ट लोड करना
  const loadAdmins = async () => {
    try {
      const snapshot = await getDocs(collection(db, "admins"));
      const list = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setDbAdmins(list);
    } catch (error) {
      console.error("Error loading admins:", error);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, [userMode]);

  const handleAdminLogin = () => {
    // 1. आप यानी Nitesh हमेशा Super Admin रहेंगे (हार्डकोडेड & सुरक्षित)
    if (adminId === "Nitesh" && pin === "Nitesh@01") {
      setCurrentAdminRole("super_admin");
      setUserMode("admin_dash");
      return;
    }

    // 2. बाकी एडमिन्स को Database (Firestore) में चेक करना
    const matchedAdmin = dbAdmins.find(
      (a) => a.adminId === adminId && a.password === pin
    );

    if (matchedAdmin) {
      setCurrentAdminRole("admin");
      setUserMode("admin_dash");
    } else {
      alert("Invalid Admin ID or Password");
    }
  };

  if (userMode === "select") {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h1>AI Mind Technologies Pvt. Ltd.</h1>
        <h2>Attendance Management System</h2>
        <div style={{ marginTop: "40px", display: "flex", justifyContent: "center", gap: "20px" }}>
          <button onClick={() => setUserMode("admin_login")} style={{ padding: "15px 30px", fontSize: "16px", cursor: "pointer", backgroundColor: "#333", color: "white", border: "none", borderRadius: "5px" }}>
            Admin Portal
          </button>
          <button onClick={() => setUserMode("employee_login")} style={{ padding: "15px 30px", fontSize: "16px", cursor: "pointer", backgroundColor: "#008CBA", color: "white", border: "none", borderRadius: "5px" }}>
            Employee Portal
          </button>
        </div>
      </div>
    );
  }

  if (userMode === "admin_login") {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h1>AI Mind Technologies Pvt. Ltd.</h1>
        <h2>Admin Login Portal</h2>
        <div>
          <input type="text" placeholder="Admin ID" value={adminId} onChange={(e) => setAdminId(e.target.value)} style={{ padding: "10px", width: "250px" }} />
        </div>
        <div style={{ marginTop: "10px" }}>
          <input type="password" placeholder="Password" value={pin} onChange={(e) => setPin(e.target.value)} style={{ padding: "10px", width: "250px" }} />
        </div>
        <div style={{ marginTop: "20px" }}>
          <button onClick={handleAdminLogin} style={{ padding: "10px 20px", marginRight: "10px", backgroundColor: "#4CAF50", color: "white", border: "none", cursor: "pointer", borderRadius: "4px" }}>Login</button>
          <button onClick={() => setUserMode("select")} style={{ padding: "10px 20px", backgroundColor: "#ccc", border: "none", cursor: "pointer", borderRadius: "4px" }}>Back</button>
        </div>
      </div>
    );
  }

  if (userMode === "admin_dash") {
    return (
      <div>
        <div style={{ textAlign: "right", padding: "10px 20px", backgroundColor: "#f1f1f1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Logged in as: <strong>{adminId} ({currentAdminRole === "super_admin" ? "Super Admin" : "Sub-Admin"})</strong></span>
          <button onClick={() => { setUserMode("select"); setCurrentAdminRole(""); }} style={{ backgroundColor: "#f44336", color: "white", padding: "6px 12px", border: "none", cursor: "pointer", borderRadius: "4px" }}>
            Logout Admin Panel
          </button>
        </div>
        <AdminDashboard role={currentAdminRole} />
      </div>
    );
  }

  if (userMode === "employee_login") {
    return (
      <div>
        <div style={{ padding: "20px" }}>
          <button onClick={() => setUserMode("select")} style={{ padding: "5px 10px", backgroundColor: "#ccc", border: "none", cursor: "pointer" }}>Back to Main</button>
        </div>
        <EmployeeLogin onLoginSuccess={(empData) => {
          setCurrentEmployee(empData);
          setUserMode("employee_dash");
        }} />
      </div>
    );
  }

  if (userMode === "employee_dash") {
    return (
      <EmployeeDashboard 
        employee={currentEmployee} 
        onLogout={() => {
          setCurrentEmployee(null);
          setUserMode("select");
        }} 
      />
    );
  }

  return null;
}

export default App;