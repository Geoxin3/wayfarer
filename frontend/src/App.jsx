import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Destinations from "./pages/Destinations";
import DestinationDetails from "./pages/DestinationDetails";

  function App() {
    return (
      <Routes>
          <Route path="/" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route path="/home" element={<Home />} />

          <Route path="/destinations" element={<Destinations />} />

          <Route path="/destinations/:id" element={<DestinationDetails />} />
      </Routes>
    );
  }

  export default App 