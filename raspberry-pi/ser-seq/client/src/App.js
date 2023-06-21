import Header from "./components/Header";
import CpuUsage from "./components/CPU";
import DiskUsage from "./components/Disk";
import Temperature from "./components/Temperature";
import Chart from "./components/Chart";
import { useState } from "react";
import './App.css'
import logo from "./assets/scp-logo.png";

var temp = 0;
var disk = 0;
var cpu = 0;
var platform = "";

const tempArray = [];


const socket = new WebSocket(
    `${window.location.protocol === "https:" ? "wss" : "ws" }://${window.location.host}`,
    "protocolOne"
);

function App() {
    const [,setPiState] = useState(0);

    socket.onmessage = function(event) {
        console.log(event);
        setPiState(Math.random() * 60);
        var obj = JSON.parse(event.data);
        var hold = JSON.parse(obj);

        temp = hold.cpu_temp;
        disk = hold.disk_usage;
        cpu = hold.load_avg;
        platform = hold.platform;

        if (tempArray.length < 7 && !isNaN(temp)) {
            tempArray.push(temp);
        } else if(!isNaN(temp)) {
            tempArray.splice(0, 1);
            tempArray.push(temp);
        }
    }

    return (
        <div className="content">
            <Header title={"RaspberryPi: " + platform} className="header"/>
            <div className="container">
                <Chart title="CPU Usage" chart={<CpuUsage CPUData={[parseFloat(cpu), 100-parseFloat(cpu)]}/>}/>
                <Chart title="CPU Temperature" chart={<Temperature tempData={tempArray} />} />
                <Chart title="Disk Usage" chart={<DiskUsage diskData={[parseFloat(disk), 100-parseFloat(disk)]}/>}/>
            </div>
            <div className="powered"><a href="https://scramjet.org">Powered by Scramjet Cloud Platform <img alt="Scramjet Cloud Platform" src={logo}/></a></div>
        </div>
    );
}

export default App;
