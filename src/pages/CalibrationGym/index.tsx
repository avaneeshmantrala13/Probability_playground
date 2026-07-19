import { Navigate, Route, Routes } from "react-router-dom";
import { Home } from "./Home";
import { Drill } from "./Drill";

/**
 * Calibration Gym section. Mounted in App.tsx at `/calibration-gym/*` so all
 * gym routes are namespaced here. The index route is a placeholder that will
 * later become the Candy-Crush-style station map; `drill` is the ported
 * calibration drill loop.
 */
export function CalibrationGym() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="drill" element={<Drill />} />
      <Route path="*" element={<Navigate to="/calibration-gym" replace />} />
    </Routes>
  );
}

export default CalibrationGym;
