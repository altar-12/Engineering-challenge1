const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const killPort = require('kill-port');

require('dotenv').config();

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3001;

const checkPort = async (port, maxPort = 65535) => {

    if (port > maxPort) {
        throw new Error("No available ports found");
    }

    try {
        await killPort(port, "tcp");
        await killPort(port, "udp");
        return port;
    } catch (err) {
        return checkPort(port + 1, maxPort);
    }
};

(async () => {
    const safePort = await checkPort(PORT);
    const getPort = (await import('get-port')).default; // dynamic import
    const final_port = await getPort({ port: safePort });

    console.log(`Port ${final_port} is free. Ready to start server.`);

    // Middleware
    app.use(cors({ origin: `http://localhost:${final_port}` }));
    app.use(express.json());
    app.use(morgan('dev'));

    // Routes
    app.use('/api/items', require('./routes/items'));
    app.use('/api/stats', require('./routes/stats'));
    app.use('/api/balanceReadApiTest', require('./routes/balance.js'));

    // for error handling
    app.use((err, req, res, next) => {
        const message = err.message || 'An unexpected error occurred';
        return res.status(err.status || 500).json({ error: message });
    });

    require('./config/dbHandler.js').connect();

    /**
     * @route    GET /api/balanceReadApiTest
     * @desc     Reads the USDC balance of a given EVM address and the total USDC supply from the smart contract
     * @author   Shubham
     * @access   Public
     * @param    {string}   req.query.userAddress  - A valid EVM wallet address (e.g. 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045)
     * @param    {Response} res                    - Express response object.
     *                                               200: { "userBalance": string, "totalSupply": string }
     *                                               400: { "error": "Invalid Ethereum address {address value}" }
     * @returns  {JSON}          Returns the USDC balance of the provided address and the total USDC supply, both as formatted strings with 6 decimal precision.
     * @throws   400 if `userAddress` query param is missing or not a valid EVM address
     *
     * @example
     * // Example request
     * curl -X GET "http://localhost:3001/api/balanceReadApiTest?userAddress=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
     *
     * // Example response
     * {
     *   "userBalance": "5258165986.910826",
     *   "totalSupply": "55437817433.232331"
     * }
     */

    // Serve static files in production
    if (process.env.NODE_ENV === 'production') {
        app.use(express.static('client/build'));
        app.get('*', (req, res) => {
            res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
        });
    }

    // Start server
    app.listen(final_port, () => {
        console.log(`Backend running on http://localhost:${final_port}`);
    });
})();