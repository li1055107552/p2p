
var net = require('net')

const option = process.argv.splice(2)

const SERVER_IP = option[0] || 'YOUR_SERVER_IP'
const SERVER_PORT = option[1] || 25836
const LOCAL_PORT = option[2] || 6688

let holeIP;
let holePort;
let step = null;

function connServer() {
    var client = net.createConnection({
        host: SERVER_IP,
        port: SERVER_PORT,
        localPort: LOCAL_PORT,
    });

    // 绑定connet事件，建立连接成功触发
    client.on("connect", function () {
        console.log('connect: 与服务器连接成功。');
        let req = {
            type: "clientInit",
            msg: {
                from: "ClientA",
                to: "ClientB"
            }
        }
        client.write(JSON.stringify(req))
    });
    client.on('ready', () => {
        console.log("ready: 通信准备就绪")
    })

    // 绑定data事件，接受服务器发送过的数据
    client.on('data', function (data) {
        let res = JSON.parse(data) || data
        step = null
        if (res.type === "heart") {
            // console.log("heart", res.msg)
            console.log(`${client.remoteAddress}:${client.remotePort}`, res.msg)
        }
        else if (res.type === "holeMsg") {
            holeIP = res.msg.holeIP
            holePort = res.msg.holePort
        }
        else if (res.type === "reqHole") {
            // 请求
            step = "reqHole"
        }
        else {
            console.log("未知数据")
            console.log(res)
            client.end()
        }

    });
    client.on('end', () => {
        console.log("end: 客户端关闭");
    })
    client.on('close', () => {
        console.log('close: FIN')
        if (step === "reqHole") {
            reqHole()
        }
    })
    client.on('error', function (err) {
        console.log("error: ", err);
    })
}

function reqHole() {
    console.log("开始请求洞口");
    var client = net.createConnection({
        host: holeIP,
        port: holePort,
        localPort: option[2] || 6688,
    });

    // 绑定connet事件，建立连接成功触发
    client.on("connect", function () {
        console.log('connect: 与服务器连接成功。');
        let msg = {
            from: "ClientA"
        }
        client.write(JSON.stringify(msg))
        // 键盘输入发送消息
        // process.stdin.on('data', data => {
        //     client.write(JSON.stringify({
        //         type: "msg",
        //         msg: data.toString().trim()
        //     }))
        // })
    });

    client.on('ready', () => {
        console.log("ready: 通信准备就绪")
    })

    // 绑定data事件，接受服务器发送过的数据
    client.on('data', function (data) {
        let res = JSON.parse(data) || data
        if (res.type === "heart") {
            console.log(`${client.remoteAddress}:${client.remotePort} heart`)
        }
        else if(res.type === "msg"){
            console.log(`${client.remoteAddress}:${client.remotePort} ${res.msg}`)
        }
        else{
            console.log(res)
        }
    });

    client.on('end', () => {
        console.log("end: 客户端关闭");
    })

    client.on('close', () => {
        console.log('close: FIN')
    })

    // client.on('error', function (err) {
    //     console.log("error: ", err);
    // })
}

connServer()