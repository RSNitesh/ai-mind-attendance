import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";

function Dashboard() {

  const markInDuty = async () => {
    try {
      await addDoc(collection(db, "attendance"), {
        employeeId: "EMP001",
        name: "Test Employee",
        type: "IN",
        time: new Date().toLocaleString(),
      });

      alert("IN Duty Saved Successfully");
    } catch (error) {
      console.error(error);
      alert("Error Saving Data");
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>AI Mind Technologies Pvt. Ltd.</h1>
      <h2>Employee Dashboard</h2>

      <button
        onClick={markInDuty}
        style={{
          padding: "10px 20px",
          marginTop: "20px",
          cursor: "pointer",
        }}
      >
        IN Duty
      </button>
    </div>
  );
}

export default Dashboard;