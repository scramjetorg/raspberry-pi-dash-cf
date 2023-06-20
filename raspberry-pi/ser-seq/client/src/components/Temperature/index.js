import React from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const Temperature = ({ tempData }) => {
    const options = {
        maintainAspectRatio: false,
        scales: {
            y: {
                min: 40,
                max: 60,
                stepSize: 1,
            },
        },
        color: "#fff",
        grid: {
            color: "#fff"
        }
    };
    const labels = ["-6s", "-5s", "-4s", "-3s", "-2s", "-1s", "0"];
    const data = {
        labels,
        datasets: [
            {
                label: "CPU Temperature °C ",
                data: tempData.map((data) => data),
                borderColor: "#ff8000ff",
                backgroundColor: "#ff8000ff",
                pointStyle: 'circle',
                pointRadius: 10,
                pointHoverRadius: 15
            }
        ]
    };

    return (
        <Line data={data} options={options} width={"60%"} height="400px"/>
    );
};

export default Temperature;
