const dgram = require("dgram");
const client = dgram.createSocket("udp4");
const option = process.argv.splice(2)

const SERVER_PORT = Number(option[0]) || 9001
const SERVER_ADDR = option[1] || "YOUR_SERVER_IP"

let self = {
    localIP: "127.0.0.1",
    localPORT: 6677,
    remoteIP: void 0,
    remotePORT: void 0
}
let sendMSG = {
    ip: "",
    port: ""
}

let alive = {}
let time_v = void 0;

client.bind(self.localPORT)

client.on("message", (message, rinfo) => {
    console.log(`[${rinfo.address}:${rinfo.port}]: ${message.toString()}`)
    let msg = message.toString()
    getMessage(rinfo, msg)
})

client.on("listening", (res) => {
    self.localIP = client.address().address
    self.localPORT = client.address().port
    console.log(`start to listening: ${self.localIP}:${self.localPORT}`)

    // 发送一条 init 消息
    client.send(JSON.stringify({
        // type: init | heart | msg | action
        type: "init",
        group: "R",
    }), SERVER_PORT, SERVER_ADDR)

    // 加入心跳包
    alive[`${SERVER_ADDR}:${SERVER_PORT}`] = { IP: SERVER_ADDR, PORT: SERVER_PORT }

    heart()
    keyInput()

    setTimeout(() => {
        client.send(JSON.stringify({
            type: "want_to_link",
            data: { group: "L" }
        }), SERVER_PORT, SERVER_ADDR)
    }, 3000);
})


client.on("close", (res) => {
    console.log("close", res);
})

client.on("error", (err) => {
    console.log("error", err);
})

let getMessage = (rinfo, data) => {
    const IP = rinfo.address
    const PORT = rinfo.port
    try {
        let res = JSON.parse(data.toString())
        if (res.type == "heart") {
            return
        }
        else if (res.type == "init") {
            self.remoteIP = res.data.ip
            self.remotePORT = res.data.port
        }
        else if (res.type == "tolink") {
            sendMSG.ip = res.data.ip
            sendMSG.port = Number(res.data.port)
            console.log(sendMSG)
            function send_init() {
                client.send(JSON.stringify({
                    type: "init",
                    data: { group: "R" }
                }), res.data.port, res.data.ip)
            }
            
            setTimeout(() => {
                time_v = setInterval(send_init, 500)
            }, 1500);
        }
        else if (res.type == "msg") {
            if (res.data.msg == "link success") {
                console.log("link success", IP, PORT)
                console.log("%%%%*#@#*@#&$(@#$&#(*$&@#(")
                console.log("link success", IP, PORT)
                alive[`${IP}:${PORT}`] = { IP, PORT }
                clearInterval(time_v)
            }
        }
        else {

        }
    } catch (error) {
        console.log(error)
    }

}


let keyInput = () => {
    console.log("回车发送消息：");
    process.stdin.on('data', data => {
        let inputData = data.toString().trim()
        console.log(`--> ${sendMSG.port}:${sendMSG.ip}`,inputData)
        client.send(inputData, sendMSG.port, sendMSG.ip);
    })
}
let heart = () => {
    setInterval(() => {
        for (const key in alive) {
            if (Object.hasOwnProperty.call(alive, key)) {
                const item = alive[key];
                client.send(JSON.stringify({
                    type: "heart",
                }), item.PORT, item.IP)
            }
        }
    }, 1500)
}
// 192.168.0.100,9001,{"type": "want_to_link", "data": { "ip": "192.168.0.100", "port": 6688 }}