import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './index.css';
import App from './App';
import Start from './pages/Start/Start';
import DashBoard from './pages/DashBoard/DashBoard';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <Routes>
      <Route path='*' element={<App />} >
        <Route path='*' element={<Start />} />
        <Route path='dash/:phone' element={<DashBoard />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
