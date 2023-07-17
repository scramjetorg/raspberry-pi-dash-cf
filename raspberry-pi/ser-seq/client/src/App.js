import Header from "./components/Header";
import OnOff from "./components/OnOff";
import Value from "./components/Value";
import Chart from "./components/Chart";
import { useState } from "react";
import './App.css'
import logo from "./assets/scp-logo.png";
import Button from "./components/Button";

var temperature = 0;
var humidity = 0;
var led = 0;
var lastUpdate = 0;
var platform = "";

const socket = new WebSocket(
    `${window.location.protocol === "https:" ? "wss" : "ws" }://${window.location.host}`,
    "protocolOne"
);



function App() {
    const [state,setPiState] = useState({
        temperature,
        humidity,
        led,
        platform,
        lastUpdate
    });

    socket.onmessage = function(event) {
        console.log(event);
        var obj = JSON.parse(event.data);
        const { ts, "led:red": led, temperature, humidity, platform } = JSON.parse(obj);
        
        setPiState({
            temperature,
            humidity,
            platform,
            led,
            lastUpdate: new Date(ts).toLocaleString()
        });
    }

    function ledMessage(state) {
        socket.send(`led:red:${state}`);
    }

    return (
        <div className="content">
            <Header title={"RaspberryPi: " + state.platform} className="header"/>
            <div className="container">
                <Chart title="Led On" chart={<Button title="Press" callback={() => ledMessage("on")} />} />
                <Chart title="Led Off" chart={<Button title="Press" callback={() => ledMessage("off")} />} />
                <Chart title="Led Toggle" chart={<Button title="Press" callback={() => ledMessage("toggle")} />} />
            </div>
            <div className="container">
                <Chart title="Temperature" chart={<Value tempData={temperature} label="Temperature" min={18} max={30} />}/>
                <Chart title="Humidity" chart={<Value tempData={humidity} label="Humidity" min={30} max={60} />} />
                <Chart title="Led State" chart={<OnOff value={state.led} label="Led State" />}/>
            </div>
            <div className="powered"><a href="https://scramjet.org">Powered by Scramjet Cloud Platform <img alt="Scramjet Cloud Platform" src={logo}/></a></div>
        </div>
    );
}

export default App;
