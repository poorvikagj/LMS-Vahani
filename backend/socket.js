const { Server } = require("socket.io")

let ioInstance = null

const initSocket = (server, allowedOrigins = []) => {
  ioInstance = new Server(server, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : true,
      methods: ["GET", "POST"]
    }
  })

  ioInstance.on("connection", (socket) => {
    const role = String(socket.handshake.query.role || "").toLowerCase()

    if (role === "student") {
      socket.join("students")
    }

    if (role === "admin") {
      socket.join("admins")
    }
  })

  return ioInstance
}

const getIO = () => ioInstance

module.exports = {
  initSocket,
  getIO
}
