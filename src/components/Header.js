import React from 'react';
import { Link } from 'react-router-dom';


const Header = () => {
    return (
        <header className="bg-gray-800 text-white py-4">
        <div className="return">
          <Link to="/">홈으로 돌아가기</Link>
        </div>
        </header>
    );
};

export default Header;
