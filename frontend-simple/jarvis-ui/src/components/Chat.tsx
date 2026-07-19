import TextFieldComp from "./commons/TextFieldComp";
import ButtonComp from '../components/commons/ButtonComp';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import axios from 'axios';
import { useEffect, useRef, useState } from "react";
import { Message, ChatResponse } from "../types/models";
import Avatar from '@mui/material/Avatar';
import Typography from "@mui/material/Typography";

const Chat = ({ setTopics }: any) => {
    const [formData, setFormData] = useState({
        message: '',
    });
    const [history, setHistory] = useState<Message[]>([]);
    const sessionId = useRef(crypto.randomUUID())


    useEffect(() => {
        axios.delete('http://localhost:8000/context')
    }, [])
    
    const onChange = (e: any) => {
        setFormData({
            message: e.target.value
        });
    }

    const handleSubmit = async (event: any) => {
        event.preventDefault();

        const userMsg: Message = {
            role: 'user',
            content: formData.message,
            timestamp: Date.now(),
            sessionId: sessionId.current
        }
        
        setHistory(prev => [...prev, userMsg])
        setFormData({
            message: ''
        });

        const res = await axios.post(`http://localhost:8000/chat`, userMsg)
        .then((res) => {
            console.log("res.data: ", res.data)
            const data: ChatResponse = res.data;
            
            const assistantMsg: Message = {
                role: 'assistant',
                content: data.reply,
                timestamp: Date.now(),
            };

            setTopics((prev: string) => [...prev, data.topic]);
            setHistory(prev => [...prev, assistantMsg]);

        })
        .finally(() => {
            console.log("Request completed")
        })
    }

    return(
        <>
            {/* <Container fixed> */}
            <Box sx={{ display: 'flex', 
                flexDirection: 'column', 
                height: '80%', 
                overflow: 'hidden' }}
            >
                <Box 
                    sx={{ bgcolor: '#fafafb', 
                        // height: '100vh', 
                        flexGrow: 1,
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 1, 
                        overflowY: 'auto', p: 2 }}
                    >
                    {history.map((chat, idx) => {
                        const isUser = chat.role === 'user';
                        return (
                            <>
                                <Box key={idx} 
                                    sx={{ display: 'flex', 
                                            justifyContent: isUser ? 'flex-end' : 'flex-start' 
                                        }}
                                    >
                                    {isUser ? 
                                        <>
                                            <Box component="section" 
                                                sx={{ p: '8px 16px',
                                                    borderRadius: '16px',          
                                                    bgcolor: '#1976D2',
                                                    color: '#ffffff',
                                                    display: 'inline-flex',        
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    maxWidth: '70%',               
                                                    wordBreak: 'break-word',
                                                }}
                                            >
                                                <Typography sx={{ textAlign: 'right' }}>{chat.content}</Typography>
                                            </Box> 
                                            &nbsp;&nbsp; <Avatar key={idx} alt="You" src="/static/images/avatar/2.jpg" /> 
                                        </>
                                        :
                                        <>
                                            <Avatar key={idx} alt="Assistant" src="/static/images/avatar/2.jpg" /> &nbsp;&nbsp;
                                            <Box component="section" 
                                                sx={{ p: '8px 16px',
                                                    borderRadius: '16px',          
                                                    bgcolor: '#bed5ec',
                                                    color: '#010101',
                                                    display: 'inline-flex',        
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    maxWidth: '70%',               
                                                    wordBreak: 'break-word',
                                                }}
                                            >
                                                <Typography sx={{ textAlign: 'left' }}>{chat.content}</Typography>
                                            </Box>
                                        </>
                                    }
                                </Box>
                            </>
                        )
                    })}
                </Box>
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{ display: 'flex', 
                        alignItems: 'center', '& > :not(style)': { m: 1 } }}
                    noValidate
                    autoComplete="off"
                    >
                        <TextFieldComp 
                            label="Message"
                            id="chatId"
                            value={formData.message}
                            onChange={onChange}/>
                        <ButtonComp text="Send" />
                </Box>
            </Box>
            {/* </Container> */}
        </>
    )
}


export default Chat;