const express = require('express');
const si = require('systeminformation');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const csv = require('csv-parser');

const app = express();
const PORT = 5000;
const wss = new WebSocket.Server({ port: 5001 });

app.use(cors());

app.get('/cpu-usage', async (req, res) => {
  try {
    const load = await si.currentLoad();
    res.json({ cpu: load.avgLoad });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch CPU usage' });
  }
});

app.get('/network-usage', async (req, res) => {
  try {
    const networkStats = await si.networkStats('lo');
    if (networkStats && networkStats[0]) {
      const { rx_sec, tx_sec } = networkStats[0];
      res.json({ network: (rx_sec + tx_sec) / (1024 * 1024) });
    } else {
      res.status(404).json({ error: 'No network stats found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch network usage' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// WebSocket server for real-time updates
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
});

// Function to read the latest DDOS% from a CSV file
const readDdosPercentage = (filePath) => {
  return new Promise((resolve, reject) => {
    let latestDdosPercentage = null;
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        latestDdosPercentage = row['DDOS%']; // Capture the DDOS% field from the latest row
      })
      .on('end', () => {
        resolve(latestDdosPercentage); // Return the latest DDOS% value
      })
      .on('error', (error) => reject(error));
  });
};

// Watch the output directory for new files with the "predictions-" prefix
const outputDir = './output';
fs.watch(outputDir, (eventType, filename) => {
  if (filename && filename.startsWith('predictions-') && filename.endsWith('.csv')) {
    const filePath = path.join(outputDir, filename);
    
    // Read the latest DDOS% from the newly created file
    readDdosPercentage(filePath)
      .then((ddosPercentage) => {
        if (ddosPercentage !== null) {
          // Send the latest DDOS% to all WebSocket clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ ddosPercentage }));
            }
          });
        }
      })
      .catch((error) => console.error('Failed to read DDOS% data:', error));
  }
});