import React from "react";
import './Header.css';

const Header = ({ title, className }) => {
    return (
        <header className={className}>
            <h1>{title}</h1>
        </header>
    );
};

export default Header;
