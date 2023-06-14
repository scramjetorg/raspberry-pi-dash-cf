import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const CpuUsage = ({ CPUData }) => {
    const data = {
        labels: ["CPU load"],
        datasets: [
            {
                data: CPUData.map((data) => data),
                backgroundColor: [
                    "rgba(23, 112, 201, 0.8)",
                    "rgba(23, 112, 201, 0.3)",
                ],
                borderColor: [
                    "rgb(23, 112, 201, 255)",
                    "rgba(23, 112, 201, 0.4)",
                ],
                borderWidth: 1,
            },
        ],
    };
    const options = {
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                title: "CPU",
                callbacks: {
                    label: (contex) => {
                        return `${contex.parsed}%`
                    }
                }
            }
        }
    };

    return (
        <Doughnut data={data} options={options} height="400px" width="400px"/>
    );
};

export default CpuUsage;
