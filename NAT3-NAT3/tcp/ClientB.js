
var net = require('net')

const option = process.argv.splice(2)

const SERVER_IP = option[0] || 'YOUR_SERVER_IP'
const SERVER_PORT = option[1] || 25836
const LOCAL_PORT = option[2] || 8888

let clientIP;
let clientPort;
let step = null;

function connServer() {
    let client = net.createConnection({
        host: SERVER_IP,
        port: SERVER_PORT,
        localPort: LOCAL_PORT,
    });

    // 绑定connet事件，建立连接成功触发
    client.on("connect", function () {
        console.log('connect: 与服务器连接成功。');
        let req = {
            type: "holeInit",
            msg: {
                from: "ClientA",
                to: "ClientB"
            }
        }
        client.write(JSON.stringify(req))
    });
    client.on('ready', () => {
        console.log("ready: 通信准备就绪")
        // holeOK()
    })

    // 绑定data事件，接受服务器发送过的数据
    client.on('data', function (data) {
        let res = JSON.parse(data) || data
        // console.log(res)

        if (res.type === "heart") {
            console.log(`${client.remoteAddress}:${client.remotePort} heart`)
        }
        else if (res.type === "punchHole") {
            console.log("punchHole", res.msg)
            clientIP = res.msg.clientIP
            clientPort = res.msg.clientPort
            step = "punchHole"
        }
        else {
            console.log("res.type no support:", res)
            client.destroy()
        }

    });
    client.on('end', () => {
        console.log("end: 客户端关闭");
    })
    client.on('close', () => {
        console.log('close: FIN')
        if (step === "punchHole") {
            punchHole()
        }
    })
    client.on('error', function (err) {
        console.log("error: ", err);
    })
}

/**
 * @description 打洞
 */
function punchHole() {
    console.log("punchHole");
    // 打洞
    let client = net.createConnection({
        host: clientIP,
        port: clientPort,
        localPort: option[2] || 8888,
    });

    setTimeout(() => {

        // 直接结束，释放端口
        client.destroy()

        // 开启服务，监听端口
        createServer()

        // 告知服务器已经打好洞了
        holeOK()

    }, 1000);

    client.on('close', () => {
        console.log("punchHole close")
    })
}

/**
 * @description 告知服务器已经打好洞了
 */
function holeOK() {
    let client = net.createConnection({
        host: SERVER_IP,
        port: SERVER_PORT,
        localPort: LOCAL_PORT,
    });
    // 绑定connet事件，建立连接成功触发
    client.on("connect", function () {
        console.log('holeOK connect: 与服务器连接成功。');
        let req = {
            type: "holeOK",
            msg: {
                from: "ClientA",
                to: "ClientB"
            }
        }
        client.write(JSON.stringify(req))
        client.destroy()
    });

    client.on('end', () => {
        console.log("holeOK end: 客户端关闭");
    })
    client.on('close', () => {
        console.log('holeOK close: FIN')
    })
    client.on('error', function (err) {
        console.log("holeOK error: ", err);
    })
}

/**
 * 创建服务器，监听洞口
 */
function createServer() {
    const ADDRESS = `0.0.0.0`
    const PORT = option[2] || 8888
    let socketMap = new Map()

    console.log("createServer");
    let server = net.createServer();

    server.on('connection', function (socket) {
        // 获取客户端端口号识别不同的客户端
        console.log(`客户端: ${socket.remoteAddress}:${socket.remotePort} 连接成功了。`);
        socketMap.set(socket.remoteAddress, socket)
        let responseMsg = {
            type: "heart",
            msg: {
                origin: {
                    localAddress: socket.localAddress,
                    localPort: socket.localPort
                },
                remote: {
                    remoteAddress: socket.remoteAddress,
                    remotePort: socket.remotePort
                }
            }
        }

        // 键盘输入发送消息
        // process.stdin.on('data', data => {
        //     socket.write(JSON.stringify({
        //         type: "msg",
        //         msg: data.toString().trim()
        //     }))
        // })

        socket.write(JSON.stringify(responseMsg))

        socket.on('data', data => {
            let req = JSON.parse(data)
            if (req.type === 'heart') {
                console.log(`${socket.remoteAddress}:${socket.remotePort} heart`)
            }
            if(req.type === "msg"){
                console.log(`${socket.remoteAddress}:${socket.remotePort} ${req.msg}`);
            }
        })

        socket.on('close', () => {
            console.log(`${socket.remoteAddress} close`)
            socket.destroy()
            server.close()
        })
        socket.on('end', () => {
            console.log(`${socket.remoteAddress} end`)
        })
        // socket.on('error', () => {
        //     console.log(`${socket.remoteAddress} error`)
        // })

        // server.close()
    })

    // 4.调用listen()启动监听
    server.listen(PORT, ADDRESS, function () {
        console.log(`${ADDRESS}:${PORT} 启动Socket服务器`);

        setInterval(() => {
            socketMap.forEach((socket, name) => {
                socket.write(JSON.stringify({
                    type: "heart",
                    msg: ""
                }))
            })
        }, 1500)

        server.on('error', (err) => {
            console.error('Server error:', err.message);
        });
    })
}


connServer()