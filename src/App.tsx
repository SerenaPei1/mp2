import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import ListView from './components/ListView';
import GalleryView from './components/GalleryView';
import DetailView from './components/DetailView';

function App() {
  return (
    <Router basename="/mp2">
      <div className="App">
        <nav className="navigation">
          <div className="nav-container">
            <Link to="/" className="nav-brand">
              MovieDB Explorer
            </Link>
            <div className="nav-links">
              <Link to="/" className="nav-link">List View</Link>
              <Link to="/gallery" className="nav-link">Gallery View</Link>
            </div>
          </div>
        </nav>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ListView />} />
            <Route path="/gallery" element={<GalleryView />} />
            <Route path="/movie/:id" element={<DetailView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
