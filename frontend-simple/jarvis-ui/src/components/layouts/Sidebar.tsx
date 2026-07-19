import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';

const Sidebar = ({ selectedItem, 
    topics, 
    handleActiveFlag }: any) => {

    return(
        <>
            <Box sx={{ width: '20%', 
                flexShrink: 0, 
                borderRight: '1px solid #e0e0e0', 
                minHeight: '100vh', 
                margin: '20px' }}
            >
                <Breadcrumbs aria-label="breadcrumb">
                    <Typography sx={{ color: 'text.primary' }}>NEW CHATS</Typography>
                </Breadcrumbs>
                <List>
                    {topics?.map((element: any, index: number) => (
                        <ListItem key={index} >
                            <ListItemButton
                                selected={selectedItem.session_id === element.session_id}
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