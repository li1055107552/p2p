const dgram = require("dgram");

const option = process.argv.splice(2)

let localPORT = 6677
const SERVER_PORT = option[0] || 9001
const SERVER_ADDR = option[1] || "YOUR_SERVER_IP"

let localInfo = ""
let serverInfo = ""

let timeout = setInterval(() => {
    createClient()
}, 1000)

let getConnect = (client) => {
    console.log(`与${serverInfo}连接成功。`);

    client.send("")

    // process.stdin.on('data', data => {
    //     let sendData = data.toString().trim()
    //     client.send(sendData);
    // })
}

let getMessage = (client, data, rinfo) => {
    console.log(`[${rinfo.address}:${rinfo.port}]:${data.toString()}`)

    let res = JSON.parse(data.toString())
    if (res.msg == "wait") {

    }
    if (res.msg == "toClient") {
        let second = res.second
        createNewClient(second.addr, second.port)
        client.close()
    }
    if (res.msg == "toServer") {
        let first = res.first
        createServer(first.addr, first.port)
        client.close()
    }

}

function createClient() {

    const client = dgram.createSocket("udp4");
    try {

        client.bind(localPORT, "", () => {
            clearInterval(timeout)
        })

        client.connect(SERVER_PORT, SERVER_ADDR)

        client.on('connect', () => getConnect(client))

        client.on('message', (data, rinfo) => {
            getMessage(client, data, rinfo)
        })

        client.on("listening", (res) => {
            localInfo = `[${client.address().address}:${client.address().port}]`
            serverInfo = `[${SERVER_ADDR}:${SERVER_PORT}]`
            console.log(`${localInfo} - ${serverInfo}`);
            // client.send(`${localInfo}-已连接-serverInfo`,SERVER_PORT,SERVER_ADDR)
        })

        client.on("close", (res) => {
            // console.log("close", "正在关闭");
        })

        client.on("error", (err) => {
            console.log("error", "发生一个错误");
            console.log("正在重连...");
            localPORT++
            // createClient()
        })

    } catch (error) {
        console.log("错啦！！！")
        console.log(error)
    }

}

function createNewClient(serverAddr, serverPort) {

    const client = dgram.createSocket("udp4");

    try {

        client.bind(localPORT)

        client.connect(serverPort, serverAddr)

        client.on('connect', () => {
            console.log(`与${serverInfo}连接成功。`);
            client.send(`${localInfo}`)
            console.log("回车发送消息：");

            process.stdin.on('data', data => {
                let sendData = data.toString().trim()
                console.log(`${localInfo}: ${sendData}`);
                client.send(sendData);
            })
        })

        client.on('message', (data, rinfo) => {
            console.log(`[${rinfo.address}:${rinfo.port}]: ${data.toString()}`)
        })

        client.on("listening", (res) => {
            localInfo = `[${client.address().address}:${client.address().port}]`
            serverInfo = `[${serverAddr}:${serverPort}]`
            console.log(`${localInfo} - ${serverInfo}`);
            // client.send(`${localInfo}-已连接-serverInfo`,SERVER_PORT,SERVER_ADDR)
        })

        client.on("close", (res) => {
            console.log("close", res);
        })

        client.on("error", (err) => {
            console.log("error", "发生一个错误");
            console.log("正在重连...");
            localPORT++
            // createClient()
        })

    } catch (error) {
        console.log("错啦！！！")
        console.log(error)
    }
}

function createServer(clientAddr, clientPort) {

    const server = dgram.createSocket('udp4')
    server.bind(localPORT)

    // 开洞
    server.send("", clientPort, clientAddr)
    // 通知服务端准备好了
    server.send("ready", SERVER_PORT, SERVER_ADDR)

    server.on("listening", () => {
        console.log(`start to listening: ${server.address().address}:${server.address().port}`)

        console.log("回车发送消息：");
        process.stdin.on('data', data => {
            let sendData = data.toString().trim()
            console.log(`${localInfo}: ${sendData}`);
            server.send(sendData, clientPort, clientAddr);
        })
    })

    server.on("connect", (res) => {
        console.log("connect:", res);
    })

    server.on("message", (msg, rinfo) => {
        console.log(`[${rinfo.address}:${rinfo.port}]: ${msg.toString()}`)
        let message = msg.toString()
        // server.send(message, clientPort, clientAddr)
    })

    server.on("close", (res) => {
        console.log("close", res);
    })

    server.on("error", (err) => {
        console.log("error", err);
    })
}
