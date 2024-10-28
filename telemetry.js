const tableHead = ['id', 'timestamp', 'value'];
const historyEndpoint = 'http://localhost:8080/history';
const realtimeEndpoint = 'ws://localhost:8080/realtime';
const fifteenMinutes = 15 * 60 * 1000;
var sortingParam = { isSortEnabled: false, isAsc: false};

var webSocket = new WebSocket(`${realtimeEndpoint}`);

var staticData = [{"timestamp":1561848196179,"value":241.70507498990156,"id":"pwr.c"}, {"timestamp":1561848197181,"value":238.10697171005611,"id":"pwr.v"},{ "timestamp":1561848198182,"value":233.80084678058353,"id":"pwr.v"}];

var telemetryData = [];
var historyData = [];

/** History Endpoint Query **/
function generateHistoryQuery(pointId) { // Last 15 minutes
    const start = Date.now() - (fifteenMinutes);
    const end = Date.now();
    return `${historyEndpoint}/${pointId}?start=${start}&end=${end}`;
}

const getHistory = (pointId) => {
    fetch(generateHistoryQuery(pointId)).then(response => response.json()).then((data) => setHistoryData(data));
    return historyData;
};

const getHistoryData = () => {
    return historyData;
}

const setHistoryData = (data) => {
    historyData = data;
}

function getHistorialSortedData(isAsc) {
    return historyData.sort(function (a, b) {
        return isAsc ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });
}

/** Socket Realtime Data **/

const openWebSocket = () => {
    webSocket = new WebSocket(`${realtimeEndpoint}`);
    console.log('opened');
    subscribeToData('pwr.v', 'pwr.c');
};

const subscribeToData = (...pointIds) => {
    webSocket.onopen = function() {
        // Web Socket is connected, send data using send()
        pointIds.map((pointId) => {webSocket.send(`subscribe ${pointId}`);
        alert(`Message is sent ${pointId}...`);});
        
    };
    webSocket.onmessage = function (evt) {
        var received_msg = evt.data;
        telemetryData.push(JSON.parse(received_msg));
        // alert("Message is received: ", received_msg);
    };
};

const unsubscribeToData = (pointId) => {
    webSocket.send(`unsubscribe ${pointId}`);
    alert(`Unsubscribed to ${pointId}...`);
};

const unsubscribeAll = () => {
    webSocket.close();
    alert("Connection is closed...");
};

webSocket.onclose = function() {
    // websocket is closed.
    webSocket.send(`unsubscribe pwr.c`);
    webSocket.send(`unsubscribe pwr.v`);
    alert("Connection is closed...");
};

/** Get Realtime Data: telemetryData **/
function getTelemetry(data = telemetryData) {
    return sortingParam.isSortEnabled ? getSortedData() : data;
}

function getSortedData(isAsc = sortingParam.isAsc) {
    sortingParam.isSortEnabled = true;
    sortingParam.isAsc = isAsc;
    return telemetryData.sort(function (a, b) {
        return isAsc ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });
}

function selectPwrv() {
    subscribeToData('pwr.v');
    unsubscribeToData('pwr.c');
    return telemetryData.filter(function (a, b) {
        return a.id === 'pwr.v';
    });
}

function selectPwrc() {
    subscribeToData('pwr.c');
    unsubscribeToData('pwr.v');
    return telemetryData.filter(function (a, b) {
        return a.id === 'pwr.c';
    });
}

function selectBoth() {
    subscribeToData('pwr.c');
    subscribeToData('pwr.v');
    return telemetryData;
}

/** History or Realtime Data Table **/

/* Initialize the data table with the historical or realtime data */
const initTable = (getDataOrderCall) => {
    const table = document.querySelector('#space-data-table tbody');
    table.innerHTML = '';
    const getTelemetryData = getDataOrderCall();
    populateTableWithRealTimeData(table, getTelemetryData);
};

/* Populate the table with data values */
const populateTableWithRealTimeData = (table, getTelemetryData) => {
    for (let i=0; i < getTelemetryData.length; i++) {
        var row = table.insertRow(0);
        let dataPoint = getTelemetryData[i];
        let dataPointArray = Object.entries(getTelemetryData[i]);
        for (let j=0; j < dataPointArray.length; j++) { // {"timestamp":1561848196179,"value":241.70507498990156,"id":"pwr.v"}
            // id, timestamp, value
            row.insertCell(j).innerHTML = dataPoint[tableHead[j]];
        }
    }
};
