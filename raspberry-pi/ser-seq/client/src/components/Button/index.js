import React from "react";
import "./Button.css";

const Button = ({ title, callback }) => {
    return (
        <div className="button" onClick={() => callback()}>{title}</div>
    );
};

export default Button;
