import { useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  async function getBackendMessage() {
    try {
      const response = await fetch("http://localhost:8000/");
      const data = await response.json();

      setMessage(data.message);
    } catch (error) {
      console.error(error);
      setMessage("Failed to connect to backend.");
    }
  }

  return (
    <div>
      <h1>Wayfarer</h1>
      
      <button onClick={getBackendMessage}>
        Get Backend Message
      </button>

      <p>{message}</p>
    </div>
  );
}

export default App;