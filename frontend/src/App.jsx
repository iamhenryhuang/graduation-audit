import { Navigate, Route, Routes } from "react-router-dom";
import { useStudent } from "./context/student";
import AppLayout from "./layout/AppLayout";
import AudioCues from "./components/AudioCues";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Audit from "./pages/Audit";
import GPA from "./pages/GPA";

export default function App() {
  const { studentId } = useStudent();

  return (
    <>
      {studentId ? (
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/gpa" element={<GPA />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      ) : (
        <Upload />
      )}
      <AudioCues />
    </>
  );
}
