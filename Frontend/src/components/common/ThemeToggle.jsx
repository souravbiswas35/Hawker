import { useTheme } from "../../context/ThemeContext";
import { FiSun, FiMoon } from "react-icons/fi";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  const getTitle = () => {
    return isDark ? "Switch to Light Mode" : "Switch to Dark Mode";
  };

  return (
    <button
      className="btn btn-outline-light btn-sm rounded-circle theme-toggle-btn"
      onClick={toggleTheme}
      title={getTitle()}
      aria-label={getTitle()}
      style={{
        width: "36px",
        height: "36px",
        padding: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
      }}
    >
      {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
    </button>
  );
}
