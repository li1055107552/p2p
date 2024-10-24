const dgram = require("dgram");
const server = dgram.createSocket('udp4')

const option = process.argv.splice(2)
const SERVER_PORT = Number(option[0]) || 9001
const SERVER_ADDR = option[1] || "YOUR_SERVER_IP"

let self = {
    localIP: "127.0.0.1",
    localPORT: 6688,
    remoteIP: void 0,
    remotePORT: void 0
}
server.bind(self.localPORT)

let alive = {}

server.on("listening", () => {
    console.log(`start to listening: ${server.address().address}:${server.address().port}`)

    self.localIP = server.address().address
    self.localPORT = server.address().port

    // 发送一条 init 消息
    server.send(JSON.stringify({
        // type: init | heart | msg | action
        type: "init",
        group: "L",
    }), SERVER_PORT, SERVER_ADDR)

    // 加入心跳包
    alive[`${SERVER_ADDR}:${SERVER_PORT}`] = { IP: SERVER_ADDR, PORT: SERVER_PORT }

    heart()

    // console.log("回车发送消息：");
    // process.stdin.on('data', data => {
    //     let inputData = data.toString().trim()
    //     let arr = inputData.split(",")
    //     let sendIP = arr[0]
    //     let sendPort = arr[1]
    //     let sendData = arr[2]
    //     server.send(sendData.toString(), sendPort, sendIP);
    // })
})

server.on("message", (message, rinfo) => {
    console.log(`[${rinfo.address}:${rinfo.port}]: ${message.toString()}`)
    let msg = message.toString()
    getMessage(rinfo, msg)
})

server.on("close", (res) => {
    console.log("close", res);
})

server.on("error", (err) => {
    console.log("error", err);
})

let getMessage = (rinfo, data) => {
    const IP = rinfo.address
    const PORT = rinfo.port
    try {
        let res = JSON.parse(data.toString())
        if (res.type == "heart") { return }
        else if (res.type == "init") {
            if (Object.hasOwnProperty.call(alive, `${IP}:${PORT}`)) {
                server.send(JSON.stringify({
                    type: "msg",
                    data: { msg: "link success" }
                }), PORT, IP)
            }
            else {
                alive[`${IP}:${PORT}`] = { IP, PORT }
                console.log(alive)
            }
        }
        else if (res.type == "info") {
            self.remoteIP = res.data.ip
            self.remotePORT = res.data.port
        }
        else if (res.type == "tolink") {
            server.send(JSON.stringify({
                type: "init",
                data: { group: "L" }
            }), res.data.port, res.data.port)
        }
        else if (res.type == "punchHole") {
            punchHole(res.data.ip, res.data.port)
        }
        else {

        }
    } catch (error) {
        console.log(`[${IP}:${PORT}]: ${data.toString()}`)
        server.send(`reverse:${data.toString()}`, PORT, IP); return;
    }


}

let heart = () => {
    setInterval(() => {
        for (const key in alive) {
            if (Object.hasOwnProperty.call(alive, key)) {
                const item = alive[key];
                server.send(JSON.stringify({
                    type: "heart",
                }), item.PORT, item.IP)
            }
        }
    }, 1500)
}
let punchHole = (ip, port) => {
    function send(_ip, _port) {
        server.send(JSON.stringify({
            type: "init",
            data: { group: "L", action: "punchHole" }
        }), _port, _ip)
    }

    for (let i = 0; i < 65536; i++) {
        send(ip, port + i)
        console.log(`punchHole ${ip}:${port + i}`)
    }
}