import React, { useState, useEffect, useRef } from 'react';
import SendIcon from '@mui/icons-material/Send';
import { IconButton, TextField, Box, CircularProgress } from '@mui/material';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { Credentials } from 'aws-sdk';

function Chatbot() {
    const [messages, setMessages] = useState([{ text: 'Welcome! How can I help you?', sender: 'bot' }]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSend();
        }
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const credentials = new Credentials({
        accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
    });

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const invokeModel = async (req) => {
        console.log('invokeModel', req);
        const client = new BedrockRuntimeClient({ 
            region: 'us-west-2',
            endpoint: 'https://bedrock-runtime.us-west-2.amazonaws.com',
            credentials
        });
        // Convert the conversation array into a single string prompt with labels
        const prompt = req.map(item => {
            const speaker = item.sender === 'user' ? 'User' : 'Bot';
            return `${speaker}: ${item.text}`;
        }).join('\n');

        // Add your initial instruction to the prompt
        const fullPrompt = `${prompt}\n These are the conversation messages we have had me (user), You (Customer Service Bot). Please generate a response to the latest user message. BE VERY CONCISE`;

        const payload = {
            prompt: fullPrompt,
            max_gen_len: 100,
            temperature: 0.3,
            top_p: 0.8,
        };

        try {
            const apiResponse = await client.send(
                new InvokeModelCommand({
                    modelId: "meta.llama3-1-405b-instruct-v1:0",
                    contentType: "application/json",
                    accept: "application/json",
                    body: JSON.stringify(payload),
                })
            );
    
            const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
            const responseBody = JSON.parse(decodedResponseBody);

            const generatedText = responseBody.generation || "No response generated.";
            return generatedText.replace(/^(\.\n|\n|\. Bot:\s*)/, '');
            
        } catch (error) {
            console.error("Error invoking the model:", error);
            return "Sorry, I couldn't process that request.";
        }
    };

    const handleSend = async () => {
        const updatedMessages = [...messages, { text: input, sender: 'user' }];
        setInput('');
        setMessages([...updatedMessages, { text: '...', sender: 'bot', isTyping: true }]);
        const botResponse = await invokeModel(updatedMessages);
        setMessages(prevMessages => prevMessages.filter(msg => !msg.isTyping).concat([
            { text: botResponse, sender: 'bot' }
        ]));
    };

    return (
        <Box sx={{ margin: 'auto', border: '1px solid #ccc', borderRadius: 2, padding: 2, bgcolor: '#fff' }}>
            <Box sx={{ height: 400, overflowY: 'auto', padding: 2, bgcolor: '#f9f9f9', borderRadius: 2, mb: 2 }}>
                {messages.map((msg, index) => (
                    <Box
                        key={index}
                        sx={{
                            display: 'flex',
                            justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            mb: 1
                        }}
                    >
                        <Box
                            sx={{
                                px: 2,
                                py: 1,
                                borderRadius: 2,
                                bgcolor: msg.sender === 'user' ? '#007bff' : '#e5e5e5',
                                color: msg.sender === 'user' ? '#fff' : '#000',
                                maxWidth: '75%'
                            }}
                        >
                            {msg.isTyping ? <CircularProgress size={20} /> : msg.text}
                        </Box>
                    </Box>
                ))}
                <div ref={messagesEndRef} /> {/* Reference to the bottom of the message list */}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Type a message"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    sx={{ mr: 1 }}
                />
                <IconButton color="primary" onClick={handleSend}>
                    <SendIcon />
                </IconButton>
            </Box>
        </Box>
    );
}

export default Chatbot;