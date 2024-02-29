const dgram = require('dgram')

const server = dgram.createSocket('udp4')

let first = ""
let second = ""
let alive = {}

server.bind(9001)

server.on("listening", () => {
    console.log(`start to listening: ${server.address().address}:${server.address().port}`)
})

server.on("connect", (res) => {
    console.log("connect:", res);
})

server.on("message", (message, rinfo) => {
    let msg = message.toString()
    console.log(`[${rinfo.address}:${rinfo.port}]:${msg.toString()}`)

    let count = Object.keys(alive).length
    if (count == 0) {
        first = {
            addr: rinfo.address,
            port: rinfo.port
        }
        server.send(`{"res": "wait"}`, rinfo.port, rinfo.address)
    }
    else if(count == 1){
        second = {
            addr: rinfo.address,
            port: rinfo.port
        }
        let res = {
            first,
            msg: "toServer"
        }
        server.send(JSON.stringify(res), rinfo.port, rinfo.address)
    }
    alive[`${rinfo.address}:${rinfo.port}`] = {
        addr: rinfo.address,
        port: rinfo.port
    }
    console.log(alive)

    if (msg == "ready") {
        let res = {
            second,
            msg: "toClient"
        }
        server.send(JSON.stringify(res), first.port, first.addr)
        alive = {}
    }
    
    
})

server.on("close", (res) => {
    console.log("close", res);
})

server.on("error", (err) => {
    console.log("error", err);
})