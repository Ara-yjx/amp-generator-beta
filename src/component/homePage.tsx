import React, { useContext, useLayoutEffect, useRef, useState } from 'react';
import { Button, Divider } from '@arco-design/web-react';
import { IconEdit } from '@arco-design/web-react/icon';
import { useHref, useNavigate } from 'react-router';
import { AuthContext } from '../context/AuthContext';
import LoginForm from './loginForm';
import LoginModal from './loginModal';
import NavigationLinks from './navigationLinks';

/**
 * BlueDiagonalBackground Component
 * Creates a diagonal blue trapezoid background that passes through the center of the screenshot.
 * 
 * @param centerX - Absolute X coordinate of the screenshot center relative to the container
 * @param centerY - Absolute Y coordinate of the screenshot center relative to the container
 */
const BlueDiagonalBackground: React.FC<{ centerX: number; centerY: number; height: number }> = ({ centerX, centerY, height }) => {

  console.debug('[BlueDiagonalBackground]:', centerX, centerY, height);

  // The diagonal line should go through:
  // (centerX, centerY), 
  // (centerX + SLOPE * centerY, 0), 
  // (centerX - SLOPE * (1 - centerY), 1)
  const SLOPE = 0.38; // top-right to bottom-left is actually negavive k
  const x1 = centerX + SLOPE * centerY; // Top edge of trapezoid
  const x2 = centerX - SLOPE * (height - centerY); // Bottom edge of trapezoid

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#3491FA',
      // Trapezoid: top-left (x1px, 0), bottom-left (x2px, 100%), bottom-right (100%, 100%), top-right (100%, 0)
      clipPath: `polygon(${x1}px 0, ${x2}px 100%, 100% 100%, 100% 0)`,
      zIndex: 0
    }} />
  );
};

const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const screenshotImgRef = useRef<HTMLImageElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [screenshotCenter, setScreenshotCenter] = useState<{ centerX: number; centerY: number; height: number } | null>(null);

  const { authState } = useContext(AuthContext);
  const navigate = useNavigate();
  const localEditorHref = useHref('/exp');

  /** Calculate screenshot center position relative to the entire page */
  useLayoutEffect(() => {
    const updateScreenshotCenter = () => {
      if (screenshotImgRef.current && pageRef.current) {
        // Get absolute positions of both the image and the page container
        const imgRect = screenshotImgRef.current.getBoundingClientRect();
        const pageRect = pageRef.current.getBoundingClientRect();
        setScreenshotCenter({
          centerX: imgRect.left + imgRect.width / 2 - pageRect.left,
          centerY: imgRect.top + imgRect.height / 2 - pageRect.top,
          height: pageRect.height
        });
      }
    };

    // Calculate immediately on mount
    updateScreenshotCenter();
    // Recalculate when window is resized
    window.addEventListener('resize', updateScreenshotCenter);
    return () => window.removeEventListener('resize', updateScreenshotCenter);
  }, []);

  return (
    <div ref={pageRef} style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: '#f5f5f5' }}>
      {/* Blue Diagonal Background */}
      {screenshotCenter && (
        <BlueDiagonalBackground {...screenshotCenter} />
      )}

      {/* Top Navigation Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        zIndex: 10
      }}>
        <img src="/stimulize-logo.png" alt="STIMULIZE Logo" style={{ height: 50 }} />
        <NavigationLinks />
        <LoginModal />
      </div>

      {/* Main Content - Two Column Layout */}
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 80px',
        gap: 60,
        position: 'relative',
        zIndex: 1
      }}>
        {/* Left Section */}
        <div style={{ width: '35rem' }}>
          <h1 style={{
            fontSize: '5rem',
            color: '#3491FA',
            letterSpacing: 2,
            marginBottom: 20,
            fontWeight: 'bold',
            textAlign: 'left'
          }}>
            STIMULIZE
          </h1>

          <p style={{
            fontSize: '1.2rem',
            color: '#666',
            marginBottom: 40,
            textAlign: 'left'
          }}>
            Build high-precision interactive stimulus-based experiments <br />with just a few clicks.
          </p>

          {authState ? (
            <Button
              type='primary'
              size='large'
              shape='round'
              onClick={() => navigate('/my')}
              style={{ width: '100%', marginBottom: 30 }}
            >
              Go to my experiments and projects
            </Button>
          ) : (
            <LoginForm
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              loading={loading}
              setLoading={setLoading}
              onLoginSuccess={() => { navigate('/my'); }}
            />
          )}

          <Divider orientation='center' style={{ margin: '30px 0' }}>OR</Divider>

          <Button
            icon={<IconEdit />}
            type='outline'
            shape='round'
            size='large'
            href={localEditorHref}
            target='_blank'
            style={{ width: '100%' }}
          >
            {authState ? 'Try STIMULIZE in offline mode' : 'Try STIMULIZE as Guest'}
          </Button>
        </div>

        {/* Right Section - Screenshot */}
        <div style={{ width: '40rem' }}>
          <div style={{
            background: 'white',
            borderRadius: 8,
            padding: 20,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            zIndex: 1
          }}>
            <img
              ref={screenshotImgRef}
              src="/stimulize-screenshot.png"
              alt="STIMULIZE Screenshot"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: 4
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};


export default HomePage;
