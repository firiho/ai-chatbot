import React from 'react';
import Chatbot from './Chatbot';
import './App.css';

function App() {
    return (
        <div className="App">
            <div className="chat-container">
                <h1 className="chat-title">Customer Service Chatbot</h1>
                <Chatbot />
            </div>
        </div>
    );
}
export default App;