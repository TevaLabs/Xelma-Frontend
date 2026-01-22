import { useState } from "react";
import { NavLink } from "react-router-dom";
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

  const routes: Routes[] = [
    { name: "Home", route: "/" },
    { name: "Leaderboard", route: "/leaderboard" },
    { name: "Learn", route: "/learn" },
    { name: "Pools", route: "/pools" },
  ];

  return (
    <header className="w-full bg-white fixed top-0 left-0 z-20 border-b border-gray-100">
      <nav className="w-full h-20 lg:h-28 flex items-center justify-between px-4 lg:px-14">
        <img src={Logo} alt="logo" className="h-8 lg:h-10" />

        <ul className="hidden md:flex items-center justify-center gap-6 lg:gap-10">
          {routes.map(({ name, route }) => (
            <NavLink
              key={name}
              to={route}
              end
              className={({ isActive }) =>
                `font-medium lg:text-xl rounded-lg py-1 px-3 transition-colors ${
                  isActive
                    ? "bg-[#2C4BFD] text-white"
                    : "text-[#9B9B9B] hover:bg-[#2C4BFD] hover:text-white"
                }`
              }
            >
              {name}
            </NavLink>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3.5">
          <div className="min-w-36 rounded-lg py-1 px-2.5 border border-[#BEC7FE] flex items-center gap-3">
            <img src={DiscordLogo} alt="discord" />
            <img src={XLMLogo} alt="xlm" />
            <p className="font-semibold text-lg text-[#4D4D4D]">2.56</p>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#CCCCCC]">
            <img src={Avatar} alt="avatar" className="w-full h-full object-cover" />
          </div>
        </div>

        <div
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          className="md:hidden relative w-8 h-8 flex items-center justify-center"
        >
          <span
            className={`absolute h-0.5 w-6 bg-gray-800 transition-transform duration-300 ${
              open ? "rotate-45" : "-translate-y-2"
            }`}
          />
          <span
            className={`absolute h-0.5 w-6 bg-gray-800 transition-opacity duration-300 ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute h-0.5 w-6 bg-gray-800 transition-transform duration-300 ${
              open ? "-rotate-45" : "translate-y-2"
            }`}
          />
        </div>
      </nav>

      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4">
          <ul className="flex flex-col gap-2 pt-4">
            {routes.map(({ name, route }) => (
              <NavLink
                key={name}
                to={route}
                end
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `text-lg font-medium py-2 px-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#2C4BFD] text-white"
                      : "text-[#4D4D4D] hover:bg-[#2C4BFD] hover:text-white"
                  }`
                }
              >
                {name}
              </NavLink>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between">
            <div className="rounded-lg py-2 px-3 border border-[#BEC7FE] flex items-center gap-3">
              <img src={DiscordLogo} alt="discord" />
              <img src={XLMLogo} alt="xlm" />
              <p className="font-semibold text-base text-[#4D4D4D]">2.56</p>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#CCCCCC]">
              <img src={Avatar} alt="avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
