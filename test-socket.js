const { io } = require('socket.io-client');

const socket = io('http://localhost:5000', {
    transports: ['websocket', 'polling']
});

socket.on('connect', () => {
    console.log('Connected to backend!', socket.id);
    process.exit(0);
});

socket.on('connect_error', (err) => {
    console.error('Connection error:', err.message);
    process.exit(1);
});

setTimeout(() => {
    console.log('Timeout after 5 seconds');
    process.exit(1);
}, 5000);
