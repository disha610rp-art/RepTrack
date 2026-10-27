import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WorkoutProvider } from './context/WorkoutContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { RestTimer } from './components/RestTimer';
import { PlateModal } from './components/PlateModal';
import { SummaryModal } from './components/SummaryModal';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ActiveWorkout } from './pages/ActiveWorkout';
import { Programs } from './pages/Programs';
import { ProgramDetail } from './pages/ProgramDetail';
import { CalculatorSuite } from './pages/CalculatorSuite';
import { ExerciseLibrary } from './pages/ExerciseLibrary';
import { WorkoutHistory } from './pages/WorkoutHistory';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkoutProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Authentication Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Application Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workout"
                  element={
                    <ProtectedRoute>
                      <ActiveWorkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/programs"
                  element={
                    <ProtectedRoute>
                      <Programs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/programs/:id"
                  element={
                    <ProtectedRoute>
                      <ProgramDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calculators"
                  element={
                    <ProtectedRoute>
                      <CalculatorSuite />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/exercises"
                  element={
                    <ProtectedRoute>
                      <ExerciseLibrary />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <WorkoutHistory />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Global Modals & Floating Tools */}
            <RestTimer />
            <PlateModal />
            <SummaryModal />
          </div>
        </WorkoutProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
