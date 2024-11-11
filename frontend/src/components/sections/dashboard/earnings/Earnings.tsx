import { Box, Paper, Typography } from '@mui/material';
import EarningsChart from './EarningsChart';
import { ReactElement, useEffect, useRef, useState } from 'react';
import EChartsReactCore from 'echarts-for-react/lib/core';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Earnings = (): ReactElement => {
  const chartRef = useRef<EChartsReactCore | null>(null);
  const [ddosProbability, setDdosProbability] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        const echartsInstance = chartRef.current.getEchartsInstance();
        echartsInstance.resize({ width: 'auto', height: 'auto' });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [chartRef]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5001');

    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.ddosPercentage !== undefined) {
        const probability = Math.min(Math.max(data.ddosPercentage, 0), 1) * 100;
        setDdosProbability(probability);

        // Show a toast if the probability goes above 78%
        if (probability > 78) {
          toast.error('Critical DDoS Probability detected!', {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, []);

  const isCritical = ddosProbability !== null && ddosProbability > 80;
  const themeColor = isCritical ? '#ff4d4f' : '#1e1e2d'; // Red if critical, dark-blue otherwise
  const animationStyle = {
    transition: 'background-color 0.5s ease, color 0.5s ease', // Smooth transition
  };

  return (
    <Paper
      sx={{
        p: { xs: 4, sm: 8 },
        height: 1,
        backgroundColor: themeColor, // Change background color
        color: isCritical ? '#ffffff' : '#ffffff', // Adjust text color if needed
        ...animationStyle,
      }}
    >
      <Typography variant="h4" mb={2.5}>
        DDoS Live Probability
      </Typography>
      <Typography variant="body1" mb={4.5}>
        10 Second Refresh Rate
      </Typography>
      <Typography
        variant="h1"
        mb={4.5}
        fontSize={{ xs: 'h2.fontSize', sm: 'h1.fontSize' }}
        sx={animationStyle} // Apply animation
      >
        {ddosProbability === null ? 'Loading...' : ddosProbability + `%`}
      </Typography>
      <Typography variant="body1" mb={15}>
        Critical DDoS Probability is 78%
      </Typography>
      <Box
        flex={1}
        sx={{
          position: 'relative',
        }}
      >
        <EarningsChart
          chartRef={chartRef}
          ddosProbability={ddosProbability}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            flex: '1 1 0%',
            maxHeight: 152,
          }}
        />
        <Typography
          variant="h1"
          textAlign="center"
          mx="auto"
          position="absolute"
          left={0}
          right={0}
          bottom={0}
          sx={animationStyle} // Apply animation
        >
          {ddosProbability !== null ? `${ddosProbability.toFixed(0)}%` : 'Loading...'}
        </Typography>
      </Box>
    </Paper>
  );
};

export default Earnings;
