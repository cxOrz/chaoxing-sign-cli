import React from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import { useNavigate, Outlet } from 'react-router-dom';
import './App.css';

function App() {
  const navigate = useNavigate();
  return (
    <div className="App">
      <ButtonBase onClick={() => { navigate('/', { replace: true }); }} sx={{
        border: 10,
        borderRadius: '50%',
        height: '40px',
        width: '40px',
        borderColor: 'primary.main',
        position: 'absolute',
        top: 28,
        left: 32
      }}></ButtonBase>
      <Outlet />
    </div>
  );
}

export default App;
