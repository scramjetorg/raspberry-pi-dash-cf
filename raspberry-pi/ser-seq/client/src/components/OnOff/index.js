import React from "react";
import "./OnOff.css";

const OnOff = ({ label, value }) => {
    const cls = value === 1 ? "on"  : value === 0 ? "off"  : `mid`;
    const caption = value === 1 ? "On"  : value === 0 ? "Off"  : `${Math.round(value * 100)}%`;

    return (
        <div className={`onoff onoff-${cls}`}>{caption}</div>
    );
};

export default OnOff;
