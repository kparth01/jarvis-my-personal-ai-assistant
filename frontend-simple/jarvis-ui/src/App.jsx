import { useState, useEffect } from 'react'

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Header from './components/layouts/Header'
import Chat from './components/Chat'
import Sidebar from './components/layouts/Sidebar'

import axios from 'axios';

function Copyright() {
  return (
    <Typography
      variant="body2"
      align="center"
      sx={{
        color: 'text.secondary',
      }}
    >
      {'Copyright © '}
      <Link color="inherit" href="https://mui.com/">
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}.
    </Typography>
  );
}


function App() {
  const [topics, setTopics] = useState([]);
  const [selectedItem, setSelectedItem] = useState([]);

  useEffect(() => {
      loadData()
  }, [])

  const loadData = () => {
    let resp = axios.get('http://localhost:8000/chat-history')
      .then((resp) => {
        const data = resp.data;
        if (data) {
          console.log("Topics loaded from chat-history", data.history);

          setTopics(data.history);
          setSelectedItem(data.history[0].sessionId);
        }
      })
      .catch((error) => {
        console.log("Failed to load the topics from chat-history", error);
      })
      .finally(() => {
        console.log("Request completed...");
      })
  }

  const handleActiveFlag = (selectedItem) => {
    setSelectedItem(selectedItem);
  }

  return (
    <>
      <Header></Header>
      {/* <Container fixed> */}
        <br/>
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>

          <Sidebar selectedItem={selectedItem} 
            topics={topics}
            handleActiveFlag={handleActiveFlag} />
          <Box sx={{ width: '80%', overflow: 'hidden' }}>    
            <Chat
              setTopics={setTopics}
              selectedItem={selectedItem}
            />
          </Box>
        </Box>
        <Box sx={{ my: 4 }}><Copyright /></Box>

      {/* </Container> */}
    </>
  )
}

export default App
