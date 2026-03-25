import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useTheme } from "next-themes";
import WalletConnect from "./WalletConnect";
import NotificationsBell from "./NotificationsBell";
import Logo from "../assets/logo.svg";
import ProfileSettingsModal from "./ProfileSettingsModal";
import { useProfileStore } from "../store/useProfileStore";

interface Routes {
  name: string;
  route: string;
}

const Header = () => {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const profile = useProfileStore((s) => s.profile);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isDark = theme === "dark";

  const routes: Routes[] = [
    { name: "Home", route: "/" },
    { name: "Leaderboard", route: "/leaderboard" },
    { name: "Learn", route: "/learn" },
    { name: "Pools", route: "/pools" },
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `font-medium lg:text-xl rounded-lg py-1 px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
      isActive
        ? "bg-[#2C4BFD] text-white"
        : "text-[#9B9B9B] dark:text-gray-400 hover:bg-[#2C4BFD] hover:text-white"
    }`;

  const themeToggleLabel = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <header className="w-full bg-white dark:bg-gray-900 fixed top-0 left-0 z-20 border-b border-gray-100 dark:border-gray-800 transition-colors">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#2C4BFD] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>
      <nav className="w-full h-20 lg:h-28 flex items-center justify-between px-4 lg:px-10" aria-label="Primary">
        <Link
          to="/"
          className="flex items-center justify-start gap-5 md:gap-2 lg:gap-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
          aria-label="Xelma home"
        >
          <img src={Logo} alt="" className="h-8 lg:h-10" />
          <span className="text-2xl text-[#292D32] dark:text-gray-100 font-bold md:text-lg lg:text-2xl transition-colors">
            Xelma
          </span>
        </Link>

        <ul className="hidden md:flex items-center justify-center gap-6 lg:gap-10">
          {routes.map(({ name, route }) => (
            <li key={name}>
              <NavLink to={route} end className={navLinkClass}>
                {name}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3.5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={themeToggleLabel}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
          >
            {isDark ? (
              <svg
                className="w-5 h-5 text-gray-700 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-gray-700 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
          <NotificationsBell />
          <WalletConnect />
        </div>

        <div className="md:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={themeToggleLabel}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
          >
            {isDark ? (
              <svg
                className="w-5 h-5 text-gray-700 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-gray-700 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-primary-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="relative h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
          >
            <span className="sr-only">{open ? "Close navigation menu" : "Open navigation menu"}</span>
            <span
              className={`absolute h-0.5 w-6 bg-gray-800 dark:bg-gray-200 transition-transform duration-300 ${
                open ? "rotate-45" : "-translate-y-2"
              }`}
              aria-hidden
            />
            <span
              className={`absolute h-0.5 w-6 bg-gray-800 dark:bg-gray-200 transition-opacity duration-300 ${
                open ? "opacity-0" : "opacity-100"
              }`}
              aria-hidden
            />
            <span
              className={`absolute h-0.5 w-6 bg-gray-800 dark:bg-gray-200 transition-transform duration-300 ${
                open ? "-rotate-45" : "translate-y-2"
              }`}
              aria-hidden
            />
          </button>
        </div>
      </nav>

      {open && (
        <div
          id="mobile-primary-nav"
          className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 pb-4 transition-colors"
          role="region"
          aria-label="Mobile navigation"
        >
          <ul className="flex flex-col gap-2 pt-4">
            {routes.map(({ name, route }) => (
              <li key={name}>
                <NavLink
                  to={route}
                  end
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block text-lg font-medium py-2 px-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                      isActive
                        ? "bg-[#2C4BFD] text-white"
                        : "text-[#4D4D4D] dark:text-gray-300 hover:bg-[#2C4BFD] hover:text-white"
                    }`
                  }
                >
                  {name}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-end">
            <NotificationsBell />
            <WalletConnect />
          </div>
        </div>
      )}
      {/* <ProfileSettingsModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        initialValues={{
          name: 'Oxn3n 👽',
          bio: '',
          twitterLink: '',
          streamerMode: false,
          avatarUrl: null,
        }}
      /> */}
      {profileOpen && (
        <ProfileSettingsModal
          key="profile-settings-modal"
          onClose={() => setProfileOpen(false)}
          initialValues={profile ?? undefined}
        />
      )}
    </header>
  );
};

export default Header;
