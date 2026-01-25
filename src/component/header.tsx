import LoginModal from './loginModal';
import NavButtonDropdown from './navButtonDropdown';
import NavigationLinks from './navigationLinks';

function Header() {
  return (
    <div>
      <div style={{ position: 'absolute', top: 20, left: 20 }}>
        <NavButtonDropdown />
      </div>

      <h1 style={{ color: '#3491FA', letterSpacing: 1 }}>STIMULIZE</h1>
      <div style={{ marginBottom: 30 }}>
        <NavigationLinks />
      </div>

      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <LoginModal />
      </div>
    </div>
  );
}

export default Header;
