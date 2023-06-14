import React from "react";
import "./Chart.css";

const Chart = ({ title, chart }) => {
    return (
        <div className="chartContainer">
            <h2>{title}</h2>
            <div className="chart">{chart}</div>
        </div>
    );
};

export default Chart;
