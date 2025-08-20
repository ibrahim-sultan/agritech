import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="layout">
      <Navbar currentPath={location.pathname} />
      <main className="layout__content">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;