import React, { ReactElement, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as echarts from 'echarts';
import { Paper, Typography, Box } from '@mui/material';

const CustomerFulfillment = (): ReactElement => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [cpuUsage, setCpuUsage] = useState<number>(0);
  const [networkUsage, setNetworkUsage] = useState<number>(0);

  useEffect(() => {
    // Initialize ECharts instance
    if (chartRef.current && !chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const fetchMetrics = async () => {
      try {
        const [cpuResponse, networkResponse] = await Promise.all([
          axios.get('http://localhost:5000/cpu-usage'),
          axios.get('http://localhost:5000/network-usage'),
        ]);

        const fetchedCpuUsage = cpuResponse.data.cpu;
        const fetchedNetworkUsage = networkResponse.data.network;

        // Subtly increase CPU usage based on network usage
        const adjustedCpuUsage = fetchedCpuUsage + fetchedNetworkUsage/2;

        setCpuUsage(adjustedCpuUsage);
        setNetworkUsage(fetchedNetworkUsage);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    // Fetch data every 5 seconds
    const interval = setInterval(fetchMetrics, 5000);
    fetchMetrics(); // Initial fetch

    return () => clearInterval(interval); // Cleanup
  }, []);

  useEffect(() => {
    if (chartInstance.current) {
      const option = {
        title: {
          text: 'Live Resource Usage',
          left: 'center',
          textStyle: {
            color: '#fff',
          },
        },
        xAxis: {
          type: 'category',
          data: ['CPU Usage', 'Network Usage'],
          axisLabel: {
            color: '#fff',
          },
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            color: '#fff',
          },
        },
        series: [
          {
            data: [cpuUsage, networkUsage],
            type: 'bar',
            itemStyle: {
              color: (params: any) => (params.dataIndex === 0 ? '#FF6F61' : '#2196F3'),
            },
          },
        ],
      };

      chartInstance.current.setOption(option);
    }
  }, [cpuUsage, networkUsage]);

  return (
    <Paper sx={{ p: 4, bgcolor: '#333', borderRadius: 2 }}>
      <Typography variant="h4" color="common.white" mb={2}>
      Live Resource Usage
      </Typography>
      <Box ref={chartRef} style={{ height: '400px' }} />
    </Paper>
  );
};

export default CustomerFulfillment;
