import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import BackButton from '../ui/BackButton';

export default function Layout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <div className="container" style={{ paddingTop: '20px', paddingBottom: 0 }}>
          <BackButton />
        </div>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
