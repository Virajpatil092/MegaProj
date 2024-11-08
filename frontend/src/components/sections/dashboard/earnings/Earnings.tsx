import { Box, Paper, Typography } from '@mui/material';
import EarningsChart from './EarningsChart';
import { ReactElement, useEffect, useRef, useState } from 'react';
import EChartsReactCore from 'echarts-for-react/lib/core';
import { currencyFormat } from 'helpers/format-functions';

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
        setDdosProbability(Math.min(Math.max(data.ddosPercentage, 0), 1) * 100);
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

  return (
    <Paper sx={{ p: { xs: 4, sm: 8 }, height: 1 }}>
      <Typography variant="h4" color="common.white" mb={2.5}>
        Earnings
      </Typography>
      <Typography variant="body1" color="text.primary" mb={4.5}>
        Total Expense
      </Typography>
      <Typography
        variant="h1"
        color="primary.main"
        mb={4.5}
        fontSize={{ xs: 'h2.fontSize', sm: 'h1.fontSize' }}
      >
        {currencyFormat(6078.76, { useGrouping: false })}
      </Typography>
      <Typography variant="body1" color="text.primary" mb={15}>
        Profit is 48% More than last Month
      </Typography>
      <Box
        flex={1}
        sx={{
          position: 'relative',
        }}
      >
        <EarningsChart
          chartRef={chartRef}
          ddosProbability={ddosProbability} // Pass ddosProbability to the EarningsChart
          sx={{
            display: 'flex',
            justifyContent: 'center',
            flex: '1 1 0%',
            maxHeight: 152,
          }}
        />
        <Typography
          variant="h1"
          color="common.white"
          textAlign="center"
          mx="auto"
          position="absolute"
          left={0}
          right={0}
          bottom={0}
        >
          {ddosProbability !== null ? `${ddosProbability.toFixed(0)}%` : 'Loading...'}
        </Typography>
      </Box>
    </Paper>
  );
};

export default Earnings;
