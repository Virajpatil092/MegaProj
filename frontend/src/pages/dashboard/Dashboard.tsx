import { ReactElement, useEffect } from 'react';
import { Box } from '@mui/material';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import CustomerFulfillment from 'components/sections/dashboard/customer-fulfilment/CustomerFulfillment';
import Earnings from 'components/sections/dashboard/earnings/Earnings';

const Dashboard = (): ReactElement => {
  useEffect(() => {
    // Example Axios request
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/data');
        toast.success('Data fetched successfully!', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        console.log(response.data);
      } catch (error) {
        toast.error('DDoS Attack Detected', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <Box
      display="grid"
      gridTemplateColumns="repeat(2, 1fr)" // Two equal columns
      gap={3.5}
      sx={{
        width: '100%', // Full width
        height: 'auto', // Automatic height based on content
      }}
    >
      <Box
        gridColumn="span 1" // First half
        sx={{
          padding: '16px',
        }}
      >
        <CustomerFulfillment />
      </Box>

      <Box
        gridColumn="span 1" // Second half
        sx={{
          padding: '16px',
        }}
      >
        <Earnings />
      </Box>

      {/* Toast Container */}
      <ToastContainer />
    </Box>
  );
};

export default Dashboard;
