import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import axios from 'axios';
import { Message } from "../../types/models";


const Sidebar = ({ selectedItem, 
    topics, 
    handleActiveFlag }: any) => {

    const handleNewChat = () => {
        const userMsg: Message = {
            role: 'user',
            content: '',
            timestamp: Date.now(),
            sessionId: ''
        }
        
        axios.post(`http://localhost:8000/add-new`, userMsg)
            .then((res) => {
                console.log(res.data)
            })
            .finally(() => {
                console.log("Request completed")
            })
    }

    return(
        <>
            <Box sx={{ width: '20%', 
                flexShrink: 0, 
                borderRight: '1px solid #e0e0e0', 
                minHeight: '100vh', 
                margin: '20px' }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'text.primary' }}>CHATS</Typography>
                    <IconButton color="primary" onClick={handleNewChat} aria-label="new chat">
                        <AddIcon />
                    </IconButton>
                </Box>
                <List>
                    {topics?.map((element: any, index: number) => (
                            
                        <ListItem key={index} >
                            <ListItemButton
                                selected={selectedItem === element.sessionId}
                                onClick={() => handleActiveFlag(element)}>
                                
                                <ListItemText primary={element.topic} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </>
    )
}

export default Sidebar;
