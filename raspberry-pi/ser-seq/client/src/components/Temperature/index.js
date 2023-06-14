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
    y:
      {
        min: 36,
        max: 50,
        stepSize: 1,
      }
  },
    };
    const labels = ["", "", "", "", "", "", ""];
    const data = {
        labels,
        datasets: [
            {
                label: "CPU Temperature [C\u00B0]",
                data: tempData.map((data) => data),
                borderColor: "rgba(23, 112, 201, 0.9)",
                backgroundColor: "rgba(23, 112, 201, 0.8)",
            }
        ],
    };

    return (
        <Line data={data} options={options} width={"60%"} height="300px"/>
    );
};

export default Temperature;
