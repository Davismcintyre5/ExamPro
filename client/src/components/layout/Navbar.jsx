import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';

const Navbar = ({ onToggleSidebar }) => {
  const { admin, logout } = useAuth();
  const { platform } = usePlatform();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <button onClick={onToggleSidebar} className="text-gray-500 hover:text-gray-700 focus:outline-none mr-4">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center">
          {platform.logo && (
            <img src={platform.logo} alt="Logo" className="h-8 w-8 rounded-lg mr-2 object-cover" />
          )}
          <span className="text-lg font-bold text-blue-600 hidden sm:block">{platform.appName}</span>
        </div>
      </div>

      <div className="relative">
        <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center space-x-2 focus:outline-none">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {admin?.fullName?.charAt(0) || 'A'}
          </div>
          <span className="hidden md:block text-sm font-medium text-gray-700">{admin?.fullName || 'Admin'}</span>
          <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{admin?.fullName}</p>
              <p className="text-xs text-gray-500 truncate">{admin?.email || admin?.username}</p>
            </div>
            <button onClick={() => { setShowDropdown(false); navigate('/'); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Dashboard
            </button>
            <button onClick={() => { setShowDropdown(false); navigate('/settings'); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Settings
            </button>
            <button onClick={() => { setShowDropdown(false); navigate('/change-password'); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Change Password
            </button>
            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
