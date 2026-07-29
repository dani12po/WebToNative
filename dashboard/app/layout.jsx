import './globals.css';
import './connect.css';
import './theme.css';
import './topnav.css';
import './landing.css';
import './home-theme.css';
import './preview-theme-transition.css';
import './landing-details.css';
import './auth-modal.css';
import './account-menu.css';
import './apps-empty-state.css';
import './accent-contrast.css';
import './docs.css';
import './service-settings.css';
import './vault-gate.css';
import './build-history.css';

export const metadata = {
  title: 'WebToNative Control Center',
  description: 'Control plane untuk GAS, Next.js, dan Android native.'
};

export default function RootLayout({ children }) {
  return <html lang="id"><body>{children}</body></html>;
}
