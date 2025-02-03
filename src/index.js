import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// const cors = require("cors");

// const corsOptions = {
//   origin: true, // 허용하려는 도메인 목록
//   methods: ["GET", "POST", "PUT", "DELETE"], // 허용하려는 HTTP 메서드
//   allowedHeaders: ["Content-Type", "Authorization"], // 허용하려는 헤더
// };
// App.use(cors(corsOptions));
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
