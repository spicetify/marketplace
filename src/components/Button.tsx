// biome-ignore lint/style/useImportType: React is not a type
import React from "react";

import styles from "../styles/modules/button.module.scss";

// Round is the default style
// Circle is used by the install/remove button
type ButtonType = "round" | "circle";

interface ButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  classes?: string[];
  label?: string | null;
  type?: ButtonType;
  children?: React.ReactNode;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, classes = [], disabled = false, label, type = "button" }) => {
  const buttonType = type || "round";

  const classList = [styles.button];
  if (buttonType === "circle") classList.push(styles.circle);
  if (classes) classList.push(...classes);

  return (
    <button className={classList.join(" ")} onClick={onClick} aria-label={label || ""} disabled={disabled}>
      {children}
    </button>
  );
};

export default Button;
