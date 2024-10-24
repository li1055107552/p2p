const dgram = require('dgram')
const server = dgram.createSocket('udp4')

let alive = {}
let GROUP = new Map()

server.bind(9001)

server.on("listening", () => {
    console.log(`start to listening: ${server.address().address}:${server.address().port}`)

    setInterval(() => {
        for (const key in alive) {
            if (Object.hasOwnProperty.call(alive, key)) {
                const item = alive[key];
                server.send(JSON.stringify({ type: "heart" }), item.PORT, item.IP)
            }
        }
    }, 1500);

    // process.stdin.on('data', data => {
    //     let inputData = data.toString().trim()
    //     let arr = inputData.split(",")
    //     let sendIP = arr[0]
    //     let sendPort = arr[1]
    //     let sendData = arr[2]
    //     server.send(sendData, sendPort, sendIP);
    // })
})

server.on("message", (message, rinfo) => {
    let msg = message.toString()
    console.log(`[${rinfo.address}:${rinfo.port}]:${msg.toString()}`)
    const IP = rinfo.address
    const PORT = rinfo.port

    try {
        msg = JSON.parse(msg)
        if (!Object.hasOwnProperty.call(msg, "type")) { server.send(JSON.stringify({ type: "err", msg: "miss type" }), PORT, IP); return; }

        if (msg.type == "heart")
            return
        else if (msg.type == "init") {
            let label = `${IP}:${PORT}}`
            let group = msg.group || "default"
            alive[label] = { IP, PORT, group }

            if (!GROUP.has(group)) {
                GROUP.set(group, [])
            }
            GROUP.get(group).push({ label, IP, PORT })

            server.send(JSON.stringify({
                type: "info",
                data: { ip: IP, port: PORT, group }
            }), PORT, IP)
        }
        else if (msg.type == "want_to_link") {
            if (!Object.hasOwnProperty.call(msg, "data")) {
                server.send(JSON.stringify({ type: "err", msg: "miss data" }), PORT, IP);
                return;
            }
            if (!Object.hasOwnProperty.call(msg.data, "group")) {
                server.send(JSON.stringify({ type: "err", msg: "miss group" }), PORT, IP);
                return;
            }

            let item = GROUP.has(msg.data.group) ? GROUP.get(msg.data.group)[0] : false
            if (!item) {
                server.send(JSON.stringify({
                    type: "tolink",
                    data: { has_group: false }
                }), PORT, IP)
            }
            else {
                console.log(item)
                // // 通知被连接的一方，看是否同意
                // server.send(JSON.stringify({
                //     type: "want_to_link",
                //     data: { ip: IP, port: PORT }
                // }), item.port, item.addr)

                // 通知被连接的一方打洞
                server.send(JSON.stringify({
                    type: "punchHole",
                    data: { ip: IP, port: PORT }
                }), item.PORT, item.IP)

                setTimeout(() => {
                    
                // 通知发起连接
                server.send(JSON.stringify({
                    type: "tolink",
                    data: { has_group: true, ip: item.IP, port: item.PORT }
                }), PORT, IP)
                }, 1000);
            }
        }
        else {
            server.send(JSON.stringify({ type: "err", msg: "wrong type" }), PORT, IP);
        }

    } catch (error) {
        console.log(error)
        // server.send(`reverse:${msg.toString()}`, PORT, IP); return;
    }

})

server.on("close", (res) => {
    console.log("close", res);
})

server.on("error", (err) => {
    console.log("error", err);
})