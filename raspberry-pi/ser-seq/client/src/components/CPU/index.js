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
                    "#ff8000ff",
                    "#ff800000",
                ],
                borderColor: [
                    "#ff800020",
                    "#ff8000ff",
                ],
                borderWidth: 1,
            },
        ],
    };
    const options = {
        maintainAspectRatio: false,
        color: "#fff",
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
