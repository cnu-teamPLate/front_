import React from 'react';


const Footer = () => {
    return (
        <footer>
        <p>© 2024 CNU</p>
        <div className="footer-links">
          <a href="/about">About Us</a> | <a href="/contact">Contact</a> |{' '}
          <a href="/privacy">Privacy Policy</a>
        </div>
      </footer>
    );
};

export default Footer;
