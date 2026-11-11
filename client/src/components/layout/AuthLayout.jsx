import { usePlatform } from '../../context/PlatformContext';

const AuthLayout = ({ children, title, subtitle }) => {
  const { platform } = usePlatform();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5">
          
          {/* Left Panel - Branding */}
          <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white flex flex-col justify-between min-h-[400px] md:min-h-[560px]">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                {platform.logo ? (
                  <img src={platform.logo} alt="Logo" className="h-12 w-12 rounded-xl object-cover bg-white p-1" />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-white bg-opacity-20 flex items-center justify-center">
                    <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold leading-tight">{platform.appName}</h1>
                  <p className="text-blue-100 text-xs">{platform.appTagline}</p>
                </div>
              </div>

              {title && (
                <>
                  <h2 className="text-3xl font-bold mt-8 mb-3">{title}</h2>
                  {subtitle && <p className="text-blue-100 text-sm leading-relaxed">{subtitle}</p>}
                </>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-blue-500/40">
              <p className="text-blue-100 text-xs font-medium mb-2">Need help?</p>
              {platform.supportEmail && (
                <p className="text-blue-100 text-xs mb-1">
                  📧 <a href={`mailto:${platform.supportEmail}`} className="hover:text-white underline">{platform.supportEmail}</a>
                </p>
              )}
              {platform.supportWhatsapp && (
                <p className="text-blue-100 text-xs mb-1">
                  💬 <a href={`https://wa.me/${platform.supportWhatsapp.replace(/[^0-9]/g, '')}`} className="hover:text-white underline">{platform.supportWhatsapp}</a>
                </p>
              )}
              <p className="text-blue-200 text-xs mt-4">
                {platform.footerText || `© ${new Date().getFullYear()} ${platform.appName}`}
              </p>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="md:col-span-3 p-8 md:p-10 flex flex-col justify-center">
            {children}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
