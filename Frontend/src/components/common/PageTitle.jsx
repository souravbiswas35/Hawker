import { IconContext } from "react-icons";

export default function PageTitle({
  title,
  subtitle,
  icon: Icon,
  className = "",
}) {
  return (
    <div className={`page-title-wrap ${className}`.trim()}>
      <div className="page-title-head">
        {Icon ? (
          <IconContext.Provider value={{ className: "page-title-icon" }}>
            <Icon />
          </IconContext.Provider>
        ) : null}
        <h2 className="page-title mb-0">{title}</h2>
      </div>
      {subtitle ? <p className="page-subtitle mb-0">{subtitle}</p> : null}
    </div>
  );
}
