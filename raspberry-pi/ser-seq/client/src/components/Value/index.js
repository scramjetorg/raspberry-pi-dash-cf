import React from "react";
import "./Value.css";

const Temperature = ({ 
    value,
    min = 20,
    max = 90
}) => {
    const cls = value > max ? "max"  : value < min ? "min"  : `mid`;
    const caption = parseInt(value * 100) / 100;

    return (
        <div className={`state state-${cls}`}>{caption}</div>
    );
};

export default Temperature;
