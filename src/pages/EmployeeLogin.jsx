import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

function EmployeeLogin({ onLoginSuccess }) {
  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState("");

  const handleLogin = async () => {
    if (!employeeId || !pin) {
      alert("Please enter both Employee ID and PIN");
      return;
    }

    try {
      // Firestore में चेक करना कि क्या यह ID और PIN मैच करते हैं
      const q = query(
        collection(db, "employees"),
        where("employeeId", "==", employeeId),
        where("pin", "==", pin)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // अगर मैच मिल गया, तो पहले कर्मचारी का डेटा निकालें
        const empDoc = querySnapshot.docs[0];
        const empData = empDoc.data();
        
        alert(`Welcome ${empData.name}`);
        onLoginSuccess(empData); // Main App को सूचित करें कि लॉगिन हो गया
      } else {
        alert("Invalid Employee ID or PIN");
      }
    } catch (error) {
      console.error(error);
      alert("Error during login");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Employee Login Portal</h2>
      
      <div style={{ marginTop: "20px" }}>
        <input
          type="text"
          placeholder="Employee ID"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          style={{ padding: "10px", width: "250px" }}
        />
      </div>

      <div style={{ marginTop: "10px" }}>
        <input
          type="password"
          placeholder="4 Digit PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          style={{ padding: "10px", width: "250px" }}
        />
      </div>

      <div style={{ marginTop: "20px" }}>
        <button 
          onClick={handleLogin}
          style={{ padding: "10px 20px", backgroundColor: "#008CBA", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default EmployeeLogin;