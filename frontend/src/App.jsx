import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import WorkspacePage from './components/WorkspacePage';
import './App.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/workspace/:workspaceId" element={<WorkspacePage />} />
            </Routes>
        </Router>
    );
}

export default App;
