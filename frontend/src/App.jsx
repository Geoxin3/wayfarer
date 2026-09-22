import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Destinations from "./pages/Destinations";
import DestinationDetails from "./pages/DestinationDetails";
import AdminLogin from "./admin/AdminLogin";
import AdminHome from "./admin/AdminHome";
import MyTrips from "./pages/MyTrip";
import PlanTrip from "./pages/PlanTrip";
import TripDetails from "./pages/TripDetails";

  function App() {
    return (
      <Routes>
          <Route path="/" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route path="/home" element={<Home />} />

          <Route path="/destinations" element={<Destinations />} />

          <Route path="/destinations/:id" element={<DestinationDetails />} />

          <Route path="/admin" element={<AdminLogin />} />

          <Route path="/admin/home" element={<AdminHome />} />

          <Route path="/trips" element={<MyTrips />} />

          <Route path="/trips/plan" element={<PlanTrip />} />

          <Route path="/trips/:tripId" element={<TripDetails />} />
      </Routes>
    );
  }

  export default App 