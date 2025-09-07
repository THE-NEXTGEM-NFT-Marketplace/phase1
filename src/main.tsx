import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import '@suiet/wallet-kit/style.css';

createRoot(document.getElementById("root")!).render(<App />);
