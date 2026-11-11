import { usePlatform } from '../../context/PlatformContext';

const Footer = () => {
  const { platform } = usePlatform();

  return (
    <footer className="bg-white shadow-md mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-sm text-gray-500">
            {platform.footerText || `© ${new Date().getFullYear()} ${platform.appName}`}
          </p>
          {platform.supportEmail && (
            <p className="text-sm text-gray-400">
              Support: <a href={`mailto:${platform.supportEmail}`} className="text-blue-600 hover:underline">{platform.supportEmail}</a>
            </p>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
