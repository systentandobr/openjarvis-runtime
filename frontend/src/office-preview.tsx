import { createRoot } from 'react-dom/client';
import { OfficePage } from './pages/OfficePage';
import './index.css';
// Design review entry: starts in simulation without application telemetry,
// model discovery, inference, account setup or analytics initialization.
createRoot(document.getElementById('root')!).render(<OfficePage />);
