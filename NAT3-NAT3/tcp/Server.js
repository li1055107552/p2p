var net = require('net');

const option = process.argv.splice(2)
const ADDRESS = `0.0.0.0`
const PORT = option[0] || 25836
console.log(PORT)

let socketMap = new Map()
var server = net.createServer();

server.on('connection', function (socket) {
    // 获取客户端端口号识别不同的客户端
    console.log(`客户端: ${socket.remoteAddress}:${socket.remotePort} 连接成功了。`);

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

    socket.write(JSON.stringify(responseMsg))


    socket.on('data', data => {
        let req = JSON.parse(data)
        if (req.type === 'heart') {
            console.log("heart", req.msg)
        }
        else if (req.type === "clientInit") {
            socketMap.set(req.msg.from, { socket, msg: req.msg })

            // A想连B, B信息已存在
            if (socketMap.has(req.msg.to)) {
                // 得到B连进来的socket
                let B = socketMap.get(req.msg.to)
                let s = B.socket

                // 判断连进来的A, 是不是B想被连的, 是就把B的信息告知A
                if(B.msg.from === req.msg.from){

                    // 把B的洞口信息告知A
                    socket.write(JSON.stringify({
                        type: "holeMsg",
                        msg: {
                            holeIP: s.remoteAddress,
                            holePort: s.remotePort
                        }
                    }))


                    // 通知B 给A打洞
                    s.write(JSON.stringify({
                        type: "punchHole",
                        msg: {
                            clientIP: socket.remoteAddress,
                            clientPort: socket.remotePort,
                        }
                    }))

                    // 然后释放B的socket
                    s.end()
                    socketMap.delete(req.msg.to)

                }
                else{
                    // A想连B, 但B不想被A连, 直接把这条连接挂掉
                    console.log(B.msg.from, req.msg.from);
                    socketMap.delete(req.msg.from)
                    socket.end()
                }
                
            }

        }
        else if (req.type === "holeInit") {
            socketMap.set(req.msg.to, { socket, msg: req.msg })

            // B想让A连, A信息已存在
            if (socketMap.has(req.msg.from)) {
                // 得到A的socket
                let A = socketMap.get(req.msg.from)
                let s = A.socket

                // B想被A连, A也想连B, 就把B的信息告知A
                if(A.msg.to === req.msg.to){

                    // 把B的洞口信息告知A
                    s.write(JSON.stringify({
                        type: "holeMsg",
                        msg: {
                            holeIP: socket.remoteAddress,
                            holePort: socket.remotePort
                        }
                    }))

                    // 通知B 给A打洞
                    socket.write(JSON.stringify({
                        type: "punchHole",
                        msg: {
                            clientIP: s.remoteAddress,
                            clientPort: s.remotePort,
                        }
                    }))

                    // 然后释放B的socket
                    socket.end()
                    socketMap.delete(req.msg.to)
                }
                
                

            }

        }
        else if(req.type === "holeOK"){
            console.log(socketMap.keys())
            if(socketMap.has(req.msg.from)){
                console.log("???");
                let A = socketMap.get(req.msg.from)
                let s = A.socket

                // 告诉A去请求B的洞口
                s.write(JSON.stringify({
                    type: "reqHole"
                }))

                // 释放A的socket
                socketMap.delete(req.msg.from)
                s.end()
            }
            socket.end()
        }
        else{
            socket.end()
        }
        
    })
    // server.close()
})

// 4.调用listen()启动监听
server.listen(PORT, ADDRESS, function () {
    console.log(`${ADDRESS}:${PORT} 启动Socket服务器`);

    setInterval(() => {
        socketMap.forEach((user, name) => {
            user.socket.write(JSON.stringify({
                type: "heart",
                msg: ""
            }))
        })
    }, 1500)

    server.on('error', (err) => {
        console.error('Server error:', err.message);
    });
})