import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PageList from './components/PageList';
import PageEditor from './components/PageEditor';
import PageSummary from './components/PageSummary';
import TagManager from './components/TagManager';
import Header from './components/Header';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<PageList />} />
            <Route path="/summary" element={<PageSummary />} />
            <Route path="/tags" element={<TagManager />} />
            <Route path="/page/new" element={<PageEditor />} />
            <Route path="/page/:id" element={<PageEditor />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;