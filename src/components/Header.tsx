import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useTheme } from "next-themes";
import Logo from "../assets/logo.svg";
import DiscordLogo from "../assets/discord-icon.svg";
import XLMLogo from "../assets/xlm-icon.svg";
import Avatar from "../assets/avatar.svg";

interface Routes {
  name: string;
  route: string;
}

const Header = () => {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  const isDark = theme === 'dark';

  const routes: Routes[] = [
    { name: "Home", route: "/" },
    { name: "Leaderboard", route: "/leaderboard" },
    { name: "Learn", route: "/learn" },
    { name: "Pools", route: "/pools" },
  ];

  return (
    <header className="w-full bg-white dark:bg-gray-900 fixed top-0 left-0 z-20 border-b border-gray-100 dark:border-gray-800 transition-colors">
      <nav className="w-full h-20 lg:h-28 flex items-center justify-between px-4 lg:px-14">

        <div className="flex items-center justify-start gap-5 md:gap-2 lg:gap-4" >
          <img src={Logo} alt="logo" className="h-8 lg:h-10" />
          <p className="text-2xl text-[#292D32] dark:text-gray-100 font-bold md:text-lg lg:text-2xl transition-colors" >Xelma</p>
        </div>

        <ul className="hidden md:flex items-center justify-center gap-6 lg:gap-10">
          {routes.map(({ name, route }) => (
            <NavLink
              key={name}
              to={route}
              end
              className={({ isActive }) =>
                `font-medium lg:text-xl rounded-lg py-1 px-3 transition-colors ${isActive
                  ? "bg-[#2C4BFD] text-white"
                  : "text-[#9B9B9B] dark:text-gray-400 hover:bg-[#2C4BFD] hover:text-white"
                }`
              }
            >
              {name}
            </NavLink>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3.5">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isDark ? (
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <div className="min-w-36 rounded-lg py-1 px-2.5 border border-[#BEC7FE] dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800 transition-colors">
            <img src={DiscordLogo} alt="discord" />
            <img src={XLMLogo} alt="xlm" />
            <p className="font-semibold text-lg text-[#4D4D4D] dark:text-gray-300 transition-colors">2.56</p>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#CCCCCC] dark:bg-gray-700 transition-colors">
            <img src={Avatar} alt="avatar" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isDark ? (
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <div
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            className="relative w-8 h-8 flex items-center justify-center"
          >
            <span
              className={`absolute h-0.5 w-6 bg-gray-800 dark:bg-gray-200 transition-transform duration-300 ${open ? "rotate-45" : "-translate-y-2"
                }`}
            />
            <span
              className={`absolute h-0.5 w-6 bg-gray-800 dark:bg-gray-200 transition-opacity duration-300 ${open ? "opacity-0" : "opacity-100"
                }`}
            />
            <span
              className={`absolute h-0.5 w-6 bg-gray-800 dark:bg-gray-200 transition-transform duration-300 ${open ? "-rotate-45" : "translate-y-2"
                }`}
            />
          </div>
        </div>
      </nav>

      {open && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 pb-4 transition-colors">
          <ul className="flex flex-col gap-2 pt-4">
            {routes.map(({ name, route }) => (
              <NavLink
                key={name}
                to={route}
                end
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `text-lg font-medium py-2 px-3 rounded-lg transition-colors ${isActive
                    ? "bg-[#2C4BFD] text-white"
                    : "text-[#4D4D4D] dark:text-gray-300 hover:bg-[#2C4BFD] hover:text-white"
                  }`
                }
              >
                {name}
              </NavLink>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between">
            <div className="rounded-lg py-2 px-3 border border-[#BEC7FE] dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800 transition-colors">
              <img src={DiscordLogo} alt="discord" />
              <img src={XLMLogo} alt="xlm" />
              <p className="font-semibold text-base text-[#4D4D4D] dark:text-gray-300 transition-colors">2.56</p>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#CCCCCC] dark:bg-gray-700 transition-colors">
              <img src={Avatar} alt="avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
